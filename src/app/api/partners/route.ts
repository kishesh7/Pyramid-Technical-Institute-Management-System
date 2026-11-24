import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { sessionCookieName, verifySession } from "@/lib/session";

export const runtime = "nodejs";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (!token) return false;

  const session = await verifySession(token);
  if (!session) return false;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { roles: { include: { role: true } } },
  });

  return Boolean(
    user &&
      user.status === "ACTIVE" &&
      user.roles.some((userRole) => userRole.role.name === "ADMIN")
  );
}

export async function GET() {
  try {
    const partners = await prisma.partner.findMany({
      select: {
        id: true,
        name: true,
        mark: true,
        type: true,
        since: true,
        displayOrder: true,
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ success: true, partners });
  } catch (error) {
    console.error("GET partners error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to retrieve partners." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid request data." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;
    const name = typeof data.name === "string" ? data.name.trim() : "";
    const type = typeof data.type === "string" ? data.type.trim() : "";
    const since = typeof data.since === "string" ? data.since.trim() : "";
    const suppliedMark = typeof data.mark === "string" ? data.mark.trim() : "";
    const mark =
      suppliedMark ||
      name
        .split(/\s+/)
        .map((word) => word[0])
        .join("")
        .slice(0, 4)
        .toUpperCase();

    if (!name || !type || !since || !mark) {
      return NextResponse.json(
        { success: false, message: "Partner name, type and partnership details are required." },
        { status: 400 }
      );
    }

    if (name.length > 191 || type.length > 191 || since.length > 191 || mark.length > 8) {
      return NextResponse.json(
        { success: false, message: "Partner details exceed the allowed length." },
        { status: 400 }
      );
    }

    const existing = await prisma.partner.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "A partner with this name already exists." },
        { status: 409 }
      );
    }

    const lastPartner = await prisma.partner.findFirst({
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });

    const partner = await prisma.partner.create({
      data: {
        name,
        type,
        since,
        mark,
        displayOrder: (lastPartner?.displayOrder ?? -1) + 1,
      },
      select: {
        id: true,
        name: true,
        mark: true,
        type: true,
        since: true,
        displayOrder: true,
      },
    });

    return NextResponse.json({ success: true, partner }, { status: 201 });
  } catch (error) {
    console.error("POST partners error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to add partner." },
      { status: 500 }
    );
  }
}
