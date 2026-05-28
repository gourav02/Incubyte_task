import { Knex } from "knex";
import {
  Employee,
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  PaginatedResponse,
} from "../types/employee";

export class EmployeeRepository {
  constructor(private db: Knex) {}

  async findAll(
    page: number = 1,
    limit: number = 20,
    search?: string,
    country?: string,
    jobTitle?: string
  ): Promise<PaginatedResponse<Employee>> {
    const query = this.db("employees");

    if (search) {
      query.where("full_name", "ilike", `%${search}%`);
    }
    if (country) {
      query.where("country", country);
    }
    if (jobTitle) {
      query.where("job_title", jobTitle);
    }

    const countResult = await query.clone().count("id as total").first();
    const total = Number(countResult?.total || 0);

    const offset = (page - 1) * limit;
    const data = await query
      .clone()
      .select("*")
      .orderBy("created_at", "desc")
      .offset(offset)
      .limit(limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Employee | null> {
    const employee = await this.db("employees").where({ id }).first();
    return employee || null;
  }

  async create(data: CreateEmployeeDTO): Promise<Employee> {
    const [employee] = await this.db("employees").insert(data).returning("*");
    return employee;
  }

  async update(id: string, data: UpdateEmployeeDTO): Promise<Employee | null> {
    const [employee] = await this.db("employees")
      .where({ id })
      .update({ ...data, updated_at: this.db.fn.now() })
      .returning("*");
    return employee || null;
  }

  async delete(id: string): Promise<boolean> {
    const count = await this.db("employees").where({ id }).del();
    return count > 0;
  }

  async getDistinctCountries(): Promise<string[]> {
    const rows = await this.db("employees")
      .distinct("country")
      .orderBy("country");
    return rows.map((r) => r.country);
  }

  async getDistinctJobTitles(): Promise<string[]> {
    const rows = await this.db("employees")
      .distinct("job_title")
      .orderBy("job_title");
    return rows.map((r) => r.job_title);
  }
}
