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

const sampleEmployee = {
  full_name: "John Doe",
  job_title: "Software Engineer",
  country: "USA",
  salary: 85000,
  department: "Engineering",
  hire_date: "2023-01-15",
};

describe("Employee API Routes", () => {
  describe("POST /api/employees", () => {
    it("should create a new employee", async () => {
      const res = await request(app)
        .post("/api/employees")
        .send(sampleEmployee);

      expect(res.status).toBe(201);
      expect(res.body.full_name).toBe("John Doe");
      expect(res.body.id).toBeDefined();
    });

    it("should return 400 when required fields are missing", async () => {
      const res = await request(app)
        .post("/api/employees")
        .send({ full_name: "John" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("All fields are required");
    });

    it("should return 400 for negative salary", async () => {
      const res = await request(app)
        .post("/api/employees")
        .send({ ...sampleEmployee, salary: -1000 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Salary must be a non-negative number");
    });
  });

  describe("GET /api/employees", () => {
    it("should return paginated employees", async () => {
      await request(app).post("/api/employees").send(sampleEmployee);
      await request(app)
        .post("/api/employees")
        .send({ ...sampleEmployee, full_name: "Jane Doe" });

      const res = await request(app).get("/api/employees?page=1&limit=10");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(2);
      expect(res.body.page).toBe(1);
    });

    it("should filter by search term", async () => {
      await request(app)
        .post("/api/employees")
        .send({ ...sampleEmployee, full_name: "Alice Smith" });
      await request(app)
        .post("/api/employees")
        .send({ ...sampleEmployee, full_name: "Bob Jones" });

      const res = await request(app).get("/api/employees?search=Alice");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].full_name).toBe("Alice Smith");
    });
  });

  describe("GET /api/employees/:id", () => {
    it("should return an employee by id", async () => {
      const createRes = await request(app)
        .post("/api/employees")
        .send(sampleEmployee);

      const res = await request(app).get(
        `/api/employees/${createRes.body.id}`
      );

      expect(res.status).toBe(200);
      expect(res.body.full_name).toBe("John Doe");
    });

    it("should return 404 for non-existent employee", async () => {
      const res = await request(app).get(
        "/api/employees/00000000-0000-0000-0000-000000000000"
      );

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/employees/:id", () => {
    it("should update an employee", async () => {
      const createRes = await request(app)
        .post("/api/employees")
        .send(sampleEmployee);

      const res = await request(app)
        .put(`/api/employees/${createRes.body.id}`)
        .send({ salary: 95000 });

      expect(res.status).toBe(200);
      expect(Number(res.body.salary)).toBe(95000);
      expect(res.body.full_name).toBe("John Doe");
    });

    it("should return 404 when updating non-existent employee", async () => {
      const res = await request(app)
        .put("/api/employees/00000000-0000-0000-0000-000000000000")
        .send({ salary: 95000 });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/employees/:id", () => {
    it("should delete an employee", async () => {
      const createRes = await request(app)
        .post("/api/employees")
        .send(sampleEmployee);

      const res = await request(app).delete(
        `/api/employees/${createRes.body.id}`
      );

      expect(res.status).toBe(204);
    });

    it("should return 404 when deleting non-existent employee", async () => {
      const res = await request(app).delete(
        "/api/employees/00000000-0000-0000-0000-000000000000"
      );

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/employees/countries", () => {
    it("should return distinct countries", async () => {
      await request(app)
        .post("/api/employees")
        .send({ ...sampleEmployee, country: "USA" });
      await request(app)
        .post("/api/employees")
        .send({ ...sampleEmployee, country: "India" });

      const res = await request(app).get("/api/employees/countries");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(["India", "USA"]);
    });
  });

  describe("GET /api/employees/job-titles", () => {
    it("should return distinct job titles", async () => {
      await request(app)
        .post("/api/employees")
        .send({ ...sampleEmployee, job_title: "Engineer" });
      await request(app)
        .post("/api/employees")
        .send({ ...sampleEmployee, job_title: "Designer" });

      const res = await request(app).get("/api/employees/job-titles");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(["Designer", "Engineer"]);
    });
  });
});
