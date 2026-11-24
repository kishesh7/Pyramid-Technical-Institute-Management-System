import { NextResponse } from "next/server";
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const existing = await prisma.partner.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Partner not found." },
        { status: 404 }
      );
    }

    await prisma.partner.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE partner error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to delete partner." },
      { status: 500 }
    );
  }
}
