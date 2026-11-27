
import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  sessionCookieName,
  sessionDuration,
} from "@/lib/session";

export const runtime = "nodejs";

const MAX_BODY_SIZE = 8 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export async function POST(request: Request) {
  try {
    // Accept JSON requests only
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json." },
        { status: 415 }
      );
    }

    // Check declared body size
    const contentLength = Number(request.headers.get("content-length") || 0);

    if (contentLength > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: "Request body is too large." },
        { status: 413 }
      );
    }

    const rawBody = await request.text();

    // Also check actual body size
    if (new TextEncoder().encode(rawBody).length > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: "Request body is too large." },
        { status: 413 }
      );
    }

    let body: unknown;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    if (
      !isRecord(body) ||
      typeof body.email !== "string" ||
      typeof body.password !== "string"
    ) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const email = body.email.trim().toLowerCase();
    const password = body.password;

    if (
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !password ||
      password.length > 1024
    ) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        status: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const passwordMatches = user
      ? await compare(password, user.passwordHash)
      : false;

    const isAdmin =
      user?.roles.some(({ role }) => role.name === "ADMIN") ?? false;

    if (
      !user ||
      !passwordMatches ||
      user.status !== "ACTIVE" ||
      !isAdmin
    ) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = await createSession(user.id);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

    response.cookies.set(sessionCookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: sessionDuration,
    });

    return response;
  } catch (error) {
    // Keep database and internal error details out of API responses
    console.error("Admin login failed:", error);

    return NextResponse.json(
      { error: "Unable to process login. Please try again later." },
      { status: 500 }
    );
  }
}
