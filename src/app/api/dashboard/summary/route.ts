import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 },
      );
    }

    const [members, beneficiaries, donors, programGroups, donationGroups] =
      await Promise.all([
        prisma.member.count({ where: { status: "ACTIVE" } }),
        prisma.beneficiary.count({ where: { status: "ACTIVE" } }),
        prisma.donor.count({ where: { status: "ACTIVE" } }),
        prisma.program.groupBy({
          by: ["trainingStatus"],
          where: {
            status: "ACTIVE",
            project: {
              status: { in: ["PLANNING", "ACTIVE", "COMPLETED"] },
            },
          },
          _count: { _all: true },
        }),
        prisma.donation.groupBy({
          by: ["currency"],
          _sum: { amount: true },
          _count: { _all: true },
          orderBy: { currency: "asc" },
        }),
      ]);

    const programCount = (status: "UPCOMING" | "ONGOING" | "COMPLETED") =>
      programGroups.find((group) => group.trainingStatus === status)?._count
        ._all ?? 0;

    return NextResponse.json({
      success: true,
      summary: {
        members,
        beneficiaries,
        donors,
        programs: {
          upcoming: programCount("UPCOMING"),
          ongoing: programCount("ONGOING"),
          completed: programCount("COMPLETED"),
        },
        donations: donationGroups.map((group) => ({
          currency: group.currency,
          total: group._sum.amount?.toString() ?? "0",
          count: group._count._all,
        })),
      },
    });
  } catch (error) {
    console.error("GET dashboard summary error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load dashboard statistics." },
      { status: 500 },
    );
  }
}
