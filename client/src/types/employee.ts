export interface Employee {
  id: string;
  full_name: string;
  job_title: string;
  country: string;
  salary: number;
  department: string;
  hire_date: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEmployeeDTO {
  full_name: string;
  job_title: string;
  country: string;
  salary: number;
  department: string;
  hire_date: string;
}

export interface UpdateEmployeeDTO {
  full_name?: string;
  job_title?: string;
  country?: string;
  salary?: number;
  department?: string;
  hire_date?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SalaryInsightByCountry {
  country: string;
  min_salary: number;
  max_salary: number;
  avg_salary: number;
  employee_count: number;
}

export interface SalaryInsightByJobTitle {
  country: string;
  job_title: string;
  avg_salary: number;
  employee_count: number;
}

export interface SalarySummary {
  total_employees: number;
  overall_avg_salary: number;
  overall_min_salary: number;
  overall_max_salary: number;
  total_countries: number;
  total_job_titles: number;
}
