"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import pyramid1 from "@/assets/images/pyramid1.png";
import pyramid3 from "@/assets/images/pyramid3.png";
import pyramidLogo from "@/assets/images/pyramidlogo.jpeg";
import samirKhadka from "@/assets/images/samrikhadka.jpeg";
import {
  AnimatedNumber,
  BrandMark,
  GalleryCard,
  SectionHeading,
  SiteHeader,
  TrainingCard,
  type GalleryItem,
  type TrainingCategory,
  type TrainingProgram,
  type TrainingTab,
} from "@/components/SiteComponents";

const trainingTabs: { id: TrainingTab; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "ongoing", label: "Ongoing" },
  { id: "completed", label: "Completed" },
];

const categoryStyles: Record<TrainingCategory, { badge: string; accent: string }> = {
  Technology: {
    badge: "bg-sky-100 text-sky-800",
    accent: "from-sky-500 to-teal-500",
  },
  Healthcare: {
    badge: "bg-emerald-100 text-emerald-700",
    accent: "from-emerald-500 to-teal-500",
  },
  Vocational: {
    badge: "bg-orange-100 text-orange-700",
    accent: "from-orange-500 to-amber-500",
  },
  Business: {
    badge: "bg-violet-100 text-violet-700",
    accent: "from-violet-500 to-rose-500",
  },
};

const programs: Record<TrainingTab, TrainingProgram[]> = {
  upcoming: [
    {
      title: "Computer Hardware & Networking (CHN)",
      category: "Technology",
      description:
        "Install, configure, and maintain computer systems and networks. Includes CISCO basics and CompTIA A+ fundamentals.",
      details: ["Batch Start: Baisakh 15, 2082", "Duration: 3 Months · CTEVT Level 2", "Instructor: Ram Prasad Shrestha"],
      seats: "18 / 25 seats",
      footer: "Open for applications",
    },
    {
      title: "Community Health Worker (CHW)",
      category: "Healthcare",
      description:
        "Community-level health delivery covering maternal health, nutrition, and first aid certification.",
      details: ["Batch Start: Baisakh 20, 2082", "Duration: 6 Months · MoHP Recognized", "Instructor: Dr. Sunita Rai"],
      seats: "22 / 30 seats",
      footer: "Open for applications",
    },
    {
      title: "Tailoring & Dress Making",
      category: "Vocational",
      description:
        "Master garment construction, pattern making, and modern tailoring for self-employment and business setup.",
      details: ["Batch Start: Jestha 1, 2082", "Duration: 4 Months · CTEVT Level 1", "Instructor: Kabita Thapa"],
      seats: "10 / 20 seats",
      footer: "Open for applications",
    },
    {
      title: "Digital Literacy & E-Commerce",
      category: "Business",
      description:
        "Internet skills, social media marketing, and online selling for small businesses and entrepreneurs in Sunsari.",
      details: ["Batch Start: Jestha 10, 2082", "Duration: 45 Days · PTI Certificate", "Instructor: Bikash Adhikari"],
      seats: "28 / 35 seats",
      footer: "Open for applications",
    },
    {
      title: "Plumbing & Sanitation Technology",
      category: "Vocational",
      description:
        "Hands-on plumbing: pipe fitting, water supply systems, and sanitation infrastructure for rural and urban settings.",
      details: ["Batch Start: Ashadh 1, 2082", "Duration: 3 Months · CTEVT Level 2", "Instructor: Raju Karki"],
      seats: "20 / 25 seats",
      footer: "Open for applications",
    },
    {
      title: "Mobile Phone Repair & Maintenance",
      category: "Technology",
      description:
        "Diagnose and repair Android and iOS devices including software flashing and hardware replacement.",
      details: ["Batch Start: Ashadh 15, 2082", "Duration: 2 Months · PTI + CTEVT", "Instructor: Suresh Tamang"],
      seats: "15 / 20 seats",
      footer: "Open for applications",
    },
  ],
  ongoing: [
    {
      title: "Basic Electrical Wiring & Installation",
      category: "Technology",
      description:
        "Residential and commercial wiring, safety protocols, and Nepal Electricity Authority standards.",
      details: ["Started: Chaitra 1 · Ends: Baisakh 30, 2082", "Enrolled: 24 Students"],
      progress: 50,
      footer: "Week 6 of 12",
    },
    {
      title: "Elderly Care & Home Nursing",
      category: "Healthcare",
      description:
        "Basic nursing care, physiotherapy assistance, and emotional support for elderly patients at home.",
      details: ["Started: Falgun 15 · Ends: Ashadh 15, 2082", "Enrolled: 18 Students"],
      progress: 48,
      footer: "Week 8 of 16",
    },
    {
      title: "Cooperative Management & Accounting",
      category: "Business",
      description:
        "Accounting principles and cooperative financial management for community savings groups.",
      details: ["Started: Magh 10 · Ends: Baisakh 10, 2082", "Enrolled: 30 Students"],
      progress: 82,
      footer: "Week 10 of 12",
    },
  ],
  completed: [
    {
      title: "Food Processing & Preservation",
      category: "Vocational",
      description:
        "Practical food preparation, packaging, quality control, and hygiene standards for cottage food industries.",
      details: ["Batch: Kartik – Poush 2081", "Graduates: 28/30 · Employed: 22"],
      footer: "93% Graduation Rate",
    },
    {
      title: "Solar Panel Installation & Maintenance",
      category: "Technology",
      description:
        "Solar system design, installation, and troubleshooting for rural electrification projects.",
      details: ["Batch: Shrawan – Ashwin 2081", "Graduates: 24/25 · Employed: 20"],
      footer: "96% Graduation Rate",
    },
    {
      title: "Pharmacy Assistant Training",
      category: "Healthcare",
      description:
        "Pharmaceutical knowledge, drug dispensing, storage, and customer advisory skills for pharmacy assistants.",
      details: ["Batch: Chaitra 2080 – Baisakh 2081", "Graduates: 32/35 · Employed: 28"],
      footer: "91% Graduation Rate",
    },
    {
      title: "Entrepreneurship & Business Planning",
      category: "Business",
      description:
        "Business model canvas, market research, financial projection, and pitch skills for local entrepreneurs.",
      details: ["Batch: Mangsir – Falgun 2081", "Graduates: 40/40 · Businesses Started: 14"],
      footer: "100% Graduation Rate",
    },
    {
      title: "Motorcycle Repair & Auto Mechanics",
      category: "Vocational",
      description:
        "Engine diagnostics, two-wheeler repair, and basic automotive maintenance for garage employment.",
      details: ["Batch: Baisakh – Ashadh 2081", "Graduates: 20/22 · Employed: 18"],
      footer: "91% Graduation Rate",
    },
    {
      title: "Graphic Design & DTP",
      category: "Technology",
      description:
        "Adobe Photoshop, Illustrator, CorelDraw for print media, signage, and digital content creation.",
      details: ["Batch: Shrawan – Ashwin 2080", "Graduates: 26/28 · Employed: 22"],
      footer: "93% Graduation Rate",
    },
  ],
};

const partners = [
  { mark: "UN", name: "UNDP Nepal", type: "International Organization", since: "Partner since 2015", style: "bg-blue-100 text-blue-700" },
  { mark: "SNV", name: "SNV Nepal", type: "Dutch Development Org.", since: "Partner since 2016", style: "bg-emerald-100 text-emerald-800" },
  { mark: "GIZ", name: "GIZ Nepal", type: "German Dev. Agency", since: "Partner since 2018", style: "bg-amber-100 text-amber-800" },
  { mark: "SC", name: "Save the Children", type: "International NGO", since: "Partner since 2014", style: "bg-pink-100 text-pink-800" },
  { mark: "OXF", name: "Oxfam Nepal", type: "International NGO", since: "Partner since 2017", style: "bg-violet-100 text-violet-800" },
  { mark: "ADB", name: "Asian Dev. Bank", type: "Multilateral Dev. Bank", since: "Partner since 2019", style: "bg-sky-100 text-sky-800" },
  { mark: "CTEVT", name: "CTEVT Nepal", type: "Government Body", since: "Affiliated since 2010", style: "bg-green-100 text-green-800" },
  { mark: "WFP", name: "World Food Programme", type: "UN Agency", since: "Partner since 2020", style: "bg-orange-100 text-orange-800" },
  { mark: "NPC", name: "Nat. Planning Commission", type: "Government of Nepal", since: "Partner since 2013", style: "bg-sky-50 text-sky-800" },
  { mark: "HLV", name: "Helvetas Nepal", type: "Swiss Dev. NGO", since: "Partner since 2016", style: "bg-teal-100 text-teal-800" },
  { mark: "DDC", name: "DDC Sunsari", type: "District Dev. Committee", since: "Partner since 2010", style: "bg-yellow-100 text-yellow-800" },
  { mark: "WB", name: "World Bank Nepal", type: "Multilateral Dev. Bank", since: "Partner since 2021", style: "bg-purple-100 text-purple-800" },
];

const impactStats = [
  { icon: "🎓", target: 1800, suffix: "+", label: "Trained & Certified Graduates since 2010", accent: "from-sky-500 to-teal-500" },
  { icon: "👩", target: 64, suffix: "%", label: "Women & Girls trained across all programs", accent: "from-rose-500 to-amber-500" },
  { icon: "💼", target: 98, suffix: "%", label: "Employment or self-employment placement rate", accent: "from-emerald-500 to-sky-500" },
  { icon: "🏘️", target: 40, suffix: "+", label: "Villages and wards reached in Sunsari", accent: "from-violet-500 to-rose-500" },
  { icon: "📚", target: 24, suffix: "", label: "Distinct training programs offered", accent: "from-amber-500 to-orange-500" },
  { icon: "🤝", target: 14, suffix: "", label: "National & international partner organizations", accent: "from-teal-500 to-emerald-500" },
  { icon: "🌱", target: 320, suffix: "+", label: "Small businesses started by graduates", accent: "from-sky-700 to-violet-500" },
  { icon: "🏆", target: 15, suffix: "", label: "Awards & recognitions from national bodies", accent: "from-orange-500 to-rose-500" },
];

const galleryItems = [
  { src: samirKhadka.src, title: "DIRECTOR", subtitle: "Samir Kumar & Khadka" },
  { src: pyramid1.src, title: "Graduation 2081", subtitle: "Certificate distribution ceremony" },
  { src: pyramid3.src, title: "Community Outreach", subtitle: "Field visits for needs assessment" },
  { src: "/images/tailoring.jpeg", title: "Women Empowerment", subtitle: "Tailoring batch — Itahari & Dharan" },
  { src: pyramidLogo.src, title: "Partner NGO Visit", subtitle: "GIZ Nepal visiting our facility" },
];

const siteLinks = [
  { href: "#about", label: "About" },
  { href: "#trainings", label: "Programs" },
  { href: "/training-application", label: "Training Application" },
  { href: "#supporters", label: "Partners" },
  { href: "#impact", label: "Impact" },
  { href: "#contact", label: "Contact" },
];

const contactDetails: { icon: string; title: string; description: ReactNode }[] = [
  { icon: "📍", title: "Our Location", description: <>Itahari-9, Pragati Chowk<br />Sunsari, Province No. 1, Nepal</> },
  { icon: "📞", title: "Phone & WhatsApp", description: <>025-588526 (Office)<br />+977 98000993921 (WhatsApp)</> },
  { icon: "✉️", title: "Email", description: <>info@pyramidtechnical.org.np<br />admission@pyramidtechnical.org.np</> },
  { icon: "🕐", title: "Office Hours", description: <>Sunday – Friday: 9:00 AM – 5:00 PM<br />Saturday: Closed</> },
];
type ApiProgram = {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
};

export default function HomePage() {
  
  const [activeTab, setActiveTab] = useState<TrainingTab>("upcoming");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [impactVisible, setImpactVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const impactRef = useRef<HTMLElement | null>(null);
  const [apiPrograms, setApiPrograms] = useState<ApiProgram[]>([]);
const [programsLoading, setProgramsLoading] = useState(true);
const [isSubmitting, setIsSubmitting] = useState(false);
  

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3200);
  };
  useEffect(() => {
  const loadPrograms = async () => {
    try {
      const response = await fetch("/api/programs", { cache: "no-store" });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load programs.");
      }

      setApiPrograms(result.programs);
      setToast("");
    } catch (error) {
      console.error("Program loading error:", error);
      showToast("Unable to load training programs. Please refresh the page.");
    } finally {
      setProgramsLoading(false);
    }
  };

  loadPrograms();
}, []);

  useEffect(() => {
    const section = impactRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImpactVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const submitEnrollment = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  if (isSubmitting) return;

  const form = event.currentTarget;
  const data = new FormData(form);

  const fullName = String(data.get("name") ?? "").trim();
  const age = Number(data.get("age"));
  const phone = String(data.get("phone") ?? "").trim();
  const email = String(data.get("email") ?? "").trim();
  const programId = String(data.get("program") ?? "").trim();
  const educationLevel = String(data.get("education") ?? "").trim();
  const gender = String(data.get("gender") ?? "").trim();
  const address = String(data.get("address") ?? "").trim();
  const motivation = String(data.get("motivation") ?? "").trim();
  const citizenship = data.get("citizenship");
  const passportPhoto = data.get("passportPhoto");

  if (
    !fullName ||
    !phone ||
    !programId ||
    !address ||
    !(citizenship instanceof File) ||
    citizenship.size === 0 ||
    !(passportPhoto instanceof File) ||
    passportPhoto.size === 0
  ) {
    showToast("⚠️ Please fill in all required fields.");
    return;
  }

  if (citizenship.size > 5 * 1024 * 1024 || passportPhoto.size > 5 * 1024 * 1024) {
    showToast("⚠️ Each uploaded file must be 5 MB or smaller.");
    return;
  }

  if (!["image/jpeg", "image/png"].includes(passportPhoto.type)) {
    showToast("⚠️ Passport-size photo must be a JPG or PNG image.");
    return;
  }

  if (!Number.isInteger(age) || age < 1 || age > 120) {
    showToast("⚠️ Please enter a valid age.");
    return;
  }

  setIsSubmitting(true);

  try {
    const response = await fetch("/api/enrollments", {
      method: "POST",
      body: data,
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Unable to submit your application."
      );
    }

    form.reset();
    showToast("✅ Application submitted successfully!");

  } catch (error) {
    console.error("Enrollment submission error:", error);

    showToast(
      error instanceof Error
        ? `⚠️ ${error.message}`
        : "⚠️ Something went wrong. Please try again."
    );
  } finally {
    setIsSubmitting(false);
  }
};

  const submitContact = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const requiredFields = ["name", "contact", "message"];
    if (requiredFields.some((field) => !String(data.get(field) ?? "").trim())) {
      showToast("⚠️ Please fill in all fields.");
      return;
    }
    showToast("✅ Message sent! We'll get back to you soon.");
    form.reset();
  };

  return (
    <main className="overflow-hidden bg-white text-slate-900">
      <SiteHeader
        links={siteLinks}
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen((open) => !open)}
        onNavigate={() => setMenuOpen(false)}
      />

      <section
        className="relative flex min-h-190 scroll-mt-28 items-center overflow-hidden bg-[linear-gradient(145deg,#eaf7ff_0%,#dbeeff_40%,#f0faff_70%,#e8f8f8_100%)] px-5 pb-24 pt-36 sm:px-8 lg:min-h-screen lg:px-12"
        id="hero"
      >
        <div className="pointer-events-none absolute -right-20 -top-28 h-136 w-136 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-96 w-96 rounded-full bg-teal-500/15 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,#0ea5e9_1.5px,transparent_1.5px)] bg-size-[32px_32px] opacity-[0.035]" />
        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-14 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-300/70 bg-sky-400/10 px-4 py-2 text-xs font-semibold tracking-wide text-sky-800">
              <span className="h-2 w-2 animate-pulse rounded-full bg-sky-600" />
              Registered NGO · Itahari, Sunsari
            </div>
            <h1 className="mb-6 font-display text-5xl font-bold leading-[1.08] text-slate-900 sm:text-6xl">
              Building Skills,
              <br />
              <span className="bg-linear-to-r from-sky-600 to-teal-600 bg-clip-text text-transparent">Transforming</span>
              <br />
              Communities
            </h1>
            <p className="mb-8 max-w-xl text-base leading-8 text-slate-600">
              Pyramid Technical Institute empowers youth across Sunsari with quality CTEVT-affiliated vocational training. We bridge the gap between skills and opportunity for a brighter Nepal.
            </p>
            <div className="flex flex-wrap gap-3">
              <a className="rounded-xl bg-linear-to-r from-sky-600 to-sky-800 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-600/30 transition hover:-translate-y-0.5" href="#trainings">
                Explore Programs
              </a>
              <a className="rounded-xl border-2 border-sky-300 bg-white px-7 py-3 text-sm font-semibold text-sky-800 transition hover:border-sky-500 hover:bg-sky-50" href="#register">
                Register Today
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-5 border-t border-sky-300/40 pt-7">
              {[
                ["1,800+", "Graduates"],
                ["24", "Programs"],
                ["14+", "Partner NGOs"],
                ["98%", "Placement Rate"],
              ].map(([value, label]) => (
                <div key={label}>
                  <div className="font-display text-2xl font-bold text-sky-700">{value}</div>
                  <div className="mt-1 text-xs font-medium text-slate-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative mx-auto hidden h-97.5 w-full max-w-md lg:block">
            <div className="absolute inset-x-0 top-0 rounded-2xl border border-sky-200 bg-white p-7 shadow-2xl shadow-slate-900/10">
              <div className="mb-3 text-3xl">🎓</div>
              <h2 className="mb-1 text-sm font-bold text-slate-900">CTEVT Affiliated Training</h2>
              <p className="text-xs leading-5 text-slate-500">Nationally recognized certifications across 24 programs</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-sky-100 px-3 py-1 text-[11px] font-semibold text-sky-800">Technology</span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">Healthcare</span>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-[11px] font-semibold text-orange-700">Vocational</span>
              </div>
            </div>
            <div className="absolute bottom-10 left-4 right-10 rounded-2xl border border-sky-200 bg-white p-6 shadow-2xl shadow-slate-900/10">
              <div className="flex items-center gap-4">
                <span className="font-display text-3xl font-bold text-sky-600">98%</span>
                <span>
                  <span className="block text-sm font-bold text-slate-900">Placement Rate</span>
                  <span className="text-xs text-slate-500">Employed within 3 months</span>
                </span>
              </div>
            </div>
          </div>
        </div>
        <svg className="absolute bottom-0 left-0 h-12 w-full" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,40 C360,0 1080,80 1440,20 L1440,60 L0,60 Z" fill="#FFFFFF" />
        </svg>
      </section>

      <section className="bg-linear-to-r from-sky-600 via-sky-800 to-teal-700" aria-label="Institute statistics">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-5 sm:px-8 lg:grid-cols-4 lg:px-12">
          {[
            ["🎓", "1,842", "Total Graduates"],
            ["👩", "64%", "Women Trained"],
            ["🏘️", "40+", "Villages Reached"],
            ["🌱", "320+", "Businesses Started"],
          ].map(([icon, value, label], index) => (
            <div className={`px-3 py-7 text-center sm:px-6 sm:py-9 ${index % 2 === 0 ? "border-r border-white/15 lg:border-r" : "lg:border-r lg:border-white/15"} ${index > 1 ? "border-t border-white/15 lg:border-t-0" : ""} ${index === 3 ? "lg:border-r-0" : ""}`} key={label}>
              <div className="mb-2 text-2xl">{icon}</div>
              <div className="font-display text-3xl font-bold leading-none text-white sm:text-4xl">{value}</div>
              <div className="mt-2 text-xs font-medium text-white/70 sm:text-sm">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="scroll-mt-28 bg-slate-50 px-5 py-16 sm:px-8 sm:py-20 lg:px-12" id="about">
        <div className="mx-auto max-w-7xl">
          <SectionHeading eyebrow="Who We Are" title={<>Empowering Communities<br className="hidden sm:block" /> Through Technical Education</>} />
          <div className="mt-11 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-sky-600 via-sky-800 to-teal-700 p-7 text-white shadow-xl sm:p-10">
                <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
                <h3 className="relative font-display text-2xl font-bold">Pyramid Technical Institute</h3>
                <p className="relative mb-7 mt-2 text-sm leading-6 text-white/70">Registered under Social Welfare Council, Nepal · Reg. No: 107615/069/070</p>
                <div className="relative mb-7 flex flex-wrap gap-2">
                  {["CTEVT Affiliated", "ISO Certified", "SWC Registered", "Est. 2010"].map((item) => (
                    <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-[11px] font-semibold" key={item}>{item}</span>
                  ))}
                </div>
                <div className="relative grid grid-cols-3 gap-3">
                  {[["14+", "Years Active"], ["24", "Programs"], ["98%", "Placement"]].map(([value, label]) => (
                    <div className="rounded-xl bg-white/10 p-3 text-center" key={label}>
                      <div className="font-display text-2xl font-bold">{value}</div>
                      <div className="mt-1 text-[10px] text-white/65">{label}</div>
                    </div>
                  ))}
                </div>
                <svg className="relative mt-7 w-full opacity-30" viewBox="0 0 300 80" aria-hidden="true">
                  <polygon points="150,10 200,70 100,70" fill="none" stroke="white" strokeWidth="1.5" />
                  <polygon points="150,22 190,70 110,70" fill="none" stroke="white" strokeWidth="1" />
                  <polygon points="150,34 180,70 120,70" fill="none" stroke="white" strokeWidth=".7" />
                  <circle cx="150" cy="10" r="3" fill="white" />
                </svg>
              </div>
              <div className="absolute -bottom-5 right-2 rounded-2xl border border-sky-100 bg-white px-6 py-4 text-center shadow-xl sm:-right-4">
                <div className="bg-linear-to-r from-amber-500 to-rose-500 bg-clip-text font-display text-3xl font-bold text-transparent">98%</div>
                <div className="text-[11px] font-semibold text-slate-500">Placement Rate</div>
              </div>
            </div>
            <div>
              <p className="mb-4 text-[15px] leading-7 text-slate-600">
                Pyramid Technical Institute (PTI) is a non-governmental organization committed to reducing unemployment and enhancing livelihood opportunities in the Sunsari district of Province No. 1, Nepal.
              </p>
              <p className="text-[15px] leading-7 text-slate-600">
                Founded in 2011, we deliver CTEVT-affiliated technical and vocational training to youth, women, and marginalized communities — equipping them with skills for dignified careers and sustainable livelihoods.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  ["🎯", "Our Mission", "Deliver accessible, quality technical education to build a skilled workforce in eastern Nepal.", "bg-sky-100"],
                  ["🌱", "Our Vision", "A self-reliant community where every individual has skills to lead a dignified life.", "bg-emerald-100"],
                  ["🤝", "Inclusivity", "Special focus on women, Dalit, Janajati, and marginalized youth for equitable access.", "bg-violet-100"],
                  ["🏆", "Quality", "Industry-aligned, practical hands-on training with CTEVT-certified instructors.", "bg-amber-100"],
                ].map(([icon, title, description, iconStyle]) => (
                  <article className="rounded-2xl border border-sky-100 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-sky-100" key={title}>
                    <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-xl ${iconStyle}`}>{icon}</div>
                    <h3 className="mb-1 text-sm font-bold text-slate-900">{title}</h3>
                    <p className="text-xs leading-5 text-slate-500">{description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="scroll-mt-28 px-5 py-16 sm:px-8 sm:py-20 lg:px-12" id="trainings">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Our Programs"
            title="Training Programs"
            description="Comprehensive vocational and technical training programs designed to meet real market demands."
          />
          <div className="mt-8 inline-flex max-w-full gap-1 rounded-xl border border-sky-100 bg-sky-50 p-1">
            {trainingTabs.map((tab) => (
              <button
                aria-pressed={activeTab === tab.id}
                className={`rounded-lg px-4 py-2.5 text-xs font-semibold transition sm:px-6 sm:text-sm ${activeTab === tab.id ? "bg-linear-to-r from-sky-600 to-sky-800 text-white shadow-md shadow-sky-700/20" : "text-slate-500 hover:text-sky-800"}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {programs[activeTab].map((program) => (
              <TrainingCard categoryStyles={categoryStyles} key={program.title} program={program} tab={activeTab} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative scroll-mt-28 overflow-hidden bg-linear-to-br from-sky-900 via-sky-800 to-teal-700 px-5 py-16 sm:px-8 sm:py-20 lg:px-12" id="register">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-white/5" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Enroll Today"
            title="Register for a Program"
            description="Fill out the form and our team will contact you within 24 hours to confirm your enrollment."
            light
          />
          <div className="mt-10 grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
            <form className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-lg sm:p-8" onSubmit={submitEnrollment}>
              <h3 className="mb-6 font-display text-2xl font-bold text-white">Enrollment Application</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-white/75">Full Name *
                  <input aria-required="true" className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/60" name="name" placeholder="Your full name" />
                </label>
                <label className="block text-xs font-semibold text-white/75">Age *
                  <input className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/60" name="age" placeholder="Your age" type="number" />
                </label>
                <label className="block text-xs font-semibold text-white/75">Phone Number *
                  <input aria-required="true" className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/60" name="phone" placeholder="+977 98xxxxxxxx" type="tel" />
                </label>
                <label className="block text-xs font-semibold text-white/75">Email Address
                  <input className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/60" name="email" placeholder="your@email.com" type="email" />
                </label>
              </div>
              <label className="mt-4 block text-xs font-semibold text-white/75">Select Training Program *
              <select aria-required="true"  required className="mt-2 w-full rounded-xl border border-white/20 bg-sky-900 px-4 py-3 text-sm text-white outline-none focus:border-white/60" defaultValue="" name="program" disabled={programsLoading || apiPrograms.length === 0}
                       ><option className="bg-white text-slate-900" value="">{programsLoading? "Loading programs...": apiPrograms.length === 0  ? "No programs available"  : "-- Choose a Program --"}</option>

                   {apiPrograms.map((program) => (
                           <option className="bg-white text-slate-900" key={program.id} value={program.id}>
                               {program.name}
                            </option>
                        ))}
              </select>


              </label>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-white/75">Education Level
                  <select className="mt-2 w-full rounded-xl border border-white/20 bg-sky-900 px-4 py-3 text-sm text-white outline-none focus:border-white/60" defaultValue="Below SLC/SEE" name="education">
                    {["Below SLC/SEE", "SLC/SEE Pass", "10+2 / Intermediate", "Bachelor's"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-white/75">Gender
                  <select className="mt-2 w-full rounded-xl border border-white/20 bg-sky-900 px-4 py-3 text-sm text-white outline-none focus:border-white/60" defaultValue="Female" name="gender">
                    {["Female", "Male", "Other"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
              </div>
              <label className="mt-4 block text-xs font-semibold text-white/75">Address *
                <input aria-required="true" className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/60" name="address" placeholder="e.g., Itahari-4, Sunsari" />
              </label>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-white/75">Citizenship / Passport Document *
                  <input
                    aria-required="true"
                    accept="image/jpeg,image/png,application/pdf"
                    className="mt-2 block w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-xs text-white file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-bold file:text-sky-900"
                    name="citizenship"
                    required
                    type="file"
                  />
                  <span className="mt-1 block text-[10px] text-white/50">JPG, PNG or PDF · Maximum 5 MB</span>
                </label>
                <label className="block text-xs font-semibold text-white/75">Passport-size Photo *
                  <input
                    aria-required="true"
                    accept="image/jpeg,image/png"
                    className="mt-2 block w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-xs text-white file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-bold file:text-sky-900"
                    name="passportPhoto"
                    required
                    type="file"
                  />
                  <span className="mt-1 block text-[10px] text-white/50">JPG or PNG · Maximum 5 MB</span>
                </label>
              </div>
              <label className="mt-4 block text-xs font-semibold text-white/75">Why do you want to join?
                <textarea className="mt-2 w-full resize-y rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/60" name="motivation" placeholder="Tell us about your motivation..." rows={3} />
              </label>
              <button className="mt-5 w-full rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-sky-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSubmitting || programsLoading || apiPrograms.length === 0}>  {isSubmitting ? "Submitting Application..." : "Submit Application →"}
              </button>
           </form>

            <div className="text-white">
              <h3 className="mb-7 font-display text-2xl font-bold">How to Enroll</h3>
              {[
                ["Submit Application", "Fill out the online form or visit our Itahari office with your citizenship copy and 2 passport photos."],
                ["Orientation Interview", "Attend a brief orientation where our team explains program details, schedule, and requirements."],
                ["Fee & Documentation", "Complete formalities. Many programs are fully subsidized for eligible candidates through partner NGO funding."],
                ["Begin Training", "Start on the batch date. Receive materials, toolkit (select programs), and daily stipend if eligible."],
              ].map(([title, description], index) => (
                <div className="mb-6 flex gap-4" key={title}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 font-display font-bold">{index + 1}</span>
                  <div>
                    <h4 className="mb-1 text-sm font-bold">{title}</h4>
                    <p className="text-sm leading-6 text-white/65">{description}</p>
                  </div>
                </div>
              ))}
              <div className="rounded-2xl border border-white/20 bg-white/10 p-5 text-sm leading-6 text-white/75">
                <strong className="text-amber-300">📌 Free Programs Available:</strong> Several programs are free or heavily subsidized for women, Dalit, Janajati, persons with disabilities, and economically disadvantaged youth through our partner organizations.
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  ["Office Hours", "Sun – Fri", "9:00 AM – 5:00 PM"],
                  ["Helpline", "025-588526", "+977 985-2089707"],
                ].map(([label, line1, line2]) => (
                  <div className="rounded-xl border border-white/15 bg-white/10 p-4" key={label}>
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/50">{label}</div>
                    <div className="text-sm font-bold">{line1}</div>
                    <div className="text-xs text-white/60">{line2}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="scroll-mt-28 bg-slate-50 px-5 py-16 sm:px-8 sm:py-20 lg:px-12" id="supporters">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Our Partners"
            title="Supported by Leading Organizations"
            description="Our programs are made possible through support of national and international NGOs, government bodies, and development partners."
          />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {partners.map((partner) => (
              <article className="rounded-2xl border border-sky-100 bg-white px-4 py-6 text-center transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-100 sm:px-5" key={partner.name}>
                <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full font-display text-base font-bold ${partner.style}`}>{partner.mark}</div>
                <h3 className="mb-1 text-sm font-bold text-slate-900">{partner.name}</h3>
                <p className="mb-3 text-xs text-slate-500">{partner.type}</p>
                <p className="text-[10px] font-bold tracking-wide text-sky-800">{partner.since}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="relative scroll-mt-28 overflow-hidden bg-[linear-gradient(145deg,#eaf7ff,#e0f4fd,#ccfbf1)] px-5 py-16 sm:px-8 sm:py-20 lg:px-12"
        id="impact"
        ref={impactRef}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <SectionHeading eyebrow="Our Impact" title="Numbers That Define Our Work" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {impactStats.map((stat) => (
              <article className="overflow-hidden rounded-2xl border border-sky-100 bg-white text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-sky-100" key={stat.label}>
                <div className={`h-1 bg-linear-to-r ${stat.accent}`} />
                <div className="px-5 py-6">
                  <div className="mb-3 text-3xl">{stat.icon}</div>
                  <div className="mb-2 bg-linear-to-r from-sky-600 to-sky-900 bg-clip-text font-display text-4xl font-bold leading-none text-transparent">
                    <AnimatedNumber active={impactVisible} suffix={stat.suffix} target={stat.target} />
                  </div>
                  <p className="text-xs font-medium leading-5 text-slate-500">{stat.label}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="scroll-mt-28 px-5 py-16 sm:px-8 sm:py-20 lg:px-12" id="gallery">
        <div className="mx-auto max-w-7xl">
          <SectionHeading eyebrow="Gallery" title="Life at PTI" description="Snapshots from our training sessions, graduation ceremonies, and community events." />
          <div className="mt-9 grid auto-rows-47.5 grid-cols-2 gap-3 sm:auto-rows-55 sm:gap-4 lg:grid-cols-3">
            {galleryItems.map((item, index) => (
              <GalleryCard item={item} index={index} key={item.title} />
            ))}
          </div>
        </div>
      </section>

      <section className="scroll-mt-28 bg-sky-50 px-5 py-16 sm:px-8 sm:py-20 lg:px-12" id="contact">
        <div className="mx-auto max-w-7xl">
          <SectionHeading eyebrow="Get In Touch" title="Contact Us" />
          <div className="mt-10 grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <div>
              {contactDetails.map(({ icon, title, description }) => (
                <div className="mb-5 flex gap-4" key={title}>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-xl">{icon}</div>
                  <div>
                    <h3 className="mb-1 text-sm font-bold text-slate-900">{title}</h3>
                    <p className="text-sm leading-6 text-slate-500">{description}</p>
                  </div>
                </div>
              ))}
              <div className="mt-6 flex h-48 flex-col items-center justify-center gap-3 rounded-2xl bg-linear-to-br from-sky-600 via-sky-800 to-teal-700 text-center">
                <span className="text-3xl">🗺️</span>
                <p className="text-sm text-white/75">Itahari, Sunsari — Province No. 1, Nepal</p>
                <a className="rounded-lg border border-amber-400/50 px-4 py-2 text-xs font-bold text-amber-300 transition hover:bg-amber-400/15" href="https://maps.google.com/?q=Itahari,Sunsari,Nepal" rel="noreferrer" target="_blank">
                  Open in Google Maps →
                </a>
              </div>
            </div>
            <form className="rounded-3xl border border-sky-100 bg-white p-6 shadow-lg shadow-slate-900/5 sm:p-8" onSubmit={submitContact}>
              <h3 className="mb-6 font-display text-2xl font-bold text-slate-900">Send Us a Message</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-600">Your Name
                  <input required aria-required="true" className="mt-2 w-full rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white" name="name" placeholder="Full name" />
                </label>
                <label className="block text-xs font-semibold text-slate-600">Phone / Email
                  <input required aria-required="true" className="mt-2 w-full rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white" name="contact" placeholder="Phone or email" />
                </label>
              </div>
              <label className="mt-4 block text-xs font-semibold text-slate-600">Subject
                <select className="mt-2 w-full rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500" defaultValue="Program Inquiry" name="subject">
                  {["Program Inquiry", "Partnership / Collaboration", "Donation / Funding", "Media / Press", "General Question"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="mt-4 block text-xs font-semibold text-slate-600">Your Message
                <textarea  aria-required="true" className="mt-2 w-full resize-y rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white" name="message" placeholder="How can we help you?" rows={5} />
              </label>
              <button className="mt-5 w-full rounded-xl bg-linear-to-r from-sky-600 to-sky-800 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-700/20 transition hover:-translate-y-0.5" type="submit">
                Send Message →
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="bg-sky-950 px-5 pb-8 pt-14 text-white sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-9 border-b border-white/10 pb-10 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr]">
            <div>
              <a className="inline-flex items-center gap-3" href="#">
                <BrandMark />
                <span>
                  <span className="block font-display text-base font-bold">Pyramid Technical Institute</span>
                  <span className="mt-0.5 block text-[9px] uppercase tracking-[0.12em] text-sky-300">Itahari, Sunsari · Est. 2010</span>
                </span>
              </a>
              <p className="mt-4 max-w-sm text-sm leading-6 text-white/55">
                Registered NGO providing CTEVT-affiliated vocational and technical training to empower communities in Sunsari, Province No. 1, Nepal.
              </p>
              <div className="mt-5 flex gap-2">
                {["f", "in", "yt", "tw"].map((social) => (
                  <a aria-label={`Follow us on ${social}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-white/60 transition hover:border-sky-400/40 hover:bg-sky-400/15 hover:text-sky-300" href="#" key={social}>
                    {social}
                  </a>
                ))}
              </div>
            </div>
            {[
              { title: "Programs", links: ["Computer Hardware & Networking", "Community Health Worker", "Tailoring & Dress Making", "Digital Literacy", "Plumbing & Sanitation", "View All Programs →"], href: "#trainings" },
              { title: "Organization", links: ["About PTI", "Our Partners", "Our Impact", "Gallery", "Contact", "Annual Reports"], hrefs: ["#about", "#supporters", "#impact", "#gallery", "#contact", "#"] },
              { title: "Quick Links", links: ["Apply Now", "Verify Certificate", "Scholarship Info", "Alumni Network", "Donate", "Volunteer"], hrefs: ["/training-application", "#", "#", "#", "#", "#"] },
            ].map((column) => (
              <div key={column.title}>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest">{column.title}</h3>
                <ul className="space-y-2.5">
                  {column.links.map((link, index) => (
                    <li key={link}>
                      <a className="text-sm text-white/55 transition hover:text-sky-300" href={column.hrefs?.[index] ?? column.href ?? "#"}>
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col justify-between gap-3 pt-6 text-xs text-white/40 sm:flex-row">
            <p>© 2025 Pyramid Technical Institute, Itahari, Sunsari. All rights reserved.</p>
            <p>Reg. No: 107615/069/070 · <a className="text-sky-300 hover:text-sky-200" href="#">Privacy Policy</a> · <a className="text-sky-300 hover:text-sky-200" href="#">Terms of Use</a></p>
          </div>
        </div>
      </footer>

      <div
        aria-live="polite"
        className={`fixed bottom-6 right-6 z-60 min-w-60 rounded-xl border border-sky-100 bg-white px-5 py-4 text-sm font-medium text-slate-800 shadow-xl transition duration-300 ${toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-20 opacity-0"}`}
        role="status"
      >
        {toast}
      </div>
    </main>
  );
}
