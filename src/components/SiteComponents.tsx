"use client";

import Image from "next/image";
import pyramidLogo from "@/assets/images/pyramidlogo.jpeg";
import { useEffect, useState, type ReactNode } from "react";

export type TrainingTab = "upcoming" | "ongoing" | "completed";
export type TrainingCategory = "Technology" | "Healthcare" | "Vocational" | "Business";

export type TrainingProgram = {
  title: string;
  category: TrainingCategory;
  description: string;
  details: string[];
  seats?: string;
  progress?: number;
  footer: string;
};

export type GalleryItem = {
  src: string;
  title: string;
  subtitle: string;
};

type SiteLink = {
  href: string;
  label: string;
};

type CategoryStyles = Record<TrainingCategory, { badge: string; accent: string }>;

export function SectionHeading({
  eyebrow,
  title,
  description,
  light = false,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  light?: boolean;
}) {
  return (
    <div>
      <p className={`mb-3 flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.16em] ${light ? "text-sky-100/80" : "text-sky-800"}`}>
        <span className={`h-0.5 w-7 rounded-full ${light ? "bg-white/60" : "bg-linear-to-r from-sky-500 to-teal-500"}`} />
        {eyebrow}
      </p>
      <h2 className={`mb-4 font-display text-3xl font-bold leading-tight sm:text-4xl ${light ? "text-white" : "text-slate-900"}`}>
        {title}
      </h2>
      {description && (
        <p className={`max-w-2xl text-base leading-7 ${light ? "text-sky-100/75" : "text-slate-500"}`}>
          {description}
        </p>
      )}
    </div>
  );
}

export function BrandMark() {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className="h-10 w-11 shrink-0 object-contain"
      src={pyramidLogo}
    />
  );
}

export function SiteHeader({
  links,
  menuOpen,
  onMenuToggle,
  onNavigate,
}: {
  links: SiteLink[];
  menuOpen: boolean;
  onMenuToggle: () => void;
  onNavigate: () => void;
}) {
  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 bg-linear-to-r from-sky-800 to-teal-700 px-3 py-2 text-center text-[11px] font-medium text-white sm:px-5 sm:text-sm">
        🎓 New Batch Starting: Computer Hardware &amp; Networking —{" "}
        <a className="font-bold text-amber-300 hover:text-amber-200" href="#register" onClick={onNavigate}>
          Apply Now →
        </a>
      </div>
      <header className="fixed inset-x-0 top-9 z-40 border-b border-sky-100 bg-white/95 shadow-sm backdrop-blur-xl">
        <nav className="mx-auto flex h-17 max-w-7xl items-center justify-between px-5 lg:px-10" aria-label="Main navigation">
          <a className="flex items-center gap-3" href="#" onClick={onNavigate}>
            <BrandMark />
            <span>
              <span className="block font-display text-sm font-bold leading-tight text-sky-900 sm:text-base">Pyramid Technical Institute</span>
              <span className="mt-0.5 block text-[9px] uppercase tracking-[0.12em] text-sky-600">Itahari, Sunsari · Est. 2011</span>
            </span>
          </a>
          <ul className="hidden items-center gap-1 xl:flex">
            {links.map((link) => (
              <li key={link.href}>
                <a className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-sky-50 hover:text-sky-800" href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a className="ml-1 rounded-xl bg-linear-to-r from-sky-600 to-sky-800 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-600/20 transition hover:-translate-y-0.5" href="#register">
                Enroll Now
              </a>
            </li>
          </ul>
          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="flex flex-col gap-1.5 rounded-lg p-2 text-sky-800 hover:bg-sky-50 xl:hidden"
            onClick={onMenuToggle}
            type="button"
          >
            <span className="h-0.5 w-6 rounded bg-current" />
            <span className="h-0.5 w-6 rounded bg-current" />
            <span className="h-0.5 w-6 rounded bg-current" />
          </button>
        </nav>
      </header>
      {menuOpen && (
        <nav className="fixed inset-x-0 bottom-0 top-[6.6rem] z-30 flex flex-col gap-1 bg-white px-6 pb-10 pt-5 shadow-xl xl:hidden" aria-label="Mobile navigation">
          {links.map((link) => (
            <a
              className="border-b border-sky-100 py-4 text-lg font-medium text-slate-700"
              href={link.href}
              key={link.href}
              onClick={onNavigate}
            >
              {link.label}
            </a>
          ))}
          <a className="mt-4 rounded-xl bg-sky-700 px-5 py-3 text-center font-semibold text-white" href="#register" onClick={onNavigate}>
            Enroll Now
          </a>
        </nav>
      )}
    </>
  );
}

export function TrainingCard({
  program,
  tab,
  categoryStyles,
}: {
  program: TrainingProgram;
  tab: TrainingTab;
  categoryStyles: CategoryStyles;
}) {
  const styles = categoryStyles[program.category];
  const isCompleted = tab === "completed";

  return (
    <article className="overflow-hidden rounded-2xl border border-sky-100 bg-white transition duration-200 hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-100">
      <div className={`h-1 bg-linear-to-r ${styles.accent}`} />
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${styles.badge}`}>{program.category}</span>
        <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${tab === "upcoming" ? "bg-emerald-50 text-emerald-700" : tab === "ongoing" ? "bg-orange-50 text-orange-700" : "bg-blue-50 text-blue-700"}`}>
          {tab === "upcoming" ? "Open" : tab === "ongoing" ? "In Progress" : "Completed"}
        </span>
      </div>
      <div className="px-5 pb-5 pt-4">
        <h3 className="mb-2 font-display text-lg font-bold leading-snug text-slate-900">{program.title}</h3>
        <p className="mb-4 text-sm leading-6 text-slate-500">{program.description}</p>
        <ul className="space-y-2 text-xs leading-5 text-slate-500">
          {program.details.map((detail) => (
            <li className="flex items-start gap-2" key={detail}>
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
              {detail}
            </li>
          ))}
        </ul>
        {program.progress !== undefined && (
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-xs text-slate-500">
              <span>Progress</span>
              <span>{program.progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-sky-100">
              <div className={`h-full rounded-full bg-linear-to-r ${styles.accent}`} style={{ width: `${program.progress}%` }} />
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-sky-100 bg-sky-50/70 px-5 py-3">
        <span className={`text-xs font-semibold ${isCompleted ? "text-emerald-700" : tab === "ongoing" ? "text-orange-700" : "text-slate-500"}`}>
          {tab === "upcoming" ? program.seats : tab === "ongoing" ? `● ${program.footer}` : `✓ ${program.footer}`}
        </span>
        {tab === "upcoming" ? (
          <a className="rounded-lg bg-linear-to-r from-sky-600 to-sky-800 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5" href="#register">
            Apply Now
          </a>
        ) : tab === "ongoing" ? (
          <span className="rounded-lg border border-sky-200 px-4 py-2 text-xs font-semibold text-slate-500">Full</span>
        ) : (
          <button className="rounded-lg border border-sky-200 px-4 py-2 text-xs font-semibold text-slate-500" type="button">View Report</button>
        )}
      </div>
    </article>
  );
}

export function AnimatedNumber({ target, suffix, active }: { target: number; suffix: string; active: boolean }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / 1000, 1);
      setValue(Math.floor(target * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target]);

  return <>{value.toLocaleString("en-US")}{suffix}</>;
}

export function GalleryCard({ item, index }: { item: GalleryItem; index: number }) {
  const [imageAvailable, setImageAvailable] = useState(true);

  return (
    <article className={`group relative flex cursor-pointer items-end overflow-hidden rounded-2xl bg-linear-to-br from-sky-700 to-teal-600 p-5 ${index === 0 ? "row-span-2" : ""}`}>
      {imageAvailable ? (
        <img
          alt={item.title}
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
          onError={() => setImageAvailable(false)}
          src={item.src}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-linear-to-br from-sky-800 to-teal-700 text-white/70">
          <span aria-hidden="true" className="text-3xl">📷</span>
          <span className="text-xs font-medium">Photo coming soon</span>
        </div>
      )}
      <div className="absolute inset-0 bg-linear-to-t from-sky-950/80 via-sky-950/10 to-transparent" />
      <div className="relative z-10 text-white">
        <h3 className="font-display text-sm font-bold">{item.title}</h3>
        <p className="mt-1 text-[11px] text-white/75">{item.subtitle}</p>
      </div>
    </article>
  );
}
