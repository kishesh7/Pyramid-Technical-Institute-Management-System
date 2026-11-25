"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  dashboardQueryKeys,
  fetchDashboardData,
} from "@/lib/dashboard-data";

type GalleryImage = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  displayOrder: number;
};

type GalleryForm = {
  title: string;
  subtitle: string;
};

const emptyForm: GalleryForm = { title: "", subtitle: "" };

export default function GalleryPage() {
  const queryClient = useQueryClient();
  const galleryQuery = useQuery({
    queryKey: dashboardQueryKeys.gallery,
    queryFn: async () => {
      const result = await fetchDashboardData<{ images: GalleryImage[] }>(
        "/api/gallery",
      );

      if (!Array.isArray(result.images)) {
        throw new Error("Unable to load gallery images.");
      }

      return result;
    },
  });
  const images = galleryQuery.data?.images ?? [];
  const [form, setForm] = useState<GalleryForm>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const displayError =
    error ||
    (galleryQuery.isError
      ? galleryQuery.error.message
      : "");

  useEffect(() => {
    if (!imageFile) return;
    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  function resetForm() {
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
    setEditingId(null);
    setError("");
    setNotice("");
  }

  function editImage(image: GalleryImage) {
    setEditingId(image.id);
    setForm({ title: image.title, subtitle: image.subtitle });
    setImageFile(null);
    setImagePreview(image.imageUrl);
    setError("");
    setNotice("");
    document.getElementById("gallery-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function saveImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const body = new FormData();
      body.set("title", form.title);
      body.set("subtitle", form.subtitle);
      if (imageFile) body.set("image", imageFile);

      const response = await fetch(
        editingId ? `/api/gallery/${encodeURIComponent(editingId)}` : "/api/gallery",
        {
          method: editingId ? "PATCH" : "POST",
          body,
        },
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save gallery image.");
      }

      const successMessage = `"${result.image.title}" was ${editingId ? "updated" : "added"} successfully.`;
      resetForm();
      await queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.gallery,
      });
      setNotice(successMessage);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save gallery image.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteImage(image: GalleryImage) {
    if (!window.confirm(`Delete "${image.title}" from the gallery?`)) return;

    setDeletingId(image.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/gallery/${encodeURIComponent(image.id)}`,
        { method: "DELETE" },
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to delete gallery image.");
      }

      queryClient.setQueryData<{ images: GalleryImage[] }>(
        dashboardQueryKeys.gallery,
        (current) =>
          current
            ? {
                ...current,
                images: current.images.filter((item) => item.id !== image.id),
              }
            : current,
      );
      await queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.gallery,
      });
      if (editingId === image.id) resetForm();
      setNotice(`"${image.title}" was deleted.`);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete gallery image.",
      );
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
          Life at PTI Gallery
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Add, update, and remove photos displayed in the public gallery.
        </p>
      </header>

      <section
        className="scroll-mt-24 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm sm:p-6"
        id="gallery-form"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingId ? "Edit gallery item" : "Add a gallery item"}
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

        <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={saveImage}>
          <label className="text-sm font-medium text-slate-700">
            Photo title *
            <input
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              maxLength={191}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              required
              value={form.title}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Caption *
            <input
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              maxLength={191}
              onChange={(event) =>
                setForm({ ...form, subtitle: event.target.value })
              }
              required
              value={form.subtitle}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Photo {editingId ? "(optional when keeping the current photo)" : "*"}
            <input
              accept="image/jpeg,image/png,image/webp"
              className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-sky-50 file:px-3 file:py-2 file:font-semibold file:text-sky-800"
              key={editingId ?? "new-gallery-image"}
              onChange={(event) =>
                setImageFile(event.target.files?.[0] ?? null)
              }
              required={!editingId}
              type="file"
            />
            <span className="mt-1 block text-xs text-slate-500">
              JPG, PNG or WebP, up to 5 MB.
            </span>
          </label>
          {imagePreview && (
            <div className="sm:col-span-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Gallery preview"
                className="h-48 w-full rounded-xl border border-slate-200 object-cover sm:max-w-md"
                src={imagePreview}
              />
            </div>
          )}
          <div className="flex gap-3 sm:col-span-2">
            <button
              className="rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Add photo"}
            </button>
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
        <h2 className="text-lg font-semibold text-slate-900">
          Existing gallery items
        </h2>
        {galleryQuery.isPending ? (
          <p className="mt-4 text-sm text-slate-500">Loading gallery...</p>
        ) : images.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-sky-200 bg-white p-6 text-center text-sm text-slate-500">
            No gallery photos have been added.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {images.map((image) => (
              <article
                className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm"
                key={image.id}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={image.title}
                  className="h-52 w-full bg-sky-50 object-cover"
                  src={image.imageUrl}
                />
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900">{image.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{image.subtitle}</p>
                  <div className="mt-4 flex gap-2">
                    <button
                      className="rounded-lg border border-sky-200 px-3 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-50"
                      onClick={() => editImage(image)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      disabled={deletingId !== null}
                      onClick={() => void deleteImage(image)}
                      type="button"
                    >
                      {deletingId === image.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
