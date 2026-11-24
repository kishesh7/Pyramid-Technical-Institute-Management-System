"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Donor = {
  id: string;
  name: string;
  organizationName: string | null;
};

const initialForm = { organizationName: "", donorName: "" };

export default function DonorsPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadDonors = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/donors", { cache: "no-store" });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load donors.");
      }

      setDonors(result.donors);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load donors.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDonors();
  }, [loadDonors]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  async function addDonor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const body = new FormData();
      body.set("organizationName", form.organizationName);
      body.set("donorName", form.donorName);
      if (imageFile) body.set("image", imageFile);

      const response = await fetch("/api/donors", {
        method: "POST",
        body,
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to add donor.");
      }

      setForm(initialForm);
      setImageFile(null);
      setNotice(`${result.donor.name} was added successfully.`);
      await loadDonors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add donor.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteDonor(donor: Donor) {
    if (
      !window.confirm(
        `Remove ${donor.name} from the donor list? The donor record and donation history will be retained.`
      )
    ) {
      return;
    }

    setDeletingId(donor.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/donors/${encodeURIComponent(donor.id)}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to remove donor.");
      }

      setDonors((current) => current.filter((item) => item.id !== donor.id));
      setNotice(`${donor.name} was removed from the public donor list.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove donor.");
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
          Donor Management
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Add donors and manage who appears in the public donor section.
        </p>
      </header>

      <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Add donor</h2>
        <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={addDonor}>
          <label className="text-sm font-medium text-slate-700">
            Organization name *
            <input
              required
              maxLength={191}
              value={form.organizationName}
              onChange={(event) =>
                setForm({ ...form, organizationName: event.target.value })
              }
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Donor name *
            <input
              required
              maxLength={191}
              value={form.donorName}
              onChange={(event) =>
                setForm({ ...form, donorName: event.target.value })
              }
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Donor image
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  setImageFile(event.target.files?.[0] ?? null)
                }
                className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-sky-50 file:px-3 file:py-2 file:font-semibold file:text-sky-800"
              />
              <span className="mt-1 block text-xs text-slate-500">
                JPG, PNG or WebP, up to 5 MB. Optional.
              </span>
            </label>
            <div>
              <p className="text-sm font-medium text-slate-700">Image preview</p>
              <div className="mt-1.5 flex h-36 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="Selected donor image preview"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-sm text-slate-400">
                    Selected image preview appears here
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Adding donor..." : "Add donor"}
            </button>
          </div>
        </form>
        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            {error}
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
          Existing donors
        </h2>
        {loading ? (
          <p className="text-sm text-slate-500">Loading donors...</p>
        ) : donors.length === 0 ? (
          <p className="text-sm text-slate-500">No active donors have been added.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {donors.map((donor) => (
              <article
                key={donor.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm"
              >
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-900">
                    {donor.organizationName || "Organization not provided"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">{donor.name}</p>
                </div>
                <button
                  type="button"
                  disabled={deletingId !== null}
                  onClick={() => void deleteDonor(donor)}
                  aria-label={`Remove ${donor.name}`}
                  className="shrink-0 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingId === donor.id ? "Removing..." : "Delete"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
