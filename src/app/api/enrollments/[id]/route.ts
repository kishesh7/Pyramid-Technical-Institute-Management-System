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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const application = await prisma.enrollmentApplication.findUnique({
      where: { id },
      select: {
        citizenshipUrl: true,
        passportPhotoUrl: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, message: "Application not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error("GET enrollment document error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve the uploaded document." },
      { status: 500 }
    );
  }
}

// PATCH: Update enrollment status and admin notes
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid request data." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

  const validStatuses = [
  "PENDING",
  "CONTACTED",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
];

    const hasStatus = Object.prototype.hasOwnProperty.call(data, "status");
    const hasNotes = Object.prototype.hasOwnProperty.call(data, "adminNotes");

    if (!hasStatus && !hasNotes) {
      return NextResponse.json(
        { success: false, message: "Nothing to update." },
        { status: 400 }
      );
    }

    if (
      hasStatus &&
      (typeof data.status !== "string" ||
        !validStatuses.includes(data.status))
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid application status." },
        { status: 400 }
      );
    }

    if (
      hasNotes &&
      data.adminNotes !== null &&
      typeof data.adminNotes !== "string"
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid admin notes." },
        { status: 400 }
      );
    }

    const adminNotes = hasNotes
      ? typeof data.adminNotes === "string"
        ? data.adminNotes.trim()
        : null
      : undefined;

    if (adminNotes && adminNotes.length > 3000) {
      return NextResponse.json(
        { success: false, message: "Admin notes are too long." },
        { status: 400 }
      );
    }

    const existing = await prisma.enrollmentApplication.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Application not found." },
        { status: 404 }
      );
    }

   const status = hasStatus
  ? data.status as
      | "PENDING"
      | "CONTACTED"
      | "APPROVED"
      | "REJECTED"
      | "COMPLETED"
  : undefined;

    const application = await prisma.enrollmentApplication.update({
      where: { id },
   data: {
  ...(status !== undefined
    ? {
        status,
        reviewedAt:
          status === "APPROVED" || status === "REJECTED"
            ? new Date()
            : null,
        completedAt:
          status === "COMPLETED"
            ? new Date()
            : null,
      }
    : {}),
  ...(hasNotes ? { adminNotes } : {}),
},
      select: {
        id: true,
        fullName: true,
        age: true,
        phone: true,
        email: true,
        programId: true,
        educationLevel: true,
        gender: true,
        address: true,
        motivation: true,
        status: true,
        adminNotes: true,
        reviewedAt: true,
        createdAt: true,
        updatedAt: true,
        program: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Application updated successfully.",
      application,
    });
  } catch (error) {
    console.error("PATCH enrollment error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update application." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const existing = await prisma.enrollmentApplication.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Application not found." },
        { status: 404 }
      );
    }

    await prisma.enrollmentApplication.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Application deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE enrollment error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to delete application." },
      { status: 500 }
    );
  }
}