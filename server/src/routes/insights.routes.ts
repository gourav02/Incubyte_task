import { Router, Request, Response } from "express";
import { InsightsRepository } from "../repositories/insights.repository";
import { db } from "../config/database";

const router = Router();
const repo = new InsightsRepository(db);

router.get("/by-country", async (req: Request, res: Response) => {
  try {
    const country = req.query.country as string | undefined;
    const results = await repo.getSalaryByCountry(country);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch salary insights by country" });
  }
});

router.get("/by-job-title", async (req: Request, res: Response) => {
  try {
    const country = req.query.country as string | undefined;
    const results = await repo.getSalaryByJobTitle(country);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch salary insights by job title" });
  }
});

router.get("/summary", async (_req: Request, res: Response) => {
  try {
    const summary = await repo.getSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch salary summary" });
  }
});

export default router;
