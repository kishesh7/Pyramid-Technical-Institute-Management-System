import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (
      typeof body.applicantName !== "string" ||
      !body.applicantName.trim()
    ) {
      return NextResponse.json(
        { message: "आवेदकको नाम आवश्यक छ।" },
        { status: 400 }
      );
    }

    if (
      typeof body.age !== "string" ||
      !Number.isFinite(Number(body.age)) ||
      Number(body.age) <= 0
    ) {
      return NextResponse.json(
        { message: "कृपया सही उमेर भर्नुहोस्।" },
        { status: 400 }
      );
    }

    const applicationNumber = `PYR-${randomUUID()
      .replace(/-/g, "")
      .slice(0, 10)
      .toUpperCase()}`;

    const application = await prisma.trainingApplication.create({
      data: {
        applicationNumber,
        applicantName: body.applicantName.trim(),
        data: body,
      },
    });

    return NextResponse.json(
      {
        success: true,
        applicationNumber: application.applicationNumber,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Training application submission failed:", error);

    return NextResponse.json(
      { message: "आवेदन पेश गर्न सकिएन। कृपया फेरि प्रयास गर्नुहोस्।" },
      { status: 500 }
    );
  }
}