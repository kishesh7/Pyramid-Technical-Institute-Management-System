
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  const requestStartedAt = performance.now();

  try {
    // 1. Measure authentication
    const authStartedAt = performance.now();

    const isAdmin = await requireAdmin();

    const authMs = performance.now() - authStartedAt;

    if (!isAdmin) {
      console.info("[dashboard-summary] Unauthorized", {
        authMs: authMs.toFixed(1),
        totalMs: (performance.now() - requestStartedAt).toFixed(1),
      });

      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 },
      );
    }

    // 2. Measure database queries
    const databaseStartedAt = performance.now();

    const [
      members,
      beneficiaries,
      donors,
      eligibleCertificates,
      issuedCertificates,
      programGroups,
      donationGroups,
    ] = await Promise.all([
      prisma.member.count({
        where: { status: "ACTIVE" },
      }),

      prisma.beneficiary.count({
        where: { status: "ACTIVE" },
      }),

      prisma.donor.count({
        where: { status: "ACTIVE" },
      }),

      prisma.enrollmentApplication.count({
        where: {
          status: "COMPLETED",
          completedAt: { not: null },
          certificate: null,
        },
      }),

      prisma.certificate.count(),

      prisma.program.groupBy({
        by: ["trainingStatus"],
        where: {
          status: "ACTIVE",
          project: {
            status: {
              in: ["PLANNING", "ACTIVE", "COMPLETED"],
            },
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

    const databaseMs = performance.now() - databaseStartedAt;

    // 3. Calculate program statistics
    const programCount = (
      status: "UPCOMING" | "ONGOING" | "COMPLETED",
    ) =>
      programGroups.find(
        (group) => group.trainingStatus === status,
      )?._count._all ?? 0;

    // 4. Performance logs
    console.info("[dashboard-summary] Performance", {
      authMs: authMs.toFixed(1),
      databaseMs: databaseMs.toFixed(1),
      totalMs: (performance.now() - requestStartedAt).toFixed(1),
    });

    // 5. Return dashboard data
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
        certificates: {
          eligible: eligibleCertificates,
          issued: issuedCertificates,
        },
      },
    });
  } catch (error) {
    console.error("[dashboard-summary] Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load dashboard statistics.",
      },
      { status: 500 },
    );
  }
}
