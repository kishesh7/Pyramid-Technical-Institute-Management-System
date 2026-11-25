import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
import { cookies } from "next/headers";
import {
  verifySession,
  sessionCookieName,
} from "@/lib/session";
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

// GET: Retrieve enrollment applications (Admin only)
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "ALL";

    const page = Math.max(
      1,
      Number(searchParams.get("page")) || 1
    );

    const limit = 20;
    const skip = (page - 1) * limit;

    const validStatuses = [
      "ALL",
      "PENDING",
      "CONTACTED",
      "APPROVED",
      "REJECTED",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid enrollment status." },
        { status: 400 }
      );
    }

    const where = {
      ...(status !== "ALL"
        ? { status: status as
            | "PENDING"
            | "CONTACTED"
            | "APPROVED"
            | "REJECTED" }
        : {}),

      ...(search
        ? {
            OR: [
              { fullName: { contains: search } },
              { phone: { contains: search } },
              { email: { contains: search } },
              { program: { name: { contains: search } } },
            ],
          }
        : {}),
    };

    if (searchParams.get("view") === "dashboard") {
      const [applications, pending] = await Promise.all([
        prisma.enrollmentApplication.findMany({
          where,
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            status: true,
            createdAt: true,
            program: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        prisma.enrollmentApplication.count({
          where: { status: "PENDING" },
        }),
      ]);

      return NextResponse.json({
        success: true,
        applications,
        summary: { pending },
      });
    }

    const [applications, total, counts] = await Promise.all([
      prisma.enrollmentApplication.findMany({
        where,
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
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),

      prisma.enrollmentApplication.count({ where }),

      prisma.enrollmentApplication.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    const summary = {
      total: counts.reduce((sum, item) => sum + item._count._all, 0),
      pending: counts.find((item) => item.status === "PENDING")?._count._all ?? 0,
      contacted: counts.find((item) => item.status === "CONTACTED")?._count._all ?? 0,
      approved: counts.find((item) => item.status === "APPROVED")?._count._all ?? 0,
      rejected: counts.find((item) => item.status === "REJECTED")?._count._all ?? 0,
    };

    return NextResponse.json({
      success: true,
      applications,
      summary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET enrollments error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve applications." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();

    const fullName = String(body.get("name") ?? "").trim();
    const phone = String(body.get("phone") ?? "").trim();
    const email = String(body.get("email") ?? "").trim();
    const address = String(body.get("address") ?? "").trim();
    const motivation = String(body.get("motivation") ?? "").trim();
    const educationLevel = String(body.get("education") ?? "").trim();
    const gender = String(body.get("gender") ?? "").trim();
    const programId = String(body.get("program") ?? "").trim();
    const age = Number(body.get("age"));
    const citizenship = body.get("citizenship");
    const passportPhoto = body.get("passportPhoto");

    if (
      !fullName ||
      !phone ||
      !address ||
      !programId ||
      !(citizenship instanceof File) ||
      citizenship.size === 0 ||
      !(passportPhoto instanceof File) ||
      passportPhoto.size === 0 ||
      !Number.isInteger(age) ||
      age < 1 ||
      age > 120
    ) {
      return NextResponse.json(
        { success: false, message: "Please provide all required information." },
        { status: 400 }
      );
    }

    if (
      fullName.length > 150 ||
      phone.length > 30 ||
      address.length > 1000 ||
      motivation.length > 3000
    ) {
      return NextResponse.json(
        { success: false, message: "Some submitted fields are too long." },
        { status: 400 }
      );
    }

    if (
      email &&
      (email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    ) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const allowedCitizenshipTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (
      citizenship instanceof File &&
      (!allowedCitizenshipTypes.includes(citizenship.type) ||
        citizenship.size > 5 * 1024 * 1024)
    ) {
      return NextResponse.json(
        { success: false, message: "Citizenship must be a JPG, PNG or PDF up to 5 MB." },
        { status: 400 }
      );
    }

    if (
      passportPhoto instanceof File &&
      (!["image/jpeg", "image/png"].includes(passportPhoto.type) ||
        passportPhoto.size > 5 * 1024 * 1024)
    ) {
      return NextResponse.json(
        { success: false, message: "Passport-size photo must be a JPG or PNG up to 5 MB." },
        { status: 400 }
      );
    }

    const program = await prisma.program.findFirst({
      where: {
        id: programId,
        status: "ACTIVE",
        trainingStatus: { in: ["UPCOMING", "ONGOING"] },
        project: {
          status: { in: ["PLANNING", "ACTIVE", "COMPLETED"] },
        },
      },
      select: { id: true },
    });

    if (!program) {
      return NextResponse.json(
        { success: false, message: "The selected program is unavailable." },
        { status: 400 }
      );
    }

    const citizenshipBuffer = citizenship instanceof File
      ? Buffer.from(await citizenship.arrayBuffer())
      : null;
    const citizenshipUrl = citizenshipBuffer
      ? `data:${citizenship.type};base64,${citizenshipBuffer.toString("base64")}`
      : null;
    const passportPhotoBuffer = passportPhoto instanceof File
      ? Buffer.from(await passportPhoto.arrayBuffer())
      : null;
    const passportPhotoUrl = passportPhotoBuffer
      ? `data:${passportPhoto.type};base64,${passportPhotoBuffer.toString("base64")}`
      : null;
    const application = await prisma.enrollmentApplication.create({
      data: {
        fullName,
        age,
        phone,
        email: email || null,
        address,
        motivation: motivation || null,
        educationLevel: educationLevel || null,
        gender: gender || null,
        programId,
        citizenshipUrl,
        passportPhotoUrl,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your application has been submitted successfully.",
        application,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Enrollment submission failed:", error);

  return NextResponse.json(
    {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unknown enrollment error",
    },
    { status: 500 }
  );
}
}