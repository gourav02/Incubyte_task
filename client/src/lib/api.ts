import type {
  Employee,
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  PaginatedResponse,
  SalaryInsightByCountry,
  SalaryInsightByJobTitle,
  SalarySummary,
} from "../types/employee";

const BASE_URL = "/api";

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const employeeApi = {
  getAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    country?: string;
    jobTitle?: string;
  } = {}): Promise<PaginatedResponse<Employee>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.search) searchParams.set("search", params.search);
    if (params.country) searchParams.set("country", params.country);
    if (params.jobTitle) searchParams.set("jobTitle", params.jobTitle);
    return fetchJSON(`${BASE_URL}/employees?${searchParams}`);
  },

  getById(id: string): Promise<Employee> {
    return fetchJSON(`${BASE_URL}/employees/${id}`);
  },

  create(data: CreateEmployeeDTO): Promise<Employee> {
    return fetchJSON(`${BASE_URL}/employees`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: UpdateEmployeeDTO): Promise<Employee> {
    return fetchJSON(`${BASE_URL}/employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return fetchJSON(`${BASE_URL}/employees/${id}`, { method: "DELETE" });
  },

  getCountries(): Promise<string[]> {
    return fetchJSON(`${BASE_URL}/employees/countries`);
  },

  getJobTitles(): Promise<string[]> {
    return fetchJSON(`${BASE_URL}/employees/job-titles`);
  },
};

export const insightsApi = {
  getByCountry(country?: string): Promise<SalaryInsightByCountry[]> {
    const params = country ? `?country=${encodeURIComponent(country)}` : "";
    return fetchJSON(`${BASE_URL}/insights/by-country${params}`);
  },

  getByJobTitle(country?: string): Promise<SalaryInsightByJobTitle[]> {
    const params = country ? `?country=${encodeURIComponent(country)}` : "";
    return fetchJSON(`${BASE_URL}/insights/by-job-title${params}`);
  },

  getSummary(): Promise<SalarySummary> {
    return fetchJSON(`${BASE_URL}/insights/summary`);
  },
};
