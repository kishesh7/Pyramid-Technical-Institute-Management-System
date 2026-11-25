
"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  dashboardQueryKeys,
  fetchDashboardData,
} from "@/lib/dashboard-data";

type EnrollmentStatus = "PENDING" | "CONTACTED" | "APPROVED" | "REJECTED";

type Application = {
  id: string;
  fullName: string;
  age: number;
  phone: string;
  email: string | null;
  address: string;
  educationLevel: string | null;
  gender: string | null;
  motivation: string | null;
  citizenshipUrl: string | null;
  passportPhotoUrl: string | null;
  status: EnrollmentStatus;
  adminNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  program: {
    id: string;
    name: string;
  };
};

type Summary = {
  total: number;
  pending: number;
  contacted: number;
  approved: number;
  rejected: number;
};

const filters = [
  "ALL",
  "PENDING",
  "CONTACTED",
  "APPROVED",
  "REJECTED",
] as const;

const statusStyles: Record<EnrollmentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONTACTED: "bg-sky-100 text-sky-800",
  APPROVED: "bg-sky-100 text-sky-800",
  REJECTED: "bg-rose-100 text-rose-800",
};

const emptySummary: Summary = {
  total: 0,
  pending: 0,
  contacted: 0,
  approved: 0,
  rejected: 0,
};

export default function EnrollmentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<(typeof filters)[number]>("ALL");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Application | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [notice, setNotice] = useState("");
  const [deleteNotice, setDeleteNotice] = useState("");
  const [documentLoadingId, setDocumentLoadingId] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const applicationsQuery = useQuery({
    queryKey: dashboardQueryKeys.enrollments(debouncedSearch, status, page),
    queryFn: () => {
      const params = new URLSearchParams({
        search: debouncedSearch,
        status,
        page: String(page),
      });

      return fetchDashboardData<{
        applications: Application[];
        summary: Summary;
        pagination: { totalPages: number };
      }>(`/api/enrollments?${params.toString()}`);
    },
  });
  const applications = applicationsQuery.data?.applications ?? [];
  const summary = applicationsQuery.data?.summary ?? emptySummary;
  const totalPages = applicationsQuery.data?.pagination.totalPages || 1;
  const loading = applicationsQuery.isPending;
  const displayError =
    error ||
    (applicationsQuery.isError
      ? applicationsQuery.error.message
      : "");

  async function openApplication(application: Application) {
    setSelected({
      ...application,
      citizenshipUrl: null,
      passportPhotoUrl: null,
    });
    setNotes(application.adminNotes ?? "");
    setNotice("");
    setDocumentError("");
    setDocumentLoadingId(application.id);

    try {
      const response = await fetch(
        `/api/enrollments/${encodeURIComponent(application.id)}`
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load uploaded document.");
      }

      setSelected((current) =>
        current?.id === application.id
          ? {
              ...current,
              citizenshipUrl: result.application.citizenshipUrl,
              passportPhotoUrl: result.application.passportPhotoUrl,
            }
          : current
      );
    } catch (err) {
      setDocumentError(
        err instanceof Error
          ? err.message
          : "Unable to load uploaded document."
      );
    } finally {
      setDocumentLoadingId((current) =>
        current === application.id ? null : current
      );
    }
  }

  async function updateApplication(
    nextStatus?: EnrollmentStatus
  ) {
    if (!selected) return;

    setSaving(true);
    setNotice("");

    try {
      const payload: {
        adminNotes: string;
        status?: EnrollmentStatus;
      } = {
        adminNotes: notes,
      };

      if (nextStatus) {
        payload.status = nextStatus;
      }

      const response = await fetch(
        `/api/enrollments/${encodeURIComponent(selected.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update application.");
      }

      setSelected((current) => ({
        ...result.application,
        citizenshipUrl: current?.citizenshipUrl ?? null,
        passportPhotoUrl: current?.passportPhotoUrl ?? null,
      }));
      setNotes(result.application.adminNotes ?? "");
      setNotice("Application updated successfully.");

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.enrollmentsRoot,
        }),
        queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.notifications,
        }),
      ]);
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Unable to update application."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteApplication(application: Application) {
    if (
      !window.confirm(
        `Permanently delete the application from ${application.fullName}? This cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(application.id);
    setError("");
    setDeleteNotice("");

    try {
      const response = await fetch(
        `/api/enrollments/${encodeURIComponent(application.id)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to delete application.");
      }

      if (selected?.id === application.id) {
        setSelected(null);
      }
      setDeleteNotice(`Application from ${application.fullName} was deleted.`);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.enrollmentsRoot,
        }),
        queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.notifications,
        }),
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete application."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const statCards = [
    { label: "Total Applications", value: summary.total, style: "border-slate-200" },
    { label: "Pending", value: summary.pending, style: "border-amber-300" },
    { label: "Contacted", value: summary.contacted, style: "border-sky-300" },
    { label: "Approved", value: summary.approved, style: "border-sky-300" },
    { label: "Rejected", value: summary.rejected, style: "border-rose-300" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="relative overflow-hidden rounded-[24px] border border-sky-100 bg-[linear-gradient(135deg,#ffffff_0%,#eff8ff_58%,#dff3ff_100%)] px-6 py-7 shadow-[0_18px_50px_rgba(14,116,144,0.10)]">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700">
          Administration
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Enrollment Applications
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Review and manage training program applications.
        </p>
              </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-2xl border-l-4 ${card.style} bg-white p-5 shadow-[0_12px_32px_rgba(14,116,144,0.07)]`}
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {card.value}
            </p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-sky-100/80 bg-white shadow-[0_14px_40px_rgba(14,116,144,0.08)]">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Applications</h2>
            <p className="text-sm text-slate-500">
              Select an application to review its details.
            </p>
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
              setError("");
            }}
            placeholder="Search name, phone, email, program..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 sm:max-w-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 px-4 py-3">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => {
                setStatus(filter);
                setPage(1);
                setError("");
              }}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${
                status === filter
                  ? "bg-sky-700 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {filter === "ALL"
                ? "All"
                : filter.charAt(0) + filter.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {displayError && (
          <div role="alert" className="m-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            {displayError}
          </div>
        )}
        {deleteNotice && (
          <div role="status" className="mx-4 mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            {deleteNotice}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Applicant</th>
                <th className="px-5 py-4">Program</th>
                <th className="px-5 py-4">Phone</th>
                <th className="px-5 py-4">Submitted</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    Loading applications...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    No applications found.
                  </td>
                </tr>
              ) : (
                applications.map((application) => (
                  <tr key={application.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {application.fullName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {application.email || "No email provided"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {application.program.name}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {application.phone}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[application.status]}`}
                      >
                        {application.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openApplication(application)}
                        className="font-semibold text-sky-700 hover:text-sky-900"
                      >
                        View details
                      </button>
                      <button
                        type="button"
                        disabled={deletingId !== null || saving}
                        onClick={() => void deleteApplication(application)}
                        className="font-semibold text-rose-700 hover:text-rose-900 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === application.id ? "Deleting..." : "Delete"}
                      </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
          <p className="text-xs text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {selected && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setSelected(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-dialog-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-200 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                  Application details
                </p>
                <h2
                  id="application-dialog-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  {selected.fullName}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                disabled={saving}
                aria-label="Close details"
                className="rounded-lg px-3 py-1 text-xl text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {[
                ["Age", String(selected.age)],
                ["Phone", selected.phone],
                ["Email", selected.email || "Not provided"],
                ["Program", selected.program.name],
                ["Education", selected.educationLevel || "Not provided"],
                ["Gender", selected.gender || "Not provided"],
                ["Address", selected.address],
                ["Submitted", new Date(selected.createdAt).toLocaleString()],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-medium text-slate-500">{label}</p>
                  <p className="mt-1 break-words text-sm font-medium text-slate-800">
                    {value}
                  </p>
                </div>
              ))}

              {selected.motivation && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-slate-500">
                    Motivation
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                    {selected.motivation}
                  </p>
                </div>
              )}

              <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    label: "Citizenship / Passport Document",
                    type: "citizenship" as const,
                    value: selected.citizenshipUrl,
                  },
                  {
                    label: "Passport-size Photo",
                    type: "passportPhoto" as const,
                    value: selected.passportPhotoUrl,
                  },
                ].map((document) => {
                  const documentHref = `/api/enrollments/${encodeURIComponent(selected.id)}/document?type=${document.type}`;

                  return (
                    <div key={document.type}>
                      <p className="text-xs font-medium text-slate-500">
                        {document.label}
                      </p>
                      {documentLoadingId === selected.id ? (
                        <p className="mt-2 text-sm text-slate-500">Loading document...</p>
                      ) : documentError ? (
                        <p className="mt-2 text-sm text-rose-700">{documentError}</p>
                      ) : document.value?.startsWith("data:image/") ? (
                        <a
                          href={documentHref}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Open full-size ${document.label.toLowerCase()} in a new tab`}
                          className="mt-2 block w-fit cursor-zoom-in"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={document.value}
                            alt={`Open full-size ${document.label.toLowerCase()}`}
                            className="max-h-[60vh] max-w-full rounded-lg border border-slate-200 object-contain"
                          />
                        </a>
                      ) : document.value?.startsWith("data:application/pdf;") ? (
                        <>
                          <iframe
                            src={documentHref}
                            title={document.label}
                            className="mt-2 h-[60vh] w-full rounded-lg border border-slate-200"
                          />
                          <a
                            href={documentHref}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-block text-sm font-semibold text-sky-700 hover:text-sky-900"
                          >
                            Open PDF in a new tab
                          </a>
                        </>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500">
                          No document uploaded.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="adminNotes"
                  className="text-xs font-semibold text-slate-600"
                >
                  Admin review notes
                </label>
                <textarea
                  id="adminNotes"
                  rows={4}
                  maxLength={3000}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Write internal review notes..."
                  className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 p-5">
              <div className="text-xs text-slate-500">
                Current status: <strong>{selected.status}</strong>
                {notice && (
                  <p className="mt-1 text-sky-700">{notice}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={saving || deletingId !== null}
                  onClick={() => void deleteApplication(selected)}
                  className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                >
                  {deletingId === selected.id ? "Deleting..." : "Delete application"}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void updateApplication()}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
                >
                  Save notes
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void updateApplication("CONTACTED")}
                  className="rounded-lg bg-sky-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  Mark contacted
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void updateApplication("REJECTED")}
                  className="rounded-lg bg-rose-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void updateApplication("APPROVED")}
                  className="rounded-lg bg-sky-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  Approve
                </button>
              </div>
            </div>

            {saving && (
              <p className="px-5 pb-4 text-xs text-slate-500">
                Saving application...
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
