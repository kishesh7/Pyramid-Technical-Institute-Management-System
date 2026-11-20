import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      success: true,
      message: "Database connection successful.",
    });
  } catch (error) {
    console.error("DATABASE ERROR DETAILS:");

    if (error instanceof Error) {
      console.error("Name:", error.name);
      console.error("Message:", error.message);
      console.error("Cause:", error.cause);
      console.dir(error, { depth: 10 });
    } else {
      console.dir(error, { depth: 10 });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed. Check server logs.",
      },
      { status: 500 }
    );
  }
}
