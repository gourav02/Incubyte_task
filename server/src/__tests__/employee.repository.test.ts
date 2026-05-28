import { db } from "../config/database";
import { EmployeeRepository } from "../repositories/employee.repository";
import { CreateEmployeeDTO } from "../types/employee";

const repo = new EmployeeRepository(db);

const sampleEmployee: CreateEmployeeDTO = {
  full_name: "John Doe",
  job_title: "Software Engineer",
  country: "USA",
  salary: 85000,
  department: "Engineering",
  hire_date: "2023-01-15",
};

beforeAll(async () => {
  await db.migrate.latest();
});

afterAll(async () => {
  await db.destroy();
});

beforeEach(async () => {
  await db("employees").del();
});

describe("EmployeeRepository", () => {
  describe("create", () => {
    it("should create an employee and return it with an id", async () => {
      const result = await repo.create(sampleEmployee);

      expect(result).toMatchObject({
        full_name: "John Doe",
        job_title: "Software Engineer",
        country: "USA",
        department: "Engineering",
      });
      expect(result.id).toBeDefined();
      expect(Number(result.salary)).toBe(85000);
    });

    it("should set created_at and updated_at timestamps", async () => {
      const result = await repo.create(sampleEmployee);

      expect(result.created_at).toBeDefined();
      expect(result.updated_at).toBeDefined();
    });
  });

  describe("findById", () => {
    it("should return an employee by id", async () => {
      const created = await repo.create(sampleEmployee);
      const found = await repo.findById(created.id);

      expect(found).not.toBeNull();
      expect(found!.full_name).toBe("John Doe");
    });

    it("should return null for non-existent id", async () => {
      const found = await repo.findById("00000000-0000-0000-0000-000000000000");
      expect(found).toBeNull();
    });
  });

  describe("update", () => {
    it("should update employee fields", async () => {
      const created = await repo.create(sampleEmployee);
      const updated = await repo.update(created.id, {
        salary: 95000,
        job_title: "Senior Software Engineer",
      });

      expect(updated).not.toBeNull();
      expect(Number(updated!.salary)).toBe(95000);
      expect(updated!.job_title).toBe("Senior Software Engineer");
      expect(updated!.full_name).toBe("John Doe");
    });

    it("should return null when updating non-existent employee", async () => {
      const updated = await repo.update(
        "00000000-0000-0000-0000-000000000000",
        { salary: 100000 }
      );
      expect(updated).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete an employee and return true", async () => {
      const created = await repo.create(sampleEmployee);
      const deleted = await repo.delete(created.id);

      expect(deleted).toBe(true);
      const found = await repo.findById(created.id);
      expect(found).toBeNull();
    });

    it("should return false when deleting non-existent employee", async () => {
      const deleted = await repo.delete(
        "00000000-0000-0000-0000-000000000000"
      );
      expect(deleted).toBe(false);
    });
  });

  describe("findAll", () => {
    it("should return paginated results", async () => {
      for (let i = 0; i < 5; i++) {
        await repo.create({ ...sampleEmployee, full_name: `Employee ${i}` });
      }

      const result = await repo.findAll(1, 2);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.totalPages).toBe(3);
    });

    it("should filter by search term", async () => {
      await repo.create({ ...sampleEmployee, full_name: "Alice Smith" });
      await repo.create({ ...sampleEmployee, full_name: "Bob Jones" });

      const result = await repo.findAll(1, 20, "Alice");

      expect(result.data).toHaveLength(1);
      expect(result.data[0].full_name).toBe("Alice Smith");
    });

    it("should filter by country", async () => {
      await repo.create({ ...sampleEmployee, country: "USA" });
      await repo.create({ ...sampleEmployee, country: "India" });

      const result = await repo.findAll(1, 20, undefined, "India");

      expect(result.data).toHaveLength(1);
      expect(result.data[0].country).toBe("India");
    });

    it("should filter by job title", async () => {
      await repo.create({ ...sampleEmployee, job_title: "Designer" });
      await repo.create({ ...sampleEmployee, job_title: "Engineer" });

      const result = await repo.findAll(
        1,
        20,
        undefined,
        undefined,
        "Designer"
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].job_title).toBe("Designer");
    });
  });

  describe("getDistinctCountries", () => {
    it("should return sorted unique countries", async () => {
      await repo.create({ ...sampleEmployee, country: "USA" });
      await repo.create({ ...sampleEmployee, country: "India" });
      await repo.create({ ...sampleEmployee, country: "USA" });

      const countries = await repo.getDistinctCountries();

      expect(countries).toEqual(["India", "USA"]);
    });
  });

  describe("getDistinctJobTitles", () => {
    it("should return sorted unique job titles", async () => {
      await repo.create({ ...sampleEmployee, job_title: "Engineer" });
      await repo.create({ ...sampleEmployee, job_title: "Designer" });
      await repo.create({ ...sampleEmployee, job_title: "Engineer" });

      const titles = await repo.getDistinctJobTitles();

      expect(titles).toEqual(["Designer", "Engineer"]);
    });
  });
});
