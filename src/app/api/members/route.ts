
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  verifySession,
  sessionCookieName,
} from "@/lib/session";

export const runtime = "nodejs";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) return null;

  const session = await verifySession(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      roles: {
        include: { role: true },
      },
    },
  });

  const isAdmin = user?.roles.some(
    (userRole) => userRole.role.name === "ADMIN"
  );

  if (!user || user.status !== "ACTIVE" || !isAdmin) {
    return null;
  }

  return user;
}

// GET: Retrieve members
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        { message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "ALL";
    const nameTerms = search.split(/\s+/).filter(Boolean);

    const validStatuses = ["ALL", "ACTIVE", "INACTIVE", "ARCHIVED"];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: "Invalid member status filter." },
        { status: 400 }
      );
    }

    const members = await prisma.member.findMany({
      where: {
        ...(status !== "ALL" ? { status: status as "ACTIVE" | "INACTIVE" | "ARCHIVED" } : {}),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { email: { contains: search } },
                { phone: { contains: search } },
                ...(nameTerms.length > 1
                  ? [
                      {
                        AND: nameTerms.map((term) => ({
                          OR: [
                            { firstName: { contains: term } },
                            { lastName: { contains: term } },
                          ],
                        })),
                      },
                    ]
                  : []),
              ],
            }
          : {}),
      },
      orderBy: [
        { joinedAt: "desc" },
        { lastName: "asc" },
      ],
    });

    return NextResponse.json({
      success: true,
      total: members.length,
      members,
    });
  } catch (error) {
    console.error("GET members error:", error);

    return NextResponse.json(
      { message: "Unable to retrieve members." },
      { status: 500 }
    );
  }
}

// POST: Create a member
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        { message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { message: "Invalid request data." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    const firstName =
      typeof data.firstName === "string" ? data.firstName.trim() : "";
    const lastName =
      typeof data.lastName === "string" ? data.lastName.trim() : "";
    const email =
      typeof data.email === "string"
        ? data.email.trim().toLowerCase()
        : "";
    const phone =
      typeof data.phone === "string" ? data.phone.trim() : "";
    const address =
      typeof data.address === "string" ? data.address.trim() : "";

    if (!firstName || !lastName) {
      return NextResponse.json(
        { message: "First name and last name are required." },
        { status: 400 }
      );
    }

    if (
      firstName.length > 100 ||
      lastName.length > 100 ||
      email.length > 254 ||
      phone.length > 30 ||
      address.length > 500
    ) {
      return NextResponse.json(
        { message: "One or more fields exceed the allowed length." },
        { status: 400 }
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const joinedAt =
      typeof data.joinedAt === "string" && data.joinedAt
        ? new Date(data.joinedAt)
        : new Date();

    if (Number.isNaN(joinedAt.getTime())) {
      return NextResponse.json(
        { message: "Please provide a valid joining date." },
        { status: 400 }
      );
    }

    const member = await prisma.member.create({
      data: {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        address: address || null,
        joinedAt,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Member created successfully.",
        member,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "This email address is already registered." },
        { status: 409 }
      );
    }

    console.error("POST member error:", error);

    return NextResponse.json(
      { message: "Unable to create member." },
      { status: 500 }
    );
  }
}
