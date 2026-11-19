
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
    user.roles.some((item) => item.role.name === "ADMIN")
  );
}

// GET: List and search staff
export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const params = request.nextUrl.searchParams;
    const search = params.get("search")?.trim() || "";
    const status = params.get("status") || "ALL";

    const staff = await prisma.staff.findMany({
      where: {
        ...(status !== "ALL"
          ? {
              member: {
                status: status as
                  | "ACTIVE"
                  | "INACTIVE"
                  | "ARCHIVED",
              },
            }
          : {}),
        ...(search
          ? {
              OR: [
                { position: { contains: search } },
                { department: { contains: search } },
                {
                  member: {
                    firstName: { contains: search },
                  },
                },
                {
                  member: {
                    lastName: { contains: search },
                  },
                },
                {
                  member: {
                    email: { contains: search },
                  },
                },
                {
                  member: {
                    phone: { contains: search },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        member: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      total: staff.length,
      staff,
    });
  } catch (error) {
    console.error("Staff GET error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load staff records." },
      { status: 500 }
    );
  }
}

// POST: Assign an existing member as staff
export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const memberId =
      typeof body.memberId === "string" ? body.memberId.trim() : "";
    const position =
      typeof body.position === "string" ? body.position.trim() : "";
    const department =
      typeof body.department === "string"
        ? body.department.trim()
        : "";
    const salaryInput = body.salary;

    if (!memberId || !position) {
      return NextResponse.json(
        {
          success: false,
          message: "Member and position are required.",
        },
        { status: 400 }
      );
    }

    if (position.length > 150 || department.length > 150) {
      return NextResponse.json(
        { success: false, message: "Text field is too long." },
        { status: 400 }
      );
    }

    let salary: string | null = null;

    if (
      salaryInput !== undefined &&
      salaryInput !== null &&
      salaryInput !== ""
    ) {
      const parsedSalary = Number(salaryInput);

      if (!Number.isFinite(parsedSalary) || parsedSalary < 0) {
        return NextResponse.json(
          { success: false, message: "Enter a valid salary." },
          { status: 400 }
        );
      }

      salary = parsedSalary.toFixed(2);
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, message: "Selected member was not found." },
        { status: 404 }
      );
    }

    if (member.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "Only active members can be assigned as staff.",
        },
        { status: 400 }
      );
    }

    const staff = await prisma.staff.create({
      data: {
        memberId,
        position,
        department: department || null,
        salary,
      },
      include: {
        member: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Staff member created successfully.",
        staff,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Staff POST error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "This member is already assigned as staff.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to create staff record." },
      { status: 500 }
    );
  }
}
