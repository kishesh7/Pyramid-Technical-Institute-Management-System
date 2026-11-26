import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes, randomUUID } from "crypto";
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

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      typeof (body as Record<string, unknown>).enrollmentId !== "string"
    ) {
      return NextResponse.json(
        { success: false, message: "A valid enrollment ID is required." },
        { status: 400 }
      );
    }

    const enrollmentId = (
      body as Record<string, string>
    ).enrollmentId.trim();

    if (!enrollmentId) {
      return NextResponse.json(
        { success: false, message: "A valid enrollment ID is required." },
        { status: 400 }
      );
    }

    const enrollment =
      await prisma.enrollmentApplication.findUnique({
        where: { id: enrollmentId },
        select: {
          id: true,
          fullName: true,
          status: true,
          completedAt: true,
          passportPhotoUrl: true,
          certificate: {
            select: {
              id: true,
              certificateNo: true,
            },
          },
          program: {
            select: {
              name: true,
            },
          },
        },
      });

    if (!enrollment) {
      return NextResponse.json(
        { success: false, message: "Enrollment not found." },
        { status: 404 }
      );
    }

    if (enrollment.status !== "COMPLETED" || !enrollment.completedAt) {
      return NextResponse.json(
        {
          success: false,
          message: "Only completed students can receive certificates.",
        },
        { status: 400 }
      );
    }

    if (enrollment.certificate) {
      return NextResponse.json(
        {
          success: false,
          message: "A certificate has already been issued for this student.",
          certificate: enrollment.certificate,
        },
        { status: 409 }
      );
    }

    if (!enrollment.passportPhotoUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "A passport photo is required before issuing a certificate.",
        },
        { status: 400 }
      );
    }

    const year = enrollment.completedAt.getFullYear();
    const certificateNo =
      `PTI-${year}-${randomBytes(4).toString("hex").toUpperCase()}`;
    const verificationId = randomUUID();

    const certificate = await prisma.certificate.create({
      data: {
        enrollmentId: enrollment.id,
        certificateNo,
        verificationId,
        studentName: enrollment.fullName,
        programName: enrollment.program.name,
        completionDate: enrollment.completedAt,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Certificate issued successfully.",
        certificate,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST issue certificate error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to issue certificate.",
      },
      { status: 500 }
    );
  }
}