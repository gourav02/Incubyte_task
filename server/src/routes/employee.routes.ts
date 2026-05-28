import { Router, Request, Response } from "express";
import { EmployeeRepository } from "../repositories/employee.repository";
import { db } from "../config/database";

const router = Router();
const repo = new EmployeeRepository(db);

router.get("/", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;
    const country = req.query.country as string | undefined;
    const jobTitle = req.query.jobTitle as string | undefined;

    const result = await repo.findAll(page, limit, search, country, jobTitle);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

router.get("/countries", async (_req: Request, res: Response) => {
  try {
    const countries = await repo.getDistinctCountries();
    res.json(countries);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch countries" });
  }
});

router.get("/job-titles", async (_req: Request, res: Response) => {
  try {
    const jobTitles = await repo.getDistinctJobTitles();
    res.json(jobTitles);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch job titles" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const employee = await repo.findById(req.params.id as string);
    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch employee" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { full_name, job_title, country, salary, department, hire_date } =
      req.body;

    if (!full_name || !job_title || !country || salary == null || !department || !hire_date) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    if (typeof salary !== "number" || salary < 0) {
      res.status(400).json({ error: "Salary must be a non-negative number" });
      return;
    }

    const employee = await repo.create({
      full_name,
      job_title,
      country,
      salary,
      department,
      hire_date,
    });
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ error: "Failed to create employee" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { full_name, job_title, country, salary, department, hire_date } =
      req.body;

    if (salary !== undefined && (typeof salary !== "number" || salary < 0)) {
      res.status(400).json({ error: "Salary must be a non-negative number" });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (job_title !== undefined) updateData.job_title = job_title;
    if (country !== undefined) updateData.country = country;
    if (salary !== undefined) updateData.salary = salary;
    if (department !== undefined) updateData.department = department;
    if (hire_date !== undefined) updateData.hire_date = hire_date;

    const employee = await repo.update(req.params.id as string, updateData);
    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: "Failed to update employee" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await repo.delete(req.params.id as string);
    if (!deleted) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete employee" });
  }
});

export default router;
