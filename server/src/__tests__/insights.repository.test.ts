import { db } from "../config/database";
import { EmployeeRepository } from "../repositories/employee.repository";
import { InsightsRepository } from "../repositories/insights.repository";
import { CreateEmployeeDTO } from "../types/employee";

const employeeRepo = new EmployeeRepository(db);
const insightsRepo = new InsightsRepository(db);

const makeEmployee = (
  overrides: Partial<CreateEmployeeDTO> = {}
): CreateEmployeeDTO => ({
  full_name: "Test User",
  job_title: "Engineer",
  country: "USA",
  salary: 80000,
  department: "Engineering",
  hire_date: "2023-01-01",
  ...overrides,
});

beforeAll(async () => {
  await db.migrate.latest();
});

afterAll(async () => {
  await db.destroy();
});

beforeEach(async () => {
  await db("employees").del();
});

describe("InsightsRepository", () => {
  describe("getSalaryByCountry", () => {
    it("should return min, max, avg salary grouped by country", async () => {
      await employeeRepo.create(
        makeEmployee({ country: "USA", salary: 60000 })
      );
      await employeeRepo.create(
        makeEmployee({ country: "USA", salary: 100000 })
      );
      await employeeRepo.create(
        makeEmployee({ country: "India", salary: 40000 })
      );

      const results = await insightsRepo.getSalaryByCountry();

      expect(results).toHaveLength(2);

      const india = results.find((r) => r.country === "India")!;
      expect(india.min_salary).toBe(40000);
      expect(india.max_salary).toBe(40000);
      expect(india.avg_salary).toBe(40000);
      expect(india.employee_count).toBe(1);

      const usa = results.find((r) => r.country === "USA")!;
      expect(usa.min_salary).toBe(60000);
      expect(usa.max_salary).toBe(100000);
      expect(usa.avg_salary).toBe(80000);
      expect(usa.employee_count).toBe(2);
    });

    it("should filter by specific country", async () => {
      await employeeRepo.create(
        makeEmployee({ country: "USA", salary: 70000 })
      );
      await employeeRepo.create(
        makeEmployee({ country: "India", salary: 50000 })
      );

      const results = await insightsRepo.getSalaryByCountry("India");

      expect(results).toHaveLength(1);
      expect(results[0].country).toBe("India");
      expect(results[0].avg_salary).toBe(50000);
    });

    it("should return empty array when no employees exist", async () => {
      const results = await insightsRepo.getSalaryByCountry();
      expect(results).toEqual([]);
    });
  });

  describe("getSalaryByJobTitle", () => {
    it("should return avg salary by job title and country", async () => {
      await employeeRepo.create(
        makeEmployee({
          country: "USA",
          job_title: "Engineer",
          salary: 90000,
        })
      );
      await employeeRepo.create(
        makeEmployee({
          country: "USA",
          job_title: "Designer",
          salary: 75000,
        })
      );
      await employeeRepo.create(
        makeEmployee({
          country: "India",
          job_title: "Engineer",
          salary: 40000,
        })
      );

      const results = await insightsRepo.getSalaryByJobTitle();

      expect(results).toHaveLength(3);

      const usaEngineer = results.find(
        (r) => r.country === "USA" && r.job_title === "Engineer"
      )!;
      expect(usaEngineer.avg_salary).toBe(90000);
      expect(usaEngineer.employee_count).toBe(1);
    });

    it("should filter by country", async () => {
      await employeeRepo.create(
        makeEmployee({
          country: "USA",
          job_title: "Engineer",
          salary: 90000,
        })
      );
      await employeeRepo.create(
        makeEmployee({
          country: "India",
          job_title: "Engineer",
          salary: 40000,
        })
      );

      const results = await insightsRepo.getSalaryByJobTitle("USA");

      expect(results).toHaveLength(1);
      expect(results[0].country).toBe("USA");
    });
  });

  describe("getSummary", () => {
    it("should return overall salary summary", async () => {
      await employeeRepo.create(
        makeEmployee({ country: "USA", job_title: "Engineer", salary: 60000 })
      );
      await employeeRepo.create(
        makeEmployee({ country: "USA", job_title: "Designer", salary: 80000 })
      );
      await employeeRepo.create(
        makeEmployee({
          country: "India",
          job_title: "Engineer",
          salary: 40000,
        })
      );

      const summary = await insightsRepo.getSummary();

      expect(summary.total_employees).toBe(3);
      expect(summary.overall_min_salary).toBe(40000);
      expect(summary.overall_max_salary).toBe(80000);
      expect(summary.overall_avg_salary).toBe(60000);
      expect(summary.total_countries).toBe(2);
      expect(summary.total_job_titles).toBe(2);
    });

    it("should return zeros when no employees exist", async () => {
      const summary = await insightsRepo.getSummary();

      expect(summary.total_employees).toBe(0);
      expect(summary.overall_avg_salary).toBe(0);
      expect(summary.overall_min_salary).toBe(0);
      expect(summary.overall_max_salary).toBe(0);
      expect(summary.total_countries).toBe(0);
      expect(summary.total_job_titles).toBe(0);
    });
  });
});
