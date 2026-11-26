import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { generateCertificatePdf } from "@/lib/certificate-pdf";
import { verifySession, sessionCookieName } from "@/lib/session";

export const runtime = "nodejs";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) return false;

  const session = await verifySession(token);
  if (!session) return false;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      roles: {
        include: { role: true },
      },
    },
  });

  return Boolean(
    user &&
      user.status === "ACTIVE" &&
      user.roles.some((userRole) => userRole.role.name === "ADMIN")
  );
}

export async function GET(
  request: Request,
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
    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        enrollment: {
          select: { passportPhotoUrl: true },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { success: false, message: "Certificate not found." },
        { status: 404 }
      );
    }

    if (certificate.status !== "VALID") {
      return NextResponse.json(
        {
          success: false,
          message: "Revoked certificates cannot be downloaded.",
        },
        { status: 410 }
      );
    }

    if (!certificate.enrollment.passportPhotoUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid passport photo is required to generate this certificate.",
        },
        { status: 422 }
      );
    }

    const verificationUrl = new URL(
      `/verify/${encodeURIComponent(certificate.verificationId)}`,
      request.url
    ).toString();
    const pdf = await generateCertificatePdf(
      {
        certificateNo: certificate.certificateNo,
        studentName: certificate.studentName,
        programName: certificate.programName,
        completionDate: certificate.completionDate,
        issueDate: certificate.issueDate,
        passportPhotoUrl: certificate.enrollment.passportPhotoUrl,
      },
      verificationUrl
    );
    const filename = `${certificate.certificateNo.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    )}.pdf`;

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("GET certificate PDF error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to generate the certificate PDF." },
      { status: 500 }
    );
  }
}
