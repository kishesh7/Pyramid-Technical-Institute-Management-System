
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import pyramidLogo from "@/assets/images/pyramidlogo.jpeg";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: "⌂" },
  { label: "Members", href: "/dashboard/members", icon: "♙" },
  { label: "Enrollments", href: "/dashboard/enrollments", icon: "▤" },
  { label: "Beneficiaries", href: "/dashboard/beneficiaries", icon: "♡" },
  { label: "Donors", href: "/dashboard/donors", icon: "♧" },
  { label: "Projects", href: "/dashboard/projects", icon: "◈" },
  { label: "Reports", href: "/dashboard/reports", icon: "▥" },
];

type EnrollmentSummary = {
  pending: number;
};

export default function DashboardShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [pendingEnrollments, setPendingEnrollments] = useState(0);

  // Fetch pending enrollment count from the existing admin API.
  const loadEnrollmentNotifications = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/enrollments?status=PENDING&page=1",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) return;

      const data = await response.json();

      if (data.success && data.summary) {
        const summary = data.summary as EnrollmentSummary;
        setPendingEnrollments(Number(summary.pending) || 0);
      }
    } catch (error) {
      console.error("Unable to load enrollment notifications:", error);
    }
  }, []);

  // Initial fetch and automatic refresh every 15 seconds.
  useEffect(() => {
    loadEnrollmentNotifications();

    const interval = window.setInterval(() => {
      loadEnrollmentNotifications();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [loadEnrollmentNotifications]);

  async function logout() {
    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fbff_0%,#eef7ff_52%,#f8fbff_100%)]">
      {menuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[linear-gradient(180deg,#075985_0%,#0369a1_58%,#0c4a6e_100%)] text-white shadow-[12px_0_40px_rgba(14,116,144,0.16)] transition-transform lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-center border-b border-slate-200 bg-[#f5f5f5] px-4">
          <Image
            src={pyramidLogo}
            alt="Pyramid NGO"
            className="h-20 w-20 object-contain"
            priority
          />
        </div>

        <nav
          className="flex-1 space-y-1 px-3 py-5"
          aria-label="Dashboard navigation"
        >
          {navigation.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                  active
                    ? "bg-white text-sky-800 shadow-[0_8px_24px_rgba(3,105,161,0.24)]"
                    : "text-sky-100 hover:bg-white/15 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="w-5 text-center text-lg">
                    {item.icon}
                  </span>
                  {item.label}
                </span>

                {item.href === "/dashboard/enrollments" &&
                  pendingEnrollments > 0 && (
                    <span
                      className="min-w-6 rounded-full bg-red-500 px-2 py-1 text-center text-xs font-bold text-white"
                      aria-label={`${pendingEnrollments} pending enrollments`}
                    >
                      {pendingEnrollments > 99
                        ? "99+"
                        : pendingEnrollments}
                    </span>
                  )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-sky-100 hover:bg-white/15 hover:text-white disabled:opacity-60"
          >
            <span className="w-5 text-center text-lg">↪</span>
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-sky-100/80 bg-white/90 px-4 shadow-[0_6px_24px_rgba(14,116,144,0.06)] backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setMenuOpen(true)}
              className="rounded-lg border border-slate-200 p-2 text-slate-700 lg:hidden"
            >
              <span className="block h-0.5 w-5 bg-slate-700" />
              <span className="my-1 block h-0.5 w-5 bg-slate-700" />
              <span className="block h-0.5 w-5 bg-slate-700" />
            </button>

            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-sky-700">
                Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">
                Administrator
              </p>
              <p className="text-xs text-slate-500">Admin account</p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-[linear-gradient(135deg,#e0f2fe,#7dd3fc)] font-bold text-sky-800 shadow-[0_8px_20px_rgba(14,165,233,0.20)]">
              A
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
