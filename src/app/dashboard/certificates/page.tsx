
"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type EligibleApplication = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  completedAt: string;
  program: {
    id: string;
    name: string;
  };
};

type Certificate = {
  id: string;
  enrollmentId: string;
  certificateNo: string;
  verificationId: string;
  studentName: string;
  programName: string;
  completionDate: string;
  issueDate: string;
  status: "VALID" | "REVOKED";
  revokedAt: string | null;
  revokeReason: string | null;
};

async function fetchData<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Unable to load data.");
  }

  return result;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CertificatesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const eligibleQuery = useQuery({
    queryKey: ["eligible-certificates"],
    queryFn: () =>
      fetchData<{
        total: number;
        applications: EligibleApplication[];
      }>("/api/certificates/eligible"),
  });

  const certificatesQuery = useQuery({
    queryKey: ["issued-certificates"],
    queryFn: () =>
      fetchData<{
        total: number;
        certificates: Certificate[];
      }>("/api/certificates"),
  });

  const issueMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const response = await fetch("/api/certificates/issue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enrollmentId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to issue certificate.");
      }

      return result;
    },
    onSuccess: async (result) => {
      setError("");
      setNotice(
        `Certificate ${result.certificate.certificateNo} issued successfully.`
      );

      await queryClient.invalidateQueries({
        queryKey: ["eligible-certificates"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["issued-certificates"],
      });
    },
    onError: (err) => {
      setNotice("");
      setError(
        err instanceof Error
          ? err.message
          : "Unable to issue certificate."
      );
    },
  });

  const eligible = eligibleQuery.data?.applications ?? [];
  const certificates = certificatesQuery.data?.certificates ?? [];

  const validCount = certificates.filter(
    (certificate) => certificate.status === "VALID"
  ).length;

  const revokedCount = certificates.filter(
    (certificate) => certificate.status === "REVOKED"
  ).length;

  const filteredCertificates = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return certificates;

    return certificates.filter(
      (certificate) =>
        certificate.studentName.toLowerCase().includes(term) ||
        certificate.certificateNo.toLowerCase().includes(term) ||
        certificate.programName.toLowerCase().includes(term)
    );
  }, [certificates, search]);

  const loading = eligibleQuery.isPending || certificatesQuery.isPending;
  const loadError =
    eligibleQuery.error?.message || certificatesQuery.error?.message;

  async function downloadCertificate(certificate: Certificate) {
    setDownloadingId(certificate.id);
    setNotice("");
    setError("");

    try {
      const response = await fetch(
        `/api/certificates/${encodeURIComponent(certificate.id)}/pdf`
      );

      if (!response.ok) {
        const contentType = response.headers.get("content-type") ?? "";
        const result = contentType.includes("application/json")
          ? ((await response.json()) as { message?: string })
          : null;
        throw new Error(
          result?.message || "Unable to download certificate."
        );
      }

      if (!response.headers.get("content-type")?.includes("application/pdf")) {
        throw new Error("The server did not return a PDF file.");
      }

      const pdf = await response.blob();
      const url = URL.createObjectURL(pdf);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${certificate.certificateNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to download certificate."
      );
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Certificate Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Issue, manage and track student training certificates.
          </p>
        </div>

        <button
          onClick={() => {
            eligibleQuery.refetch();
            certificatesQuery.refetch();
          }}
          className="rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-50"
        >
          Refresh Data
        </button>
      </div>

      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Eligible Students"
          value={eligible.length}
          description="Completed training"
          color="sky"
        />
        <SummaryCard
          title="Total Issued"
          value={certificates.length}
          description="All issued certificates"
          color="indigo"
        />
        <SummaryCard
          title="Valid Certificates"
          value={validCount}
          description="Currently valid"
          color="emerald"
        />
        <SummaryCard
          title="Revoked Certificates"
          value={revokedCount}
          description="No longer valid"
          color="rose"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Eligible Students
              </h2>
              <p className="text-sm text-slate-500">
                Completed students without a certificate. A passport photo is
                required to issue one.
              </p>
            </div>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
              {eligible.length} Eligible
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading students...
          </div>
        ) : eligible.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No eligible students found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Program</th>
                  <th className="px-5 py-3">Completed Date</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eligible.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {student.fullName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {student.phone}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {student.program.name}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(student.completedAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => {
                          const confirmed = window.confirm(
                            `Issue a certificate to ${student.fullName}?`
                          );

                          if (confirmed) {
                            setNotice("");
                            setError("");
                            issueMutation.mutate(student.id);
                          }
                        }}
                        disabled={issueMutation.isPending}
                        className="rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {issueMutation.isPending
                          ? "Processing..."
                          : "Issue Certificate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Issued Certificates
            </h2>
            <p className="text-sm text-slate-500">
              Certificate records generated by the institute.
            </p>
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student or certificate..."
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-500 sm:w-72"
          />
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading certificates...
          </div>
        ) : filteredCertificates.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No issued certificates found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Certificate Number</th>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Program</th>
                  <th className="px-5 py-3">Issue Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCertificates.map((certificate) => (
                  <tr key={certificate.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-sky-700">
                      {certificate.certificateNo}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {certificate.studentName}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {certificate.programName}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(certificate.issueDate)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          certificate.status === "VALID"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {certificate.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {certificate.status === "VALID" ? (
                        <button
                          type="button"
                          onClick={() => void downloadCertificate(certificate)}
                          disabled={downloadingId !== null}
                          className="rounded-lg bg-sky-700 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {downloadingId === certificate.id
                            ? "Generating..."
                            : "Download PDF"}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Unavailable
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  color,
}: {
  title: string;
  value: number;
  description: string;
  color: "sky" | "indigo" | "emerald" | "rose";
}) {
  const styles = {
    sky: "bg-sky-50 text-sky-700",
    indigo: "bg-indigo-50 text-indigo-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`mb-4 inline-flex rounded-xl px-3 py-2 text-xs font-bold ${styles[color]}`}
      >
        {title}
      </div>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}
