import { Knex } from "knex";
import {
  SalaryInsightByCountry,
  SalaryInsightByJobTitle,
  SalarySummary,
} from "../types/employee";

export class InsightsRepository {
  constructor(private db: Knex) {}

  async getSalaryByCountry(
    country?: string
  ): Promise<SalaryInsightByCountry[]> {
    const query = this.db("employees")
      .select("country")
      .min("salary as min_salary")
      .max("salary as max_salary")
      .avg("salary as avg_salary")
      .count("id as employee_count")
      .groupBy("country")
      .orderBy("country");

    if (country) {
      query.where("country", country);
    }

    const rows = await query;
    return rows.map((row) => ({
      country: row.country,
      min_salary: Number(row.min_salary),
      max_salary: Number(row.max_salary),
      avg_salary: Math.round(Number(row.avg_salary) * 100) / 100,
      employee_count: Number(row.employee_count),
    }));
  }

  async getSalaryByJobTitle(
    country?: string
  ): Promise<SalaryInsightByJobTitle[]> {
    const query = this.db("employees")
      .select("country", "job_title")
      .avg("salary as avg_salary")
      .count("id as employee_count")
      .groupBy("country", "job_title")
      .orderBy(["country", "job_title"]);

    if (country) {
      query.where("country", country);
    }

    const rows = await query;
    return rows.map((row) => ({
      country: row.country,
      job_title: row.job_title,
      avg_salary: Math.round(Number(row.avg_salary) * 100) / 100,
      employee_count: Number(row.employee_count),
    }));
  }

  async getSummary(): Promise<SalarySummary> {
    const result = await this.db("employees")
      .count("id as total_employees")
      .avg("salary as overall_avg_salary")
      .min("salary as overall_min_salary")
      .max("salary as overall_max_salary")
      .first();

    const countryCount = await this.db("employees")
      .countDistinct("country as count")
      .first();

    const jobTitleCount = await this.db("employees")
      .countDistinct("job_title as count")
      .first();

    return {
      total_employees: Number(result?.total_employees || 0),
      overall_avg_salary:
        Math.round(Number(result?.overall_avg_salary || 0) * 100) / 100,
      overall_min_salary: Number(result?.overall_min_salary || 0),
      overall_max_salary: Number(result?.overall_max_salary || 0),
      total_countries: Number(countryCount?.count || 0),
      total_job_titles: Number(jobTitleCount?.count || 0),
    };
  }
}
