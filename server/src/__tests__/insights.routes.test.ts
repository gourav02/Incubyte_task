import request from "supertest";
import app from "../app";
import { db } from "../config/database";

beforeAll(async () => {
  await db.migrate.latest();
});

afterAll(async () => {
  await db.destroy();
});

beforeEach(async () => {
  await db("employees").del();
});

const createEmployee = (overrides: Record<string, unknown> = {}) =>
  request(app)
    .post("/api/employees")
    .send({
      full_name: "Test User",
      job_title: "Engineer",
      country: "USA",
      salary: 80000,
      department: "Engineering",
      hire_date: "2023-01-01",
      ...overrides,
    });

describe("Insights API Routes", () => {
  describe("GET /api/insights/by-country", () => {
    it("should return salary insights grouped by country", async () => {
      await createEmployee({ country: "USA", salary: 60000 });
      await createEmployee({ country: "USA", salary: 100000 });
      await createEmployee({ country: "India", salary: 40000 });

      const res = await request(app).get("/api/insights/by-country");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);

      const usa = res.body.find(
        (r: { country: string }) => r.country === "USA"
      );
      expect(usa.min_salary).toBe(60000);
      expect(usa.max_salary).toBe(100000);
      expect(usa.avg_salary).toBe(80000);
    });

    it("should filter by country query param", async () => {
      await createEmployee({ country: "USA", salary: 70000 });
      await createEmployee({ country: "India", salary: 50000 });

      const res = await request(app).get(
        "/api/insights/by-country?country=India"
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].country).toBe("India");
    });
  });

  describe("GET /api/insights/by-job-title", () => {
    it("should return avg salary by job title per country", async () => {
      await createEmployee({
        country: "USA",
        job_title: "Engineer",
        salary: 90000,
      });
      await createEmployee({
        country: "USA",
        job_title: "Designer",
        salary: 75000,
      });

      const res = await request(app).get("/api/insights/by-job-title");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it("should filter by country", async () => {
      await createEmployee({ country: "USA", job_title: "Engineer" });
      await createEmployee({ country: "India", job_title: "Engineer" });

      const res = await request(app).get(
        "/api/insights/by-job-title?country=USA"
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].country).toBe("USA");
    });
  });

  describe("GET /api/insights/summary", () => {
    it("should return overall salary summary", async () => {
      await createEmployee({ country: "USA", salary: 60000 });
      await createEmployee({ country: "India", salary: 40000 });

      const res = await request(app).get("/api/insights/summary");

      expect(res.status).toBe(200);
      expect(res.body.total_employees).toBe(2);
      expect(res.body.overall_avg_salary).toBe(50000);
      expect(res.body.overall_min_salary).toBe(40000);
      expect(res.body.overall_max_salary).toBe(60000);
      expect(res.body.total_countries).toBe(2);
    });
  });
});
