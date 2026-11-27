
"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  dashboardQueryKeys,
  fetchDashboardData,
} from "@/lib/dashboard-data";

const stats = [
  {
    key: "members",
    title: "Total Members",
    description: "Active registered members",
    icon: "👤",
  },
  {
    key: "beneficiaries",
    title: "Beneficiaries",
    description: "People receiving support",
    icon: "🤝",
  },
  {
    key: "donors",
    title: "Total Donors",
    description: "Active donor records",
    icon: "💲",
  },
  {
    key: "ongoingPrograms",
    title: "Ongoing Programs",
    description: "Currently running training programs",
    icon: "⏳ ",
  },
  {
    key: "eligibleCertificates",
    title: "Eligible Certificates",
    description: "Completed training awaiting certificates",
    icon: "🎓",
    href: "/dashboard/certificates?tab=eligible",
  },
  {
    key: "issuedCertificates",
    title: "Issued Certificates",
    description: "Certificates already issued",
    icon: "📜",
    href: "/dashboard/certificates?tab=issued",
  },
];

const activities = [
  "Your Pyramid NGO dashboard is ready.",
  "Connect your organization modules to start managing records.",
  "Recent donations and program activities will appear here.",
];

type DashboardSummary = {
  members: number;
  beneficiaries: number;
  donors: number;
  programs: {
    upcoming: number;
    ongoing: number;
    completed: number;
  };
  certificates: {
    eligible: number;
    issued: number;
  };
  donations: {
    currency: string;
    total: string;
    count: number;
  }[];
};

type Enrollment = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  status: string;
  createdAt: string;
  program: {
    id: string;
    name: string;
  };
};

export default function DashboardPage() {
  const summaryQuery = useQuery({
    queryKey: dashboardQueryKeys.summary,
    queryFn: () =>
      fetchDashboardData<{ summary: DashboardSummary }>(
        "/api/dashboard/summary",
      ),
    refetchInterval: 60_000,
  });
  const notificationsQuery = useQuery({
    queryKey: dashboardQueryKeys.notifications,
    queryFn: () =>
      fetchDashboardData<{
        applications: Enrollment[];
        summary: { pending: number };
      }>("/api/enrollments?status=PENDING&page=1&view=dashboard"),
    staleTime: 10_000,
  });
  const summary = summaryQuery.data?.summary ?? null;
  const applications = notificationsQuery.data?.applications ?? [];
  const pendingCount = Number(notificationsQuery.data?.summary.pending ?? 0);
  const summaryLoading = summaryQuery.isPending;
  const summaryError =
    summaryQuery.isError && !summary
      ? "Could not load live organization statistics."
      : "";
  const loadingEnrollments = notificationsQuery.isPending;
  const enrollmentError =
    notificationsQuery.isError && !notificationsQuery.data
      ? "Could not load new enrollment applications."
      : "";

  const statValues: Record<string, number | undefined> = {
    members: summary?.members,
    beneficiaries: summary?.beneficiaries,
    donors: summary?.donors,
    ongoingPrograms: summary?.programs.ongoing,
    eligibleCertificates: summary?.certificates.eligible,
    issuedCertificates: summary?.certificates.issued,
  };

  const programBreakdown = [
    { key: "upcoming", label: "Upcoming", value: summary?.programs.upcoming ?? 0, style: "bg-emerald-500" },
    { key: "ongoing", label: "Ongoing", value: summary?.programs.ongoing ?? 0, style: "bg-orange-500" },
    { key: "completed", label: "Completed", value: summary?.programs.completed ?? 0, style: "bg-sky-600" },
  ];
  const maxProgramCount = Math.max(1, ...programBreakdown.map((item) => item.value));

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Welcome section
      <section className="relative overflow-hidden rounded-[24px] border border-sky-100 bg-[linear-gradient(135deg,#ffffff_0%,#eff8ff_58%,#dff3ff_100%)] px-6 py-7 shadow-[0_18px_50px_rgba(14,116,144,0.10)] sm:px-8">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-sky-300/20 blur-2xl" />
        <div className="relative">
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Welcome to Pyramid NGO
          </h1>
        </div>
      </section> */}

      {/* Statistics */}
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => {
          const card = (
            <div className="group rounded-2xl border border-sky-100/80 bg-white p-5 shadow-[0_12px_32px_rgba(14,116,144,0.07)] transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_18px_38px_rgba(14,116,144,0.13)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  {stat.title}
                </p>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-100 bg-[linear-gradient(135deg,#f0f9ff,#bae6fd)] text-xl text-sky-700 shadow-sm transition group-hover:scale-105">
                  {stat.icon}
                </span>
              </div>

              <p className="mt-4 text-3xl font-bold text-slate-900">
                {summaryLoading
                  ? "…"
                  : summaryError
                    ? "—"
                    : (statValues[stat.key] ?? 0).toLocaleString()}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {stat.description}
              </p>
            </div>
          );

          return stat.href ? (
            <Link
              key={stat.title}
              href={stat.href}
              aria-label={`Open ${stat.title} in Certificate Management`}
              className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2"
            >
              {card}
            </Link>
          ) : (
            <div key={stat.title}>{card}</div>
          );
        })}
      </section>

      {/* New Enrollment Notifications */}
      <section className="overflow-hidden rounded-2xl border border-sky-100/80 bg-white shadow-[0_14px_40px_rgba(14,116,144,0.08)]">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold text-slate-800">
                New Enrollment Notifications
              </h2>

              {pendingCount > 0 && (
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                  {pendingCount} Pending
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Recently submitted training applications.
            </p>
          </div>

          <Link
            href="/dashboard/enrollments"
            className="inline-flex items-center justify-center rounded-xl bg-[linear-gradient(135deg,#0284c7,#0369a1)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(2,132,199,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(2,132,199,0.30)]"
          >
            View All Applications
            <span className="ml-2">→</span>
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {loadingEnrollments ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading enrollment notifications...
            </div>
          ) : enrollmentError ? (
            <div className="p-8 text-center">
              <p className="text-sm text-red-600">{enrollmentError}</p>
              <button
                type="button"
                onClick={() => void notificationsQuery.refetch()}
                className="mt-3 text-sm font-semibold text-sky-700 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-3xl">📭</div>
              <h3 className="mt-3 font-semibold text-slate-700">
                No new applications
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                New pending enrollment applications will appear here.
              </p>
            </div>
          ) : (
            applications.slice(0, 5).map((application) => (
              <div
                key={application.id}
                className="flex flex-col gap-3 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 font-bold text-sky-700">
                    {application.fullName.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800">
                      {application.fullName}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {application.program.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {application.phone}
                      {" · "}
                      {new Date(application.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:justify-end">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    Pending
                  </span>

                  <Link
                    href="/dashboard/enrollments"
                    className="text-sm font-semibold text-sky-700 hover:text-sky-900"
                  >
                    Review →
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {!loadingEnrollments &&
          !enrollmentError &&
          applications.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
              <p className="text-xs text-slate-500">
                Showing the latest {Math.min(applications.length, 5)} pending
                applications. Automatically refreshes every 15 seconds.
              </p>
            </div>
          )}
      </section>

      {/* Main dashboard panels */}
      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-sky-100/80 bg-white p-6 shadow-[0_14px_40px_rgba(14,116,144,0.08)] xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-800">
                Organization Overview
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Your organization&apos;s performance at a glance.
              </p>
            </div>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
              Dashboard
            </span>
          </div>

          {summaryError ? (
            <div className="mt-6 rounded-xl border border-rose-100 bg-rose-50 p-5">
              <p className="text-sm text-rose-700" role="alert">{summaryError}</p>
              <button
                className="mt-3 text-sm font-semibold text-rose-800 hover:underline"
                onClick={() => void summaryQuery.refetch()}
                type="button"
              >
                Try again
              </button>
            </div>
          ) : summaryLoading ? (
            <div className="mt-6 rounded-xl border border-sky-100 bg-sky-50/60 p-8 text-center text-sm text-slate-500">
              Loading organization statistics...
            </div>
          ) : (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <section className="rounded-xl border border-sky-100 bg-sky-50/50 p-5">
                <h3 className="font-semibold text-slate-800">
                  Training programs by status
                </h3>
                <div className="mt-5 space-y-4">
                  {programBreakdown.map((item) => (
                    <div key={item.key}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="font-semibold text-slate-800">
                          {item.value.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white">
                        <div
                          className={`h-full rounded-full ${item.style}`}
                          style={{
                            width: `${(item.value / maxProgramCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-sky-100 bg-white p-5">
                <h3 className="font-semibold text-slate-800">
                  Donations received
                </h3>
                {summary?.donations.length ? (
                  <div className="mt-4 divide-y divide-slate-100">
                    {summary.donations.map((donation) => (
                      <div
                        className="flex items-center justify-between gap-4 py-3"
                        key={donation.currency}
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {donation.currency}{" "}
                            {Number(donation.total).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {donation.count.toLocaleString()}{" "}
                            {donation.count === 1 ? "donation" : "donations"}
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {donation.currency}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    No donations have been recorded yet.
                  </p>
                )}
              </section>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-sky-100/80 bg-white p-6 shadow-[0_14px_40px_rgba(14,116,144,0.08)]">
          <h2 className="font-bold text-slate-800">Recent Activity</h2>
          <p className="mt-1 text-sm text-slate-500">
            Latest organization updates.
          </p>

          <div className="mt-6 space-y-5">
            {activities.map((activity) => (
              <div key={activity} className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-sky-500" />
                <p className="text-sm leading-6 text-slate-600">
                  {activity}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick access */}
      <section>
        <h2 className="text-lg font-bold text-slate-800">
          Quick Information
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Organization", "Pyramid NGO"],
            ["System", "NGO Management System"],
            ["Account Type", "Administrator"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-sky-100/80 bg-white p-5 shadow-[0_12px_32px_rgba(14,116,144,0.06)]"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                {label}
              </p>
              <p className="mt-2 font-semibold text-slate-800">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
