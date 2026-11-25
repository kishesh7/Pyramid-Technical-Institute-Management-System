import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parseProgramInput,
  requireProgramAdmin,
} from "@/lib/program-admin";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await requireProgramAdmin())) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 },
      );
    }

    const { id } = await params;
    const existing = await prisma.program.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Program not found." },
        { status: 404 },
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

    const program = await prisma.program.update({
      where: { id },
      data: parsed.input,
      select: { id: true, name: true },
    });

    return NextResponse.json({ success: true, program });
  } catch (error) {
    console.error("PATCH program error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to update program." },
      { status: 500 },
    );
  }
}
