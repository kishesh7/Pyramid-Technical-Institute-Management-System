
"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  dashboardQueryKeys,
  fetchDashboardData,
} from "@/lib/dashboard-data";

type Member = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  joinedAt: string;
};

type MemberForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  joinedAt: string;
};

const emptyForm: MemberForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  joinedAt: new Date().toISOString().slice(0, 10),
};

export default function MembersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<MemberForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  const membersQuery = useQuery({
    queryKey: dashboardQueryKeys.members(debouncedSearch, status),
    queryFn: () => {
      const params = new URLSearchParams({
        search: debouncedSearch,
        status,
      });

      return fetchDashboardData<{ members: Member[] }>(
        `/api/members?${params.toString()}`,
      );
    },
  });
  const members = membersQuery.data?.members ?? [];
  const loading = membersQuery.isPending;
  const displayError =
    error ||
    (membersQuery.isError
      ? membersQuery.error.message
      : "");

  const handleCreateMember = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create member.");
      }

      setMessage("Member registered successfully.");
      setForm(emptyForm);
      setShowForm(false);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.membersRoot,
        }),
        queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.summary,
        }),
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create member."
      );
    } finally {
      setSaving(false);
    }
  };

  const activeCount = members.filter(
    (member) => member.status === "ACTIVE"
  ).length;

  const inactiveCount = members.filter(
    (member) => member.status === "INACTIVE"
  ).length;

  const archivedCount = members.filter(
    (member) => member.status === "ARCHIVED"
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Members Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Register, search and manage your organization members.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError("");
            setMessage("");
            setShowForm(true);
          }}
          className="rounded-xl bg-[linear-gradient(135deg,#0284c7,#0369a1)] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(2,132,199,0.22)] transition hover:-translate-y-0.5"
        >
          + Add New Member
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div
          role="status"
          className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800"
        >
          {message}
        </div>
      )}

      {displayError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {displayError}
        </div>
      )}

      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Members Found", value: members.length },
          { label: "Active", value: activeCount },
          { label: "Inactive", value: inactiveCount },
          { label: "Archived", value: archivedCount },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-sky-100/80 bg-white p-5 shadow-[0_12px_32px_rgba(14,116,144,0.07)]"
          >
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {item.value}
            </p>
          </div>
        ))}
      </section>

      {/* Search and filter */}
      <section className="rounded-2xl border border-sky-100/80 bg-white p-5 shadow-[0_12px_32px_rgba(14,116,144,0.07)]">
        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <div>
            <label
              htmlFor="member-search"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Search members
            </label>
            <input
              id="member-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email or phone..."
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div>
            <label
              htmlFor="member-status"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Filter by status
            </label>
            <select
              id="member-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-sky-600"
            >
              <option value="ALL">All members</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </section>

      {/* Members table */}
      <section className="overflow-hidden rounded-2xl border border-sky-100/80 bg-white shadow-[0_14px_40px_rgba(14,116,144,0.08)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-800">Member Directory</h2>
            <p className="mt-1 text-xs text-slate-500">
              Member records retrieved from your MySQL database.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void membersQuery.refetch()}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4">Member</th>
                <th className="px-5 py-4">Contact</th>
                <th className="px-5 py-4">Address</th>
                <th className="px-5 py-4">Joined Date</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    Loading members...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <p className="font-medium text-slate-700">
                      No members found
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Add your first member to get started.
                    </p>
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        ID: {member.id}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-slate-700">
                        {member.email || "—"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {member.phone || "No phone"}
                      </p>
                    </td>

                    <td className="max-w-xs truncate px-5 py-4 text-slate-600">
                      {member.address || "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          member.status === "ACTIVE"
                            ? "bg-sky-100 text-sky-700"
                            : member.status === "INACTIVE"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500">
          Showing {members.length} member(s)
        </div>
      </section>

      {/* Add member modal */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Register New Member
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the member&apos;s information below.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
                className="text-2xl text-slate-400 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-5 p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-slate-700">
                    First name *
                  </label>
                  <input
                    id="firstName"
                    required
                    maxLength={100}
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-slate-700">
                    Last name *
                  </label>
                  <input
                    id="lastName"
                    required
                    maxLength={100}
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label htmlFor="memberEmail" className="mb-2 block text-sm font-medium text-slate-700">
                    Email address
                  </label>
                  <input
                    id="memberEmail"
                    type="email"
                    maxLength={254}
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label htmlFor="memberPhone" className="mb-2 block text-sm font-medium text-slate-700">
                    Phone number
                  </label>
                  <input
                    id="memberPhone"
                    type="tel"
                    maxLength={30}
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-sky-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="memberAddress" className="mb-2 block text-sm font-medium text-slate-700">
                    Address
                  </label>
                  <textarea
                    id="memberAddress"
                    rows={3}
                    maxLength={500}
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label htmlFor="joinedAt" className="mb-2 block text-sm font-medium text-slate-700">
                    Joining date *
                  </label>
                  <input
                    id="joinedAt"
                    type="date"
                    required
                    value={form.joinedAt}
                    onChange={(e) =>
                      setForm({ ...form, joinedAt: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-sky-600"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-sky-600 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
