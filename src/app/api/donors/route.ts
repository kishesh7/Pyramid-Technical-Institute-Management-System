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
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const donors = await prisma.donor.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        organizationName: true,
        status: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, donors });
  } catch (error) {
    console.error("GET donors error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to retrieve donors." },
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

    const body = await request.formData();
    const organizationName = String(body.get("organizationName") ?? "").trim();
    const donorName = String(body.get("donorName") ?? "").trim();
    const image = body.get("image");
    const uploadedImage =
      image instanceof File && image.size > 0 ? image : null;

    if (!organizationName || !donorName) {
      return NextResponse.json(
        { success: false, message: "Organization name and donor name are required." },
        { status: 400 }
      );
    }

    if (organizationName.length > 191 || donorName.length > 191) {
      return NextResponse.json(
        { success: false, message: "Donor names must be 191 characters or fewer." },
        { status: 400 }
      );
    }

    if (
      uploadedImage &&
      (!["image/jpeg", "image/png", "image/webp"].includes(uploadedImage.type) ||
        uploadedImage.size > 5 * 1024 * 1024)
    ) {
      return NextResponse.json(
        { success: false, message: "Donor image must be JPG, PNG or WebP and no larger than 5 MB." },
        { status: 400 }
      );
    }

    const imageUrl = uploadedImage
      ? `data:${uploadedImage.type};base64,${Buffer.from(
          await uploadedImage.arrayBuffer()
        ).toString("base64")}`
      : null;

    const donor = await prisma.donor.create({
      data: {
        name: donorName,
        organizationName,
        imageUrl,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        organizationName: true,
        status: true,
      },
    });

    return NextResponse.json({ success: true, donor }, { status: 201 });
  } catch (error) {
    console.error("POST donor error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to add donor." },
      { status: 500 }
    );
  }
}
