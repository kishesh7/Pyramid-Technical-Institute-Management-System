import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default async function CertificateVerificationPage({
  params,
}: {
  params: Promise<{ verificationId: string }>;
}) {
  const { verificationId } = await params;
  const certificate = await prisma.certificate.findUnique({
    where: { verificationId },
    select: {
      certificateNo: true,
      studentName: true,
      programName: true,
      completionDate: true,
      issueDate: true,
      status: true,
    },
  });

  if (!certificate) notFound();

  const isValid = certificate.status === "VALID";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="bg-sky-950 px-6 py-8 text-center text-white sm:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-200">
            Pyramid Technical Institute
          </p>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
            Certificate Verification
          </h1>
        </div>

        <div className="p-6 sm:p-10">
          <div
            className={`mb-7 rounded-2xl border p-4 text-center ${
              isValid
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-widest">
              Verification status
            </p>
            <p className="mt-1 text-2xl font-extrabold">
              {isValid ? "VALID CERTIFICATE" : "REVOKED CERTIFICATE"}
            </p>
          </div>

          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Certificate number
              </dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {certificate.certificateNo}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Student
              </dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {certificate.studentName}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Program
              </dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {certificate.programName}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Completion date
              </dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {formatDate(certificate.completionDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Issue date
              </dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {formatDate(certificate.issueDate)}
              </dd>
            </div>
          </dl>

          <p className="mt-8 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
            This page confirms the certificate status in the institute&apos;s
            official records.
          </p>
        </div>
      </section>
    </main>
  );
}
