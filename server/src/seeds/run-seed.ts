import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

import { db } from "../config/database";

const TOTAL_EMPLOYEES = 10000;
const BATCH_SIZE = 1000;

const COUNTRIES = [
  "USA",
  "India",
  "United Kingdom",
  "Germany",
  "Canada",
  "Australia",
  "France",
  "Japan",
  "Brazil",
  "Netherlands",
];

const JOB_TITLES = [
  "Software Engineer",
  "Senior Software Engineer",
  "Product Manager",
  "Data Analyst",
  "UX Designer",
  "DevOps Engineer",
  "QA Engineer",
  "Engineering Manager",
  "Business Analyst",
  "Full Stack Developer",
];

const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Data",
  "Operations",
  "Marketing",
  "Sales",
  "Human Resources",
  "Finance",
  "Legal",
];

const SALARY_RANGES: Record<string, { min: number; max: number }> = {
  USA: { min: 55000, max: 180000 },
  India: { min: 8000, max: 45000 },
  "United Kingdom": { min: 40000, max: 130000 },
  Germany: { min: 45000, max: 140000 },
  Canada: { min: 50000, max: 150000 },
  Australia: { min: 50000, max: 160000 },
  France: { min: 38000, max: 120000 },
  Japan: { min: 35000, max: 110000 },
  Brazil: { min: 12000, max: 55000 },
  Netherlands: { min: 42000, max: 135000 },
};

function loadNames(filename: string): string[] {
  const filePath = path.join(__dirname, filename);
  return fs
    .readFileSync(filePath, "utf-8")
    .split("\n")
    .map((n) => n.trim())
    .filter(Boolean);
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSalary(country: string): number {
  const range = SALARY_RANGES[country];
  return Math.round(range.min + Math.random() * (range.max - range.min));
}

function randomDate(start: Date, end: Date): string {
  const date = new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
  return date.toISOString().split("T")[0];
}

async function seed() {
  console.log("Starting seed...");
  const startTime = Date.now();

  const firstNames = loadNames("first_names.txt");
  const lastNames = loadNames("last_names.txt");

  console.log(
    `Loaded ${firstNames.length} first names and ${lastNames.length} last names`
  );

  const hireStart = new Date("2018-01-01");
  const hireEnd = new Date("2024-12-31");

  await db.migrate.latest();
  await db("employees").del();

  const totalBatches = Math.ceil(TOTAL_EMPLOYEES / BATCH_SIZE);

  for (let batch = 0; batch < totalBatches; batch++) {
    const batchStart = batch * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, TOTAL_EMPLOYEES);
    const employees = [];

    for (let i = batchStart; i < batchEnd; i++) {
      const country = randomElement(COUNTRIES);
      employees.push({
        full_name: `${randomElement(firstNames)} ${randomElement(lastNames)}`,
        job_title: randomElement(JOB_TITLES),
        country,
        salary: randomSalary(country),
        department: randomElement(DEPARTMENTS),
        hire_date: randomDate(hireStart, hireEnd),
      });
    }

    await db("employees").insert(employees);
    console.log(
      `Inserted batch ${batch + 1}/${totalBatches} (${employees.length} employees)`
    );
  }

  const elapsed = Date.now() - startTime;
  console.log(
    `Seed complete: ${TOTAL_EMPLOYEES} employees inserted in ${elapsed}ms`
  );

  await db.destroy();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
