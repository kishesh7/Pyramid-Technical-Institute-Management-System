import { compare, hash } from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionCookieName, verifySession } from "@/lib/session";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (
    !isRecord(body) ||
    typeof body.currentPassword !== "string" ||
    typeof body.newPassword !== "string"
  ) {
    return NextResponse.json(
      { error: "Current and new passwords are required." },
      { status: 400 },
    );
  }

  const { currentPassword, newPassword } = body;

  if (
    !currentPassword ||
    newPassword.length < 6 ||
    Buffer.byteLength(newPassword, "utf8") > 72
  ) {
    return NextResponse.json(
      { error: "Use a new password of at least 6 characters and no more than 72 bytes." },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        passwordHash: true,
        status: true,
        roles: {
          select: { role: { select: { name: true } } },
        },
      },
    });

    const isAdmin = user?.roles.some(({ role }) => role.name === "ADMIN");
    if (!user || user.status !== "ACTIVE" || !isAdmin) {
      return NextResponse.json(
        { error: "This account cannot change its password." },
        { status: 403 },
      );
    }

    if (!(await compare(currentPassword, user.passwordHash))) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 },
      );
    }

    if (await compare(newPassword, user.passwordHash)) {
      return NextResponse.json(
        { error: "Choose a password different from your current one." },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash: await hash(newPassword, 12) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password change failed:", error);
    return NextResponse.json(
      { error: "Unable to change password right now." },
      { status: 500 },
    );
  }
}
