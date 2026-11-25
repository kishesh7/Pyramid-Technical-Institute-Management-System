
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parseProgramInput,
  requireProgramAdmin,
} from "@/lib/program-admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [programs, projects] = await Promise.all([
      prisma.program.findMany({
        where: {
          status: "ACTIVE",
          project: {
            status: {
              in: ["PLANNING", "ACTIVE", "COMPLETED"],
            },
          },
        },
        select: {
          id: true,
          projectId: true,
          name: true,
          description: true,
          startDate: true,
          endDate: true,
          trainingStatus: true,
          project: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [{ startDate: "asc" }, { name: "asc" }],
      }),
      prisma.project.findMany({
        where: {
          status: {
            in: ["PLANNING", "ACTIVE", "COMPLETED"],
          },
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      programs: programs.map(({ project, ...program }) => ({
        ...program,
        projectName: project.name,
      })),
      projects,
    });
  } catch (error) {
    console.error("Failed to load programs:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load programs." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!(await requireProgramAdmin())) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request data." },
        { status: 400 },
      );
    }

    const parsed = parseProgramInput(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.message },
        { status: 400 },
      );
    }

    const project = await prisma.project.findFirst({
      where: {
        id: parsed.input.projectId,
        status: { in: ["PLANNING", "ACTIVE", "COMPLETED"] },
      },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, message: "The selected project is unavailable." },
        { status: 400 },
      );
    }

    const program = await prisma.program.create({
      data: {
        ...parsed.input,
        status: "ACTIVE",
      },
      select: { id: true, name: true },
    });

    return NextResponse.json({ success: true, program }, { status: 201 });
  } catch (error) {
    console.error("POST programs error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to add program." },
      { status: 500 },
    );
  }
}
