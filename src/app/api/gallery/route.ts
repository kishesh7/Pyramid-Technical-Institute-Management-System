import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSize = 5 * 1024 * 1024;

function isImageFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

function isInvalidImage(file: File) {
  return (
    !allowedImageTypes.includes(file.type) ||
    file.size > maxImageSize
  );
}

async function toImageUrl(file: File) {
  const contents = Buffer.from(await file.arrayBuffer()).toString("base64");
  return `data:${file.type};base64,${contents}`;
}

export async function GET() {
  try {
    const images = await prisma.galleryImage.findMany({
      select: {
        id: true,
        title: true,
        subtitle: true,
        imageUrl: true,
        displayOrder: true,
      },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ success: true, images });
  } catch (error) {
    console.error("GET gallery error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load gallery images." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 },
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
    const image = body.get("image");

    if (!title || !subtitle || !isImageFile(image)) {
      return NextResponse.json(
        { success: false, message: "Title, subtitle and an image are required." },
        { status: 400 },
      );
    }

    if (title.length > 191 || subtitle.length > 191) {
      return NextResponse.json(
        { success: false, message: "Gallery text must be 191 characters or fewer." },
        { status: 400 },
      );
    }

    if (isInvalidImage(image)) {
      return NextResponse.json(
        { success: false, message: "Image must be JPG, PNG or WebP and no larger than 5 MB." },
        { status: 400 },
      );
    }

    const lastImage = await prisma.galleryImage.findFirst({
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });

    const galleryImage = await prisma.galleryImage.create({
      data: {
        title,
        subtitle,
        imageUrl: await toImageUrl(image),
        displayOrder: (lastImage?.displayOrder ?? -1) + 1,
      },
      select: {
        id: true,
        title: true,
        subtitle: true,
        imageUrl: true,
        displayOrder: true,
      },
    });

    return NextResponse.json(
      { success: true, image: galleryImage },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST gallery error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to add gallery image." },
      { status: 500 },
    );
  }
}
