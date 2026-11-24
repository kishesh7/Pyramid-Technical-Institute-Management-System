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
    const documentType = new URL(request.url).searchParams.get("type");
    if (documentType !== "citizenship" && documentType !== "passportPhoto") {
      return NextResponse.json(
        { success: false, message: "Invalid document type." },
        { status: 400 }
      );
    }

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

    const match =
      /^data:(image\/(?:jpeg|png)|application\/pdf);base64,([A-Za-z0-9+/=]+)$/.exec(
        (documentType === "citizenship"
          ? application.citizenshipUrl
          : application.passportPhotoUrl) ?? ""
      );

    if (!match) {
      return NextResponse.json(
        { success: false, message: "No valid document is available." },
        { status: 404 }
      );
    }

    const contentType = match[1];
    const extension =
      contentType === "application/pdf"
        ? "pdf"
        : contentType === "image/png"
          ? "png"
          : "jpg";

    return new Response(Buffer.from(match[2], "base64"), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${documentType}.${extension}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("GET enrollment document file error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to open the uploaded document." },
      { status: 500 }
    );
  }
}
