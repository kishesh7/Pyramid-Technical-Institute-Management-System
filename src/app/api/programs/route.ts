
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const programs = await prisma.program.findMany({
      where: {
        status: "ACTIVE",
        project: {
          status: {
            in: ["PLANNING", "ACTIVE"],
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        startDate: true,
        endDate: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ success: true, programs });
  } catch (error) {
    console.error("Failed to load programs:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load programs." },
      { status: 500 }
    );
  }
}
