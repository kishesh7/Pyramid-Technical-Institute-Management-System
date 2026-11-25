import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSize = 5 * 1024 * 1024;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 },
      );
    }

    const { id } = await params;
    const existing = await prisma.galleryImage.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Gallery image not found." },
        { status: 404 },
      );
    }

    let body: FormData;
    try {
      body = await request.formData();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid gallery form data." },
        { status: 400 },
      );
    }

    const title = String(body.get("title") ?? "").trim();
    const subtitle = String(body.get("subtitle") ?? "").trim();
    const imageValue = body.get("image");
    if (imageValue !== null && !(imageValue instanceof File)) {
      return NextResponse.json(
        { success: false, message: "Invalid image upload." },
        { status: 400 },
      );
    }

    const image = imageValue instanceof File ? imageValue : null;

    if (!title || !subtitle) {
      return NextResponse.json(
        { success: false, message: "Title and subtitle are required." },
        { status: 400 },
      );
    }

    if (title.length > 191 || subtitle.length > 191) {
      return NextResponse.json(
        { success: false, message: "Gallery text must be 191 characters or fewer." },
        { status: 400 },
      );
    }

    if (
      image &&
      (!allowedImageTypes.includes(image.type) ||
        image.size === 0 ||
        image.size > maxImageSize)
    ) {
      return NextResponse.json(
        { success: false, message: "Image must be JPG, PNG or WebP and no larger than 5 MB." },
        { status: 400 },
      );
    }

    const imageUrl = image
      ? `data:${image.type};base64,${Buffer.from(
          await image.arrayBuffer(),
        ).toString("base64")}`
      : undefined;

    const galleryImage = await prisma.galleryImage.update({
      where: { id },
      data: {
        title,
        subtitle,
        ...(imageUrl ? { imageUrl } : {}),
      },
      select: {
        id: true,
        title: true,
        subtitle: true,
        imageUrl: true,
        displayOrder: true,
      },
    });

    return NextResponse.json({ success: true, image: galleryImage });
  } catch (error) {
    console.error("PATCH gallery error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to update gallery image." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 },
      );
    }

    const { id } = await params;
    const existing = await prisma.galleryImage.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Gallery image not found." },
        { status: 404 },
      );
    }

    await prisma.galleryImage.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE gallery error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to delete gallery image." },
      { status: 500 },
    );
  }
}
