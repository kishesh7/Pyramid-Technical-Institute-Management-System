"use client";

import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  dashboardQueryKeys,
  fetchDashboardData,
} from "@/lib/dashboard-data";

type Partner = {
  id: string;
  name: string;
  mark: string;
  type: string;
  since: string;
};

const initialForm = { name: "", mark: "", type: "", since: "" };
const partnerStyles = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-800",
  "bg-pink-100 text-pink-800",
  "bg-violet-100 text-violet-800",
  "bg-sky-100 text-sky-800",
];

export default function PartnersPage() {
  const queryClient = useQueryClient();
  const partnersQuery = useQuery({
    queryKey: dashboardQueryKeys.partners,
    queryFn: () =>
      fetchDashboardData<{ partners: Partner[] }>("/api/partners"),
  });
  const partners = partnersQuery.data?.partners ?? [];
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const displayError =
    error ||
    (partnersQuery.isError
      ? partnersQuery.error.message
      : "");

  async function addPartner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to add partner.");
      }

      setForm(initialForm);
      setNotice(`${result.partner.name} was added successfully.`);
      await queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.partners,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add partner.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePartner(partner: Partner) {
    if (!window.confirm(`Delete ${partner.name} from the partner list?`)) {
      return;
    }

    setDeletingId(partner.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/partners/${encodeURIComponent(partner.id)}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to delete partner.");
      }

      queryClient.setQueryData<{ partners: Partner[] }>(
        dashboardQueryKeys.partners,
        (current) =>
          current
            ? {
                ...current,
                partners: current.partners.filter(
                  (item) => item.id !== partner.id,
                ),
              }
            : current,
      );
      await queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.partners,
      });
      setNotice(`${partner.name} was deleted.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete partner.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-sky-100 bg-[linear-gradient(135deg,#ffffff_0%,#eff8ff_58%,#dff3ff_100%)] px-6 py-7 shadow-[0_18px_50px_rgba(14,116,144,0.10)]">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700">
          Administration
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Our Partners
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Add partner organizations and manage the partners shown on the public website.
        </p>
      </header>

      <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Add a partner</h2>
        <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={addPartner}>
          <label className="text-sm font-medium text-slate-700">
            Partner name *
            <input
              required
              maxLength={191}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Short mark
            <input
              maxLength={8}
              value={form.mark}
              onChange={(event) => setForm({ ...form, mark: event.target.value })}
              placeholder="Generated from name if blank"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Organization type *
            <input
              required
              maxLength={191}
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value })}
              placeholder="e.g. International NGO"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Partnership details *
            <input
              required
              maxLength={191}
              value={form.since}
              onChange={(event) => setForm({ ...form, since: event.target.value })}
              placeholder="e.g. Partner since 2024"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Adding partner..." : "Add partner"}
            </button>
          </div>
        </form>
        {displayError && (
          <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            {displayError}
          </p>
        )}
        {notice && (
          <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            {notice}
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Existing partners
        </h2>
        {partnersQuery.isPending ? (
          <p className="text-sm text-slate-500">Loading partners...</p>
        ) : partners.length === 0 ? (
          <p className="text-sm text-slate-500">No partners have been added.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {partners.map((partner, index) => (
              <article
                key={partner.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold ${partnerStyles[index % partnerStyles.length]}`}>
                    {partner.mark}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900">{partner.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">{partner.type}</p>
                    <p className="mt-1 text-xs font-semibold text-sky-800">{partner.since}</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={deletingId !== null}
                  onClick={() => void deletePartner(partner)}
                  className="shrink-0 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Delete ${partner.name}`}
                >
                  {deletingId === partner.id ? "Deleting..." : "Delete"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
