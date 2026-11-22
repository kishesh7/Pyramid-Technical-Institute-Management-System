"use client";

import { FormEvent, useState } from "react";

type FormData = Record<string, string>;
type Language = "ne" | "en";

const initialData: FormData = {};

const copy = {
  ne: {
    title: "तालिम आवेदन फाराम",
    instruction: "कृपया सबै विवरण सही भर्नुहोस्।",
    step: "चरण",
    select: "छान्नुहोस्",
    back: "पछाडि",
    next: "अर्को चरण",
    submit: "आवेदन पेश गर्नुहोस्",
    submitting: "पेश हुँदैछ...",
    required: "यो क्षेत्र आवश्यक छ।",
    invalidAge: "कृपया सही उमेर भर्नुहोस्।",
    requiredName: "आवेदकको नाम आवश्यक छ।",
    declarationRequired: "अभिलेख पुष्टि गर्नुहोस्।",
    submitFailed: "आवेदन पेश गर्न सकिएन। कृपया फेरि प्रयास गर्नुहोस्।",
    networkError: "केही समस्या भयो। फेरि प्रयास गर्नुहोस्।",
    successTitle: "आवेदन सफलतापूर्वक पेश भयो!",
    applicationNumber: "तपाईंको आवेदन नम्बर:",
    keepNumber: "कृपया आफ्नो आवेदन नम्बर सुरक्षित राख्नुहोस्।",
  },
  en: {
    title: "Training Application Form",
    instruction: "Please enter all details correctly.",
    step: "Step",
    select: "Select",
    back: "Back",
    next: "Next",
    submit: "Submit Application",
    submitting: "Submitting...",
    required: "This field is required.",
    invalidAge: "Please enter a valid age.",
    requiredName: "Applicant name is required.",
    declarationRequired: "Please confirm the declaration.",
    submitFailed: "The application could not be submitted. Please try again.",
    networkError: "Something went wrong. Please try again.",
    successTitle: "Application submitted successfully!",
    applicationNumber: "Your application number:",
    keepNumber: "Please keep your application number for future reference.",
  },
} as const;

const steps: Record<Language, string[]> = {
  ne: [
    "व्यक्तिगत विवरण",
    "रोजगारी तथा आय",
    "तालिम विवरण",
    "ठेगाना तथा घोषणा",
  ],
  en: [
    "Personal Details",
    "Employment and Income",
    "Training Details",
    "Address and Declaration",
  ],
};

type Field = {
  name: string;
  label: Record<Language, string>;
  type?: string;
  options?: Array<{ value: string; label: Record<Language, string> }>;
  required?: boolean;
};

const fields: Field[][] = [
  [
    { name: "applicantName", label: { ne: "आवेदकको नाम", en: "Applicant Name" }, required: true },
    { name: "age", label: { ne: "उमेर", en: "Age" }, type: "number", required: true },
    {
      name: "gender",
      label: { ne: "लिङ्ग", en: "Gender" },
      type: "select",
      options: [
        { value: "महिला", label: { ne: "महिला", en: "Female" } },
        { value: "पुरुष", label: { ne: "पुरुष", en: "Male" } },
        { value: "तेस्रो लिङ्गी", label: { ne: "तेस्रो लिङ्गी", en: "Third Gender" } },
      ],
      required: true,
    },
    {
      name: "ethnicity",
      label: { ne: "जाति समूह", en: "Ethnicity" },
      type: "select",
      options: [
        { value: "दलित", label: { ne: "दलित", en: "Dalit" } },
        { value: "जनजाति", label: { ne: "जनजाति", en: "Janajati" } },
        { value: "मधेसी", label: { ne: "मधेसी", en: "Madhesi" } },
        { value: "अन्य", label: { ne: "अन्य", en: "Other" } },
      ],
      required: true,
    },
    {
      name: "maritalStatus",
      label: { ne: "वैवाहिक अवस्था", en: "Marital Status" },
      type: "select",
      options: [
        { value: "विवाहित", label: { ne: "विवाहित", en: "Married" } },
        { value: "अविवाहित", label: { ne: "अविवाहित", en: "Unmarried" } },
        { value: "एकल", label: { ne: "एकल", en: "Single" } },
      ],
    },
    {
      name: "specialStatus",
      label: { ne: "विशेष अवस्था", en: "Special Status" },
      type: "select",
      options: [
        { value: "अपाङ्गता", label: { ne: "अपाङ्गता", en: "Disability" } },
        { value: "एकल महिला", label: { ne: "एकल महिला", en: "Single Woman" } },
        { value: "पूर्व कमैया", label: { ne: "पूर्व कमैया", en: "Former Kamaiya" } },
        { value: "हलिया", label: { ne: "हलिया", en: "Haliya" } },
        { value: "लागू हुँदैन", label: { ne: "लागू हुँदैन", en: "Not Applicable" } },
      ],
    },
    {
      name: "education",
      label: { ne: "शैक्षिक योग्यता", en: "Education" },
      type: "select",
      options: [
        { value: "निरक्षर", label: { ne: "निरक्षर", en: "Illiterate" } },
        { value: "साक्षर", label: { ne: "साक्षर", en: "Literate" } },
        { value: "कक्षा ८ उत्तीर्ण", label: { ne: "कक्षा ८ उत्तीर्ण", en: "Passed Grade 8" } },
        { value: "एसएलसी/एसईई उत्तीर्ण", label: { ne: "एसएलसी/एसईई उत्तीर्ण", en: "Passed SLC/SEE" } },
        { value: "उच्च माध्यमिक तह उत्तीर्ण", label: { ne: "उच्च माध्यमिक तह उत्तीर्ण", en: "Passed Higher Secondary" } },
        { value: "स्नातक तह वा सोभन्दा माथि", label: { ne: "स्नातक तह वा सोभन्दा माथि", en: "Bachelor or Above" } },
      ],
    },
  ],
  [
    {
      name: "employmentStatus",
      label: { ne: "हालको रोजगारीको स्थिति", en: "Current Employment Status" },
      type: "select",
      options: [
        { value: "बेरोजगार", label: { ne: "बेरोजगार", en: "Unemployed" } },
        { value: "अर्धरोजगार", label: { ne: "अर्धरोजगार", en: "Underemployed" } },
        { value: "रोजगार", label: { ne: "रोजगार", en: "Employed" } },
      ],
      required: true,
    },
    { name: "occupation", label: { ne: "हालको पेशा", en: "Current Occupation" } },
    {
      name: "employmentType",
      label: { ne: "रोजगारीको प्रकार", en: "Employment Type" },
      type: "select",
      options: [
        { value: "सामान्य शिक्षित बेरोजगार", label: { ne: "सामान्य शिक्षित बेरोजगार", en: "Generally educated unemployed" } },
        { value: "व्यावसायिक शिक्षित बेरोजगार", label: { ne: "व्यावसायिक शिक्षित बेरोजगार", en: "Vocationally educated unemployed" } },
        { value: "व्यावसायिक तालिम लिएको", label: { ne: "व्यावसायिक तालिम लिएको", en: "Vocationally trained" } },
      ],
    },
    { name: "monthlyIncome", label: { ne: "आफ्नो मासिक आम्दानी (रु.)", en: "Your Monthly Income (Rs.)" }, type: "number" },
    { name: "familyIncome", label: { ne: "परिवारको मासिक आम्दानी (रु.)", en: "Family Monthly Income (Rs.)" }, type: "number" },
    { name: "annualIncome", label: { ne: "परिवारको वार्षिक कुल आम्दानी (रु.)", en: "Total Annual Family Income (Rs.)" }, type: "number" },
    {
      name: "incomeSource",
      label: { ne: "आम्दानीको मुख्य स्रोत", en: "Main Source of Income" },
      type: "select",
      options: [
        { value: "ज्यालादारी", label: { ne: "ज्यालादारी", en: "Wage Labor" } },
        { value: "व्यापार व्यवसाय", label: { ne: "व्यापार व्यवसाय", en: "Business" } },
        { value: "कृषि", label: { ne: "कृषि", en: "Agriculture" } },
        { value: "वैदेशिक रोजगारी", label: { ne: "वैदेशिक रोजगारी", en: "Foreign Employment" } },
        { value: "अन्य", label: { ne: "अन्य", en: "Other" } },
      ],
    },
    { name: "workingMonths", label: { ne: "उत्पादनमा संलग्न भएको अवधि (महिना)", en: "Time Involved in Production (Months)" }, type: "number" },
  ],
  [
    {
      name: "previousTraining",
      label: { ne: "पहिले कुनै तालिम लिनुभएको छ?", en: "Have you received training before?" },
      type: "select",
      options: [
        { value: "छ", label: { ne: "छ", en: "Yes" } },
        { value: "छैन", label: { ne: "छैन", en: "No" } },
      ],
      required: true,
    },
    { name: "previousTrainingName", label: { ne: "पहिले लिएको तालिमको नाम", en: "Name of Previous Training" } },
    { name: "previousTrainingDuration", label: { ne: "पहिले लिएको तालिमको अवधि", en: "Duration of Previous Training" } },
    {
      name: "wantsMoreTraining",
      label: { ne: "थप तालिम लिन इच्छुक हुनुहुन्छ?", en: "Are You Interested in Further Training?" },
      type: "select",
      options: [
        { value: "छ", label: { ne: "छ", en: "Yes" } },
        { value: "छैन", label: { ne: "छैन", en: "No" } },
      ],
    },
    {
      name: "desiredTraining",
      label: { ne: "लिन चाहेको तालिम", en: "Desired Training" },
      type: "select",
      options: [
        { value: "छोटो तालिम (३ महिना)", label: { ne: "छोटो तालिम (३ महिना)", en: "Short Training (3 Months)" } },
        { value: "लामो तालिम (६ महिना)", label: { ne: "लामो तालिम (६ महिना)", en: "Long Training (6 Months)" } },
        { value: "औद्योगिक प्रशिक्षार्थी तालिम (१८ महिना)", label: { ne: "औद्योगिक प्रशिक्षार्थी तालिम (१८ महिना)", en: "Industrial Apprenticeship Training (18 Months)" } },
      ],
      required: true,
    },
    {
      name: "trainingReason",
      label: { ne: "तालिम लिन इच्छुक हुनुको कारण", en: "Reason for Seeking Training" },
      type: "select",
      options: [
        { value: "आफ्नै व्यवसाय सुरु गर्न", label: { ne: "आफ्नै व्यवसाय सुरु गर्न", en: "To Start My Own Business" } },
        { value: "आफ्नो सीप विकास गर्न", label: { ne: "आफ्नो सीप विकास गर्न", en: "To Develop My Skills" } },
        { value: "ज्यालादारी/तलबमा काम गर्न", label: { ne: "ज्यालादारी/तलबमा काम गर्न", en: "To Work for Wages/Salary" } },
        { value: "वैदेशिक रोजगारीमा जान", label: { ne: "वैदेशिक रोजगारीमा जान", en: "To Seek Foreign Employment" } },
      ],
    },
    {
      name: "informationSource",
      label: { ne: "तालिमको बारेमा जानकारी पाएको स्रोत", en: "Source of Training Information" },
      type: "select",
      options: [
        { value: "पत्रपत्रिका", label: { ne: "पत्रपत्रिका", en: "Newspaper" } },
        { value: "पोस्टर पम्प्लेट", label: { ne: "पोस्टर पम्प्लेट", en: "Poster/Pamphlet" } },
        { value: "एफ.एम. रेडियो", label: { ne: "एफ.एम. रेडियो", en: "FM Radio" } },
        { value: "आफन्त/साथीहरू", label: { ne: "आफन्त/साथीहरू", en: "Relatives/Friends" } },
        { value: "तालिम दिने संस्था", label: { ne: "तालिम दिने संस्था", en: "Training Institution" } },
        { value: "स्थानीय कार्यालयहरू", label: { ne: "स्थानीय कार्यालयहरू", en: "Local Offices" } },
        { value: "दलित/महिला/जनजाति संघ/संस्थाहरू", label: { ne: "दलित/महिला/जनजाति संघ/संस्थाहरू", en: "Dalit/Women/Janajati Organizations" } },
        { value: "अन्य", label: { ne: "अन्य", en: "Other" } },
      ],
    },
    { name: "referenceName", label: { ne: "सिफारिस गर्ने व्यक्तिको नाम", en: "Name of Referring Person" } },
    { name: "referencePhone", label: { ne: "सिफारिस गर्ने व्यक्तिको मोबाइल नम्बर", en: "Mobile Number of Referring Person" } },
  ],
];

const addressFields = [
  { name: "permanentProvince", label: { ne: "स्थायी ठेगाना: प्रदेश", en: "Permanent Address: Province" }, required: true },
  { name: "permanentDistrict", label: { ne: "जिल्ला", en: "District" }, required: true },
  { name: "permanentMunicipality", label: { ne: "गाउँपालिका/नगरपालिका", en: "Municipality/Rural Municipality" }, required: true },
  { name: "permanentWard", label: { ne: "वडा नं.", en: "Ward Number" } },
  { name: "permanentTole", label: { ne: "टोल/बस्ती", en: "Tole/Village" } },
  { name: "permanentPhone", label: { ne: "फोन/मोबाइल नं.", en: "Phone/Mobile Number" } },
  { name: "citizenshipNumber", label: { ne: "नागरिकता नं.", en: "Citizenship Number" } },
  { name: "citizenshipYear", label: { ne: "नागरिकता लिएको साल", en: "Citizenship Issue Year" } },
  { name: "citizenshipDistrict", label: { ne: "नागरिकता लिएको जिल्ला", en: "District of Citizenship" } },
  { name: "fatherName", label: { ne: "बाबुको नाम थर", en: "Father's Name" } },
  { name: "motherName", label: { ne: "आमाको नाम थर", en: "Mother's Name" } },
];

function InputField({
  field,
  value,
  onChange,
  language,
}: {
  field: Field;
  value: string;
  onChange: (name: string, value: string) => void;
  language: Language;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-gray-700">
        {field.label[language]}
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
          <option value="">
            {language === "ne" ? "छान्नुहोस्" : "Select"}
          </option>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label[language]}
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
  const [language, setLanguage] = useState<Language>("ne");
  const [data, setData] = useState<FormData>(initialData);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [applicationNumber, setApplicationNumber] = useState("");
  const text = copy[language];

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
        throw new Error(result.message || text.submitFailed);
      }

      setApplicationNumber(result.applicationNumber);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.includes("नाम")
            ? text.requiredName
            : err.message.includes("उमेर")
              ? text.invalidAge
              : text.submitFailed
          : text.networkError
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const currentFields = step === 3 ? addressFields : fields[step];
    const missingField = currentFields.find(
      (field) => field.required && !String(data[field.name] || "").trim()
    );

    if (missingField) {
      setError(`${missingField.label[language]}: ${text.required}`);
      return;
    }

    if (step === 0) {
      const age = Number(data.age);
      if (!data.age || !Number.isFinite(age) || age <= 0) {
        setError(text.invalidAge);
        return;
      }
    }

    if (step === 3 && !declarationAccepted) {
      setError(text.declarationRequired);
      return;
    }

    if (step < 3) {
      setStep((previous) => previous + 1);
      return;
    }

    await submitApplication();
  }

  if (applicationNumber) {
    return (
      <main lang={language} className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8">
          <h1 className="text-2xl font-bold text-green-800">
            {text.successTitle}
          </h1>
          <p className="mt-3 text-gray-700">{text.applicationNumber}</p>
          <p className="mt-2 text-2xl font-bold">{applicationNumber}</p>
          <p className="mt-4 text-sm text-gray-600">
            {text.keepNumber}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main lang={language} className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center gap-2" aria-label="Language">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                language === "en"
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-gray-300 bg-white text-gray-700"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage("ne")}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                language === "ne"
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-gray-300 bg-white text-gray-700"
              }`}
            >
              नेपाली
            </button>
          </div>
          <p className="text-sm font-semibold text-indigo-600">PYRAMID NGO</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            {text.title}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {text.instruction}
          </p>
        </div>

        <div className="mb-6 rounded-xl border bg-white p-5">
          <div className="mb-4 flex justify-between text-sm">
            <span className="font-semibold text-gray-700">
              {text.step} {step + 1} / 4
            </span>
            <span className="text-indigo-600">{steps[language][step]}</span>
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
          noValidate
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8"
        >
          {step < 3 && (
            <>
              <h2 className="mb-6 text-xl font-bold text-gray-900">
                {steps[language][step]}
              </h2>
              <div className="grid gap-5 md:grid-cols-2">
                {fields[step].map((field) => (
                  <InputField
                    key={field.name}
                    field={field}
                    value={data[field.name] || ""}
                    onChange={updateField}
                    language={language}
                  />
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="mb-6 text-xl font-bold text-gray-900">
                {language === "ne" ? "ठेगाना तथा अन्तिम विवरण" : "Address and Final Details"}
              </h2>
              <div className="grid gap-5 md:grid-cols-2">
                {addressFields.map((field) => (
                  <InputField
                    key={field.name}
                    field={field}
                    value={data[field.name] || ""}
                    onChange={updateField}
                    language={language}
                  />
                ))}
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <InputField
                  field={{ name: "currentProvince", label: { ne: "हालको ठेगाना: प्रदेश", en: "Current Address: Province" } }}
                  value={data.currentProvince || ""}
                  onChange={updateField}
                  language={language}
                />
                <InputField
                  field={{ name: "currentDistrict", label: { ne: "जिल्ला", en: "District" } }}
                  value={data.currentDistrict || ""}
                  onChange={updateField}
                  language={language}
                />
                <InputField
                  field={{ name: "currentMunicipality", label: { ne: "गाउँपालिका/नगरपालिका", en: "Municipality/Rural Municipality" } }}
                  value={data.currentMunicipality || ""}
                  onChange={updateField}
                  language={language}
                />
                <InputField
                  field={{ name: "currentWard", label: { ne: "वडा नं.", en: "Ward Number" } }}
                  value={data.currentWard || ""}
                  onChange={updateField}
                  language={language}
                />
                <InputField
                  field={{ name: "currentPhone", label: { ne: "फोन/मोबाइल नं.", en: "Phone/Mobile Number" } }}
                  value={data.currentPhone || ""}
                  onChange={updateField}
                  language={language}
                />
                <InputField
                  field={{ name: "familyMembers", label: { ne: "परिवारमा सदस्य संख्या", en: "Number of Family Members" }, type: "number" }}
                  value={data.familyMembers || ""}
                  onChange={updateField}
                  language={language}
                />
                <InputField
                  field={{
                    name: "foreignEmployment",
                    label: { ne: "वैदेशिक रोजगारीबाट फर्किनुभएको छ?", en: "Have you returned from foreign employment?" },
                    type: "select",
                    options: [
                      { value: "हो", label: { ne: "हो", en: "Yes" } },
                      { value: "होइन", label: { ne: "होइन", en: "No" } },
                    ],
                  }}
                  value={data.foreignEmployment || ""}
                  onChange={updateField}
                  language={language}
                />
                <InputField
                  field={{
                    name: "foreignEmploymentDuration",
                    label: { ne: "वैदेशिक रोजगारीको अवधि", en: "Duration of Foreign Employment" },
                  }}
                  value={data.foreignEmploymentDuration || ""}
                  onChange={updateField}
                  language={language}
                />
                <InputField
                  field={{
                    name: "foreignEmploymentWantsToGo",
                    label: { ne: "वैदेशिक रोजगारीमा जान चाहनुहुन्छ?", en: "Would you like to go for foreign employment?" },
                    type: "select",
                    options: [
                      { value: "छ", label: { ne: "छ", en: "Yes" } },
                      { value: "छैन", label: { ne: "छैन", en: "No" } },
                    ],
                  }}
                  value={data.foreignEmploymentWantsToGo || ""}
                  onChange={updateField}
                  language={language}
                />
                <InputField
                  field={{
                    name: "passport",
                    label: { ne: "राहदानी (पासपोर्ट) बनाउनु भएको छ?", en: "Do you have a passport?" },
                    type: "select",
                    options: [
                      { value: "छ", label: { ne: "छ", en: "Yes" } },
                      { value: "छैन", label: { ne: "छैन", en: "No" } },
                    ],
                  }}
                  value={data.passport || ""}
                  onChange={updateField}
                  language={language}
                />
                <InputField
                  field={{ name: "passportNumber", label: { ne: "पासपोर्ट नं.", en: "Passport Number" } }}
                  value={data.passportNumber || ""}
                  onChange={updateField}
                  language={language}
                />
                <InputField
                  field={{
                    name: "jobPlacement",
                    label: { ne: "निःशुल्क रोजगारी (Job Placement) सेवा चाहिन्छ?", en: "Do you need free job placement service?" },
                    type: "select",
                    options: [
                      { value: "चाहिन्छ", label: { ne: "चाहिन्छ", en: "Needed" } },
                      { value: "चाहिँदैन", label: { ne: "चाहिँदैन", en: "Not Needed" } },
                    ],
                  }}
                  value={data.jobPlacement || ""}
                  onChange={updateField}
                  language={language}
                />
              </div>

              <label className="mt-8 flex items-start gap-3 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={declarationAccepted}
                  onChange={(e) => setDeclarationAccepted(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  {language === "ne"
                    ? "माथि उल्लेखित विवरणहरू पूर्ण सत्य छन्। विवरण झुटा भएमा वा फाराममा पूरा विवरण नभरी फाराम अस्वीकृत भएमा सोको जिम्मेवार म आफैँ हुनेछु।"
                    : "The above details are completely true. I am responsible if the details are false or the application is rejected due to incomplete information."}
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
              {text.back}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading
                ? text.submitting
                : step === 3
                  ? text.submit
                  : text.next}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
