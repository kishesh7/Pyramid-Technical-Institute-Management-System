import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const donors = await prisma.donor.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        organizationName: true,
        imageUrl: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, donors });
  } catch (error) {
    console.error("GET public donors error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to retrieve donors." },
      { status: 500 }
    );
  }
}
