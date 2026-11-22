
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await prisma.$queryRaw<
      { connected: bigint }[]
    >`SELECT 1 AS connected`;

    return NextResponse.json({
      success: true,
      message: "TiDB Cloud connected successfully!",
      result: result.map((row) => ({
        connected: Number(row.connected),
      })),
    });
  } catch (error) {
    console.error("DATABASE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown database error",
      },
      { status: 500 }
    );
  }
}
