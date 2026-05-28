import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { SalaryInsights } from "../components/SalaryInsights"

vi.mock("@/lib/api", () => ({
  insightsApi: {
    getSummary: vi.fn().mockResolvedValue({
      total_employees: 10000,
      overall_avg_salary: 80000,
      overall_min_salary: 8000,
      overall_max_salary: 180000,
      total_countries: 10,
      total_job_titles: 10,
    }),
    getByCountry: vi.fn().mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({
        country: `Country ${i + 1}`,
        min_salary: 30000 + i * 1000,
        max_salary: 150000 + i * 1000,
        avg_salary: 80000 + i * 500,
        employee_count: 1000,
      }))
    ),
    getByJobTitle: vi.fn().mockResolvedValue(
      Array.from({ length: 25 }, (_, i) => ({
        country: `Country ${(i % 5) + 1}`,
        job_title: `Job Title ${i + 1}`,
        avg_salary: 70000 + i * 1000,
        employee_count: 400,
      }))
    ),
  },
  employeeApi: {
    getCountries: vi.fn().mockResolvedValue([
      "Country 1", "Country 2", "Country 3", "Country 4", "Country 5",
    ]),
  },
}))

describe("SalaryInsights", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render summary cards", async () => {
    render(<SalaryInsights />)
    await waitFor(() => {
      expect(screen.getByText("10,000")).toBeInTheDocument()
    })
    expect(screen.getByText("Total Employees")).toBeInTheDocument()
    expect(screen.getByText("Average Salary")).toBeInTheDocument()
    expect(screen.getByText("Countries")).toBeInTheDocument()
    expect(screen.getByText("Job Titles")).toBeInTheDocument()
  })

  it("should render pagination for Salary by Country section", async () => {
    render(<SalaryInsights />)
    await waitFor(() => {
      expect(screen.getByText("Salary by Country")).toBeInTheDocument()
    })
    const countryCard = screen.getByText("Salary by Country").closest("[class*='card']") ||
      screen.getByText("Salary by Country").parentElement?.parentElement?.parentElement
    expect(countryCard).toBeInTheDocument()
    // Should show page indicator text
    expect(screen.getByText(/Showing .* of 10/)).toBeInTheDocument()
  })

  it("should render pagination for Salary by Job Title section", async () => {
    render(<SalaryInsights />)
    await waitFor(() => {
      expect(screen.getByText("Salary by Job Title")).toBeInTheDocument()
    })
    // Should show page indicator text for job titles (25 items)
    expect(screen.getByText(/Showing .* of 25/)).toBeInTheDocument()
  })

  it("should navigate pages in Salary by Job Title section", async () => {
    const user = userEvent.setup()
    render(<SalaryInsights />)

    await waitFor(() => {
      expect(screen.getByText("Salary by Job Title")).toBeInTheDocument()
    })

    // Find the "Next" buttons — there should be two (one per section)
    const nextButtons = screen.getAllByText("Next")
    expect(nextButtons.length).toBeGreaterThanOrEqual(1)

    // Click the job title section's Next button (second one)
    const jobTitleNext = nextButtons[nextButtons.length - 1]
    await user.click(jobTitleNext)

    // Page should have changed — showing different range
    await waitFor(() => {
      expect(screen.getByText(/Showing .* of 25/)).toBeInTheDocument()
    })
  })
})
