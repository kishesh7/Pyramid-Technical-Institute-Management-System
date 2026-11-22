"use client";

import { FormEvent, useState } from "react";

type FormData = Record<string, string>;

const initialData: FormData = {};

const steps = [
  "व्यक्तिगत विवरण",
  "रोजगारी तथा आय",
  "तालिम विवरण",
  "ठेगाना तथा घोषणा",
];

const fields = [
  [
    { name: "applicantName", label: "आवेदकको नाम", required: true },
    { name: "age", label: "उमेर", type: "number", required: true },
    {
      name: "gender",
      label: "लिङ्ग",
      type: "select",
      options: ["महिला", "पुरुष", "तेस्रो लिङ्गी"],
      required: true,
    },
    {
      name: "ethnicity",
      label: "जाति समूह",
      type: "select",
      options: ["दलित", "जनजाति", "मधेसी", "अन्य"],
      required: true,
    },
    {
      name: "maritalStatus",
      label: "वैवाहिक अवस्था",
      type: "select",
      options: ["विवाहित", "अविवाहित", "एकल"],
    },
    {
      name: "specialStatus",
      label: "विशेष अवस्था",
      type: "select",
      options: ["अपाङ्गता", "एकल महिला", "पूर्व कमैया", "हलिया", "लागू हुँदैन"],
    },
    {
      name: "education",
      label: "शैक्षिक योग्यता",
      type: "select",
      options: [
        "निरक्षर",
        "साक्षर",
        "कक्षा ८ उत्तीर्ण",
        "एसएलसी/एसईई उत्तीर्ण",
        "उच्च माध्यमिक तह उत्तीर्ण",
        "स्नातक तह वा सोभन्दा माथि",
      ],
    },
  ],
  [
    {
      name: "employmentStatus",
      label: "हालको रोजगारीको स्थिति",
      type: "select",
      options: ["बेरोजगार", "अर्धरोजगार", "रोजगार"],
      required: true,
    },
    { name: "occupation", label: "हालको पेशा" },
    {
      name: "employmentType",
      label: "रोजगारीको प्रकार",
      type: "select",
      options: [
        "सामान्य शिक्षित बेरोजगार",
        "व्यावसायिक शिक्षित बेरोजगार",
        "व्यावसायिक तालिम लिएको",
      ],
    },
    { name: "monthlyIncome", label: "आफ्नो मासिक आम्दानी (रु.)", type: "number" },
    { name: "familyIncome", label: "परिवारको मासिक आम्दानी (रु.)", type: "number" },
    { name: "annualIncome", label: "परिवारको वार्षिक कुल आम्दानी (रु.)", type: "number" },
    {
      name: "incomeSource",
      label: "आम्दानीको मुख्य स्रोत",
      type: "select",
      options: ["ज्यालादारी", "व्यापार व्यवसाय", "कृषि", "वैदेशिक रोजगारी", "अन्य"],
    },
    { name: "workingMonths", label: "उत्पादनमा संलग्न भएको अवधि (महिना)", type: "number" },
  ],
  [
    {
      name: "previousTraining",
      label: "पहिले कुनै तालिम लिनुभएको छ?",
      type: "select",
      options: ["छ", "छैन"],
      required: true,
    },
    { name: "previousTrainingName", label: "पहिले लिएको तालिमको नाम" },
    { name: "previousTrainingDuration", label: "पहिले लिएको तालिमको अवधि" },
    {
      name: "wantsMoreTraining",
      label: "थप तालिम लिन इच्छुक हुनुहुन्छ?",
      type: "select",
      options: ["छ", "छैन"],
    },
    {
      name: "desiredTraining",
      label: "लिन चाहेको तालिम",
      type: "select",
      options: [
        "छोटो तालिम (३ महिना)",
        "लामो तालिम (६ महिना)",
        "औद्योगिक प्रशिक्षार्थी तालिम (१८ महिना)",
      ],
      required: true,
    },
    {
      name: "trainingReason",
      label: "तालिम लिन इच्छुक हुनुको कारण",
      type: "select",
      options: [
        "आफ्नै व्यवसाय सुरु गर्न",
        "आफ्नो सीप विकास गर्न",
        "ज्यालादारी/तलबमा काम गर्न",
        "वैदेशिक रोजगारीमा जान",
      ],
    },
    {
      name: "informationSource",
      label: "तालिमको बारेमा जानकारी पाएको स्रोत",
      type: "select",
      options: [
        "पत्रपत्रिका",
        "पोस्टर पम्प्लेट",
        "एफ.एम. रेडियो",
        "आफन्त/साथीहरू",
        "तालिम दिने संस्था",
        "स्थानीय कार्यालयहरू",
        "दलित/महिला/जनजाति संघ/संस्थाहरू",
        "अन्य",
      ],
    },
    { name: "referenceName", label: "सिफारिस गर्ने व्यक्तिको नाम" },
    { name: "referencePhone", label: "सिफारिस गर्ने व्यक्तिको मोबाइल नम्बर" },
  ],
];

const addressFields = [
  { name: "permanentProvince", label: "स्थायी ठेगाना: प्रदेश", required: true },
  { name: "permanentDistrict", label: "जिल्ला", required: true },
  { name: "permanentMunicipality", label: "गाउँपालिका/नगरपालिका", required: true },
  { name: "permanentWard", label: "वडा नं." },
  { name: "permanentTole", label: "टोल/बस्ती" },
  { name: "permanentPhone", label: "फोन/मोबाइल नं." },
  { name: "citizenshipNumber", label: "नागरिकता नं." },
  { name: "citizenshipYear", label: "नागरिकता लिएको साल" },
  { name: "citizenshipDistrict", label: "नागरिकता लिएको जिल्ला" },
  { name: "fatherName", label: "बाबुको नाम थर" },
  { name: "motherName", label: "आमाको नाम थर" },
];

function InputField({
  field,
  value,
  onChange,
}: {
  field: {
    name: string;
    label: string;
    type?: string;
    options?: string[];
    required?: boolean;
  };
  value: string;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="ml-1 text-red-500">*</span>}
      </span>

      {field.options ? (
        <select
          name={field.name}
          value={value}
          required={field.required}
          onChange={(e) => onChange(field.name, e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">छान्नुहोस्</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={field.name}
          type={field.type || "text"}
          value={value}
          required={field.required}
          onChange={(e) => onChange(field.name, e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      )}
    </label>
  );
}

export default function TrainingApplicationPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [applicationNumber, setApplicationNumber] = useState("");

  function updateField(name: string, value: string) {
    setData((previous) => ({ ...previous, [name]: value }));
  }

  async function submitApplication() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/training-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "आवेदन पेश गर्न सकिएन।");
      }

      setApplicationNumber(result.applicationNumber);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "केही समस्या भयो। फेरि प्रयास गर्नुहोस्।"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (step < 3) {
      setStep((previous) => previous + 1);
      return;
    }

    await submitApplication();
  }

  if (applicationNumber) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8">
          <h1 className="text-2xl font-bold text-green-800">
            आवेदन सफलतापूर्वक पेश भयो!
          </h1>
          <p className="mt-3 text-gray-700">तपाईंको आवेदन नम्बर:</p>
          <p className="mt-2 text-2xl font-bold">{applicationNumber}</p>
          <p className="mt-4 text-sm text-gray-600">
            कृपया आफ्नो आवेदन नम्बर सुरक्षित राख्नुहोस्।
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold text-indigo-600">PYRAMID NGO</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            तालिम आवेदन फाराम
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            कृपया सबै विवरण सही भर्नुहोस्।
          </p>
        </div>

        <div className="mb-6 rounded-xl border bg-white p-5">
          <div className="mb-4 flex justify-between text-sm">
            <span className="font-semibold text-gray-700">
              चरण {step + 1} / 4
            </span>
            <span className="text-indigo-600">{steps[step]}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${((step + 1) / 4) * 100}%` }}
            />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8"
        >
          {step < 3 && (
            <>
              <h2 className="mb-6 text-xl font-bold text-gray-900">
                {steps[step]}
              </h2>
              <div className="grid gap-5 md:grid-cols-2">
                {fields[step].map((field) => (
                  <InputField
                    key={field.name}
                    field={field}
                    value={data[field.name] || ""}
                    onChange={updateField}
                  />
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="mb-6 text-xl font-bold text-gray-900">
                ठेगाना तथा अन्तिम विवरण
              </h2>
              <div className="grid gap-5 md:grid-cols-2">
                {addressFields.map((field) => (
                  <InputField
                    key={field.name}
                    field={field}
                    value={data[field.name] || ""}
                    onChange={updateField}
                  />
                ))}
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <InputField
                  field={{ name: "currentProvince", label: "हालको ठेगाना: प्रदेश" }}
                  value={data.currentProvince || ""}
                  onChange={updateField}
                />
                <InputField
                  field={{ name: "currentDistrict", label: "जिल्ला" }}
                  value={data.currentDistrict || ""}
                  onChange={updateField}
                />
                <InputField
                  field={{ name: "currentMunicipality", label: "गाउँपालिका/नगरपालिका" }}
                  value={data.currentMunicipality || ""}
                  onChange={updateField}
                />
                <InputField
                  field={{ name: "currentWard", label: "वडा नं." }}
                  value={data.currentWard || ""}
                  onChange={updateField}
                />
                <InputField
                  field={{ name: "currentPhone", label: "फोन/मोबाइल नं." }}
                  value={data.currentPhone || ""}
                  onChange={updateField}
                />
                <InputField
                  field={{ name: "familyMembers", label: "परिवारमा सदस्य संख्या", type: "number" }}
                  value={data.familyMembers || ""}
                  onChange={updateField}
                />
                <InputField
                  field={{
                    name: "foreignEmployment",
                    label: "वैदेशिक रोजगारीबाट फर्किनुभएको छ?",
                    type: "select",
                    options: ["हो", "होइन"],
                  }}
                  value={data.foreignEmployment || ""}
                  onChange={updateField}
                />
                <InputField
                  field={{
                    name: "foreignEmploymentDuration",
                    label: "वैदेशिक रोजगारीको अवधि",
                  }}
                  value={data.foreignEmploymentDuration || ""}
                  onChange={updateField}
                />
                <InputField
                  field={{
                    name: "foreignEmploymentWantsToGo",
                    label: "वैदेशिक रोजगारीमा जान चाहनुहुन्छ?",
                    type: "select",
                    options: ["छ", "छैन"],
                  }}
                  value={data.foreignEmploymentWantsToGo || ""}
                  onChange={updateField}
                />
                <InputField
                  field={{
                    name: "passport",
                    label: "राहदानी (पासपोर्ट) बनाउनु भएको छ?",
                    type: "select",
                    options: ["छ", "छैन"],
                  }}
                  value={data.passport || ""}
                  onChange={updateField}
                />
                <InputField
                  field={{ name: "passportNumber", label: "पासपोर्ट नं." }}
                  value={data.passportNumber || ""}
                  onChange={updateField}
                />
                <InputField
                  field={{
                    name: "jobPlacement",
                    label: "निःशुल्क रोजगारी (Job Placement) सेवा चाहिन्छ?",
                    type: "select",
                    options: ["चाहिन्छ", "चाहिँदैन"],
                  }}
                  value={data.jobPlacement || ""}
                  onChange={updateField}
                />
              </div>

              <label className="mt-8 flex items-start gap-3 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                <input type="checkbox" required className="mt-1" />
                <span>
                  माथि उल्लेखित विवरणहरू पूर्ण सत्य छन्। विवरण झुटा भएमा वा
                  फाराममा पूरा विवरण नभरी फाराम अस्वीकृत भएमा सोको जिम्मेवार म आफैँ हुनेछु।
                </span>
              </label>
            </>
          )}

          {error && (
            <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="mt-8 flex justify-between gap-4 border-t pt-6">
            <button
              type="button"
              disabled={step === 0 || loading}
              onClick={() => setStep((previous) => previous - 1)}
              className="rounded-lg border px-6 py-3 text-sm font-semibold disabled:opacity-40"
            >
              पछाडि
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading
                ? "पेश हुँदैछ..."
                : step === 3
                  ? "आवेदन पेश गर्नुहोस्"
                  : "अर्को चरण"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
