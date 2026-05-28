import fs from "fs";
import path from "path";

describe("Seed data files", () => {
  const seedDir = path.join(__dirname, "..", "seeds");

  it("should have first_names.txt with at least 50 names", () => {
    const content = fs.readFileSync(
      path.join(seedDir, "first_names.txt"),
      "utf-8"
    );
    const names = content
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);
    expect(names.length).toBeGreaterThanOrEqual(50);
    expect(names.every((n) => n.length > 0)).toBe(true);
  });

  it("should have last_names.txt with at least 50 names", () => {
    const content = fs.readFileSync(
      path.join(seedDir, "last_names.txt"),
      "utf-8"
    );
    const names = content
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);
    expect(names.length).toBeGreaterThanOrEqual(50);
    expect(names.every((n) => n.length > 0)).toBe(true);
  });

  it("should generate valid full names from combining first and last names", () => {
    const firstNames = fs
      .readFileSync(path.join(seedDir, "first_names.txt"), "utf-8")
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);
    const lastNames = fs
      .readFileSync(path.join(seedDir, "last_names.txt"), "utf-8")
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);

    const fullName = `${firstNames[0]} ${lastNames[0]}`;
    expect(fullName).toBe("James Smith");
    expect(fullName.split(" ")).toHaveLength(2);
  });
});
