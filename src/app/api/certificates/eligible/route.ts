
import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const applications =
      await prisma.enrollmentApplication.findMany({
        where: {
          status: "COMPLETED",
          completedAt: { not: null },
          certificate: null,
        },
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          completedAt: true,
          program: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          completedAt: "desc",
        },
      });

    return NextResponse.json({
      success: true,
      total: applications.length,
      applications,
    });
  } catch (error) {
    console.error("GET eligible certificates error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve eligible students.",
      },
      { status: 500 }
    );
  }
}
