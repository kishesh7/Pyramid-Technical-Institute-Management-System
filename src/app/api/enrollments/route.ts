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

    const [applications, total, counts] = await Promise.all([
      prisma.enrollmentApplication.findMany({
        where,
        include: {
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
    const body = await request.json();

    const fullName = String(body.fullName ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const email = String(body.email ?? "").trim();
    const address = String(body.address ?? "").trim();
    const motivation = String(body.motivation ?? "").trim();
    const educationLevel = String(body.educationLevel ?? "").trim();
    const gender = String(body.gender ?? "").trim();
    const programId = String(body.programId ?? "").trim();
    const age = Number(body.age);

    if (
      !fullName ||
      !phone ||
      !address ||
      !programId ||
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

    const program = await prisma.program.findFirst({
      where: {
        id: programId,
        status: "ACTIVE",
        project: {
          status: { in: ["PLANNING", "ACTIVE"] },
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