import "server-only";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export const programTrainingStatuses = [
  "UPCOMING",
  "ONGOING",
  "COMPLETED",
] as const;

export type ProgramTrainingStatus = (typeof programTrainingStatuses)[number];

export type ProgramInput = {
  projectId: string;
  name: string;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  trainingStatus: ProgramTrainingStatus;
};

function isProgramTrainingStatus(
  value: unknown,
): value is ProgramTrainingStatus {
  return (
    typeof value === "string" &&
    programTrainingStatuses.some((status) => status === value)
  );
}

type ProgramInputResult =
  | { success: true; input: ProgramInput }
  | { success: false; message: string };

function parseDate(
  value: unknown,
  label: string,
): { date: Date | null } | { error: string } {
  if (value === null || value === undefined || value === "") {
    return { date: null };
  }

  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return { error: `${label} must be a valid date.` };
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return { error: `${label} must be a valid date.` };
  }

  return { date };
}

export function parseProgramInput(body: unknown): ProgramInputResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { success: false, message: "Invalid request data." };
  }

  const data = body as Record<string, unknown>;
  const projectId =
    typeof data.projectId === "string" ? data.projectId.trim() : "";
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const description =
    typeof data.description === "string" ? data.description.trim() : "";
  const trainingStatus = data.trainingStatus;

  if (!projectId || !name || !isProgramTrainingStatus(trainingStatus)) {
    return {
      success: false,
      message: "Project, program name and a valid program status are required.",
    };
  }

  if (projectId.length > 191 || name.length > 191 || description.length > 10000) {
    return {
      success: false,
      message: "Program details exceed the allowed length.",
    };
  }

  const start = parseDate(data.startDate, "Start date");
  if ("error" in start) return { success: false, message: start.error };

  const end = parseDate(data.endDate, "End date");
  if ("error" in end) return { success: false, message: end.error };

  if (start.date && end.date && start.date > end.date) {
    return {
      success: false,
      message: "End date must be on or after the start date.",
    };
  }

  return {
    success: true,
    input: {
      projectId,
      name,
      description: description || null,
      startDate: start.date,
      endDate: end.date,
      trainingStatus,
    },
  };
}

export const requireProgramAdmin = requireAdmin;
