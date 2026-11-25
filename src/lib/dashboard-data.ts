export const dashboardQueryKeys = {
  summary: ["dashboard", "summary"] as const,
  notifications: ["dashboard", "notifications"] as const,
  members: (search: string, status: string) =>
    ["dashboard", "members", search, status] as const,
  membersRoot: ["dashboard", "members"] as const,
  enrollments: (search: string, status: string, page: number) =>
    ["dashboard", "enrollments", search, status, page] as const,
  enrollmentsRoot: ["dashboard", "enrollments"] as const,
  donors: ["dashboard", "donors"] as const,
  partners: ["dashboard", "partners"] as const,
  programs: ["dashboard", "programs"] as const,
  gallery: ["dashboard", "gallery"] as const,
};

type ApiResponse<T> = T & {
  success?: boolean;
  message?: string;
};

export async function fetchDashboardData<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok || result.success !== true) {
    throw new Error(result.message || "Unable to load dashboard data.");
  }

  return result;
}
