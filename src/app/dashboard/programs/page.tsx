"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  dashboardQueryKeys,
  fetchDashboardData,
} from "@/lib/dashboard-data";

type TrainingStatus = "UPCOMING" | "ONGOING" | "COMPLETED";
type ProgramTab = Lowercase<TrainingStatus>;

type Program = {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  trainingStatus: TrainingStatus;
};

type ProjectOption = {
  id: string;
  name: string;
};

type ProgramForm = {
  projectId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  trainingStatus: TrainingStatus;
};

const initialForm: ProgramForm = {
  projectId: "",
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  trainingStatus: "UPCOMING",
};

const tabs: { id: ProgramTab; label: string; status: TrainingStatus }[] = [
  { id: "upcoming", label: "Upcoming", status: "UPCOMING" },
  { id: "ongoing", label: "Ongoing", status: "ONGOING" },
  { id: "completed", label: "Completed", status: "COMPLETED" },
];

const statusStyles: Record<TrainingStatus, string> = {
  UPCOMING: "bg-emerald-50 text-emerald-700",
  ONGOING: "bg-orange-50 text-orange-700",
  COMPLETED: "bg-blue-50 text-blue-700",
};

function dateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function displayDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Not set";
}

function isTrainingStatus(value: string): value is TrainingStatus {
  return tabs.some((tab) => tab.status === value);
}

export default function ProgramsPage() {
  const queryClient = useQueryClient();
  const programsQuery = useQuery({
    queryKey: dashboardQueryKeys.programs,
    queryFn: async () => {
      const result = await fetchDashboardData<{
        programs: Program[];
        projects: ProjectOption[];
      }>("/api/programs");

      if (!Array.isArray(result.programs) || !Array.isArray(result.projects)) {
        throw new Error("Unable to load programs.");
      }

      return result;
    },
  });
  const programs = programsQuery.data?.programs ?? [];
  const projects = programsQuery.data?.projects ?? [];
  const [activeTab, setActiveTab] = useState<ProgramTab>("upcoming");
  const [form, setForm] = useState<ProgramForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const firstProjectId = programsQuery.data?.projects[0]?.id;
    if (firstProjectId) {
      setForm((current) =>
        current.projectId ? current : { ...current, projectId: firstProjectId },
      );
    }
  }, [programsQuery.data]);

  const displayError =
    error ||
    (programsQuery.isError
      ? programsQuery.error.message
      : "");

  function resetForm() {
    setEditingId(null);
    setForm({
      ...initialForm,
      projectId: projects[0]?.id ?? "",
    });
    setError("");
    setNotice("");
  }

  function editProgram(program: Program) {
    setEditingId(program.id);
    setForm({
      projectId: program.projectId,
      name: program.name,
      description: program.description ?? "",
      startDate: dateInputValue(program.startDate),
      endDate: dateInputValue(program.endDate),
      trainingStatus: program.trainingStatus,
    });
    setError("");
    setNotice("");
    document.getElementById("program-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function saveProgram(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        editingId ? `/api/programs/${encodeURIComponent(editingId)}` : "/api/programs",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save program.");
      }

      setNotice(
        `${result.program.name} was ${editingId ? "updated" : "added"} successfully.`,
      );
      setEditingId(null);
      setForm({
        ...initialForm,
        projectId: projects[0]?.id ?? "",
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.programs,
        }),
        queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.summary,
        }),
      ]);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save program.",
      );
    } finally {
      setSaving(false);
    }
  }

  const visiblePrograms = programs.filter(
    (program) =>
      program.trainingStatus ===
      tabs.find((tab) => tab.id === activeTab)?.status,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-sky-100 bg-[linear-gradient(135deg,#ffffff_0%,#eff8ff_58%,#dff3ff_100%)] px-6 py-7 shadow-[0_18px_50px_rgba(14,116,144,0.10)]">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700">
          Administration
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Training Programs
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Add programs and manage their details, dates, and training status.
        </p>
      </header>

      <section
        className="scroll-mt-24 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm sm:p-6"
        id="program-form"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingId ? "Edit program" : "Add a program"}
          </h2>
          {editingId && (
            <button
              className="text-sm font-semibold text-slate-500 hover:text-slate-800"
              onClick={resetForm}
              type="button"
            >
              Cancel editing
            </button>
          )}
        </div>

        <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={saveProgram}>
          <label className="text-sm font-medium text-slate-700">
            Program name *
            <input
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              maxLength={191}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              required
              value={form.name}
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Project *
            <select
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              onChange={(event) =>
                setForm({ ...form, projectId: event.target.value })
              }
              required
              value={form.projectId}
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Description
            <textarea
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              maxLength={10000}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              rows={3}
              value={form.description}
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Start date
            <input
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              onChange={(event) =>
                setForm({ ...form, startDate: event.target.value })
              }
              type="date"
              value={form.startDate}
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            End date
            <input
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              onChange={(event) =>
                setForm({ ...form, endDate: event.target.value })
              }
              type="date"
              value={form.endDate}
            />
          </label>

          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Program status *
            <select
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 sm:max-w-sm"
              onChange={(event) => {
                const status = event.target.value;
                if (isTrainingStatus(status)) {
                  setForm({ ...form, trainingStatus: status });
                }
              }}
              value={form.trainingStatus}
            >
              {tabs.map((tab) => (
                <option key={tab.status} value={tab.status}>
                  {tab.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button
              className="rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving || projects.length === 0}
              type="submit"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Add program"}
            </button>
            {projects.length === 0 && (
              <p className="self-center text-sm text-amber-700">
                Add a project before creating a program.
              </p>
            )}
          </div>
        </form>

        {displayError && (
          <p
            className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
            role="alert"
          >
            {displayError}
          </p>
        )}
        {notice && (
          <p
            className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700"
            role="status"
          >
            {notice}
          </p>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Program list
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Programs are grouped by the same status categories as the public website.
            </p>
          </div>
          <div className="inline-flex max-w-full gap-1 rounded-xl border border-sky-100 bg-sky-50 p-1">
            {tabs.map((tab) => {
              const count = programs.filter(
                (program) => program.trainingStatus === tab.status,
              ).length;

              return (
                <button
                  aria-pressed={activeTab === tab.id}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                    activeTab === tab.id
                      ? "bg-linear-to-r from-sky-600 to-sky-800 text-white shadow-md shadow-sky-700/20"
                      : "text-slate-500 hover:text-sky-800"
                  }`}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                >
                  {tab.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {programsQuery.isPending ? (
          <p className="mt-5 text-sm text-slate-500">Loading programs...</p>
        ) : visiblePrograms.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-sky-200 bg-white p-6 text-center text-sm text-slate-500">
            No {activeTab} programs yet.
          </p>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visiblePrograms.map((program) => (
              <article
                className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm"
                key={program.id}
              >
                <div className="h-1 bg-linear-to-r from-sky-500 to-teal-500" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-sky-800">
                      {program.projectName}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${statusStyles[program.trainingStatus]}`}>
                      {tabs.find((tab) => tab.status === program.trainingStatus)?.label}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">
                    {program.name}
                  </h3>
                  <p className="mt-2 min-h-10 text-sm leading-6 text-slate-500">
                    {program.description || "No description provided."}
                  </p>
                  <p className="mt-3 text-xs text-slate-500">
                    {displayDate(program.startDate)} – {displayDate(program.endDate)}
                  </p>
                  <button
                    className="mt-5 rounded-lg border border-sky-200 px-4 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-50"
                    onClick={() => editProgram(program)}
                    type="button"
                  >
                    Edit program
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
