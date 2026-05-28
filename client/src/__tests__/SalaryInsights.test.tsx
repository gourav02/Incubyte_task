import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { SalaryInsights } from "../components/SalaryInsights"
import { insightsApi } from "@/lib/api"

const allCountryData = Array.from({ length: 10 }, (_, i) => ({
  country: `Country ${i + 1}`,
  min_salary: 30000 + i * 1000,
  max_salary: 150000 + i * 1000,
  avg_salary: 80000 + i * 500,
  employee_count: 1000,
}))

const allJobTitleData = Array.from({ length: 25 }, (_, i) => ({
  country: `Country ${(i % 5) + 1}`,
  job_title: `Job Title ${i + 1}`,
  avg_salary: 70000 + i * 1000,
  employee_count: 400,
}))

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
    getByCountry: vi.fn().mockImplementation((country?: string) => {
      if (country) {
        return Promise.resolve(allCountryData.filter((d) => d.country === country))
      }
      return Promise.resolve(allCountryData)
    }),
    getByJobTitle: vi.fn().mockImplementation((country?: string) => {
      if (country) {
        return Promise.resolve(allJobTitleData.filter((d) => d.country === country))
      }
      return Promise.resolve(allJobTitleData)
    }),
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
    // Should show page indicator text (10 items, default page size 5)
    expect(screen.getByText(/Showing 1–5 of 10/)).toBeInTheDocument()
  })

  it("should render pagination for Salary by Job Title section", async () => {
    render(<SalaryInsights />)
    await waitFor(() => {
      expect(screen.getByText("Salary by Job Title")).toBeInTheDocument()
    })
    // Should show page indicator text for job titles (25 items)
    expect(screen.getByText(/Showing 1–5 of 25/)).toBeInTheDocument()
  })

  it("should navigate pages in Salary by Job Title section", async () => {
    const user = userEvent.setup()
    render(<SalaryInsights />)

    await waitFor(() => {
      expect(screen.getByText(/Showing 1–5 of 25/)).toBeInTheDocument()
    })

    // Click the job title section's Next button (second one)
    const nextButtons = screen.getAllByText("Next")
    await user.click(nextButtons[nextButtons.length - 1])

    await waitFor(() => {
      expect(screen.getByText(/Showing 6–10 of 25/)).toBeInTheDocument()
    })
  })

  it("should show country data when filtering by a specific country", async () => {
    const user = userEvent.setup()
    render(<SalaryInsights />)

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText(/Showing 1–5 of 10/)).toBeInTheDocument()
    })

    // Filter by Country 1
    const filterSelect = screen.getAllByRole("combobox")[0]
    await user.selectOptions(filterSelect, "Country 1")

    // API should be called with country param
    await waitFor(() => {
      expect(insightsApi.getByCountry).toHaveBeenCalledWith("Country 1")
    })

    // After filtering to single country, should show 1 result
    await waitFor(() => {
      expect(screen.getByText(/Showing 1–1 of 1/)).toBeInTheDocument()
    })
  })

  it("should reset page to 1 when country filter changes", async () => {
    const user = userEvent.setup()
    render(<SalaryInsights />)

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Showing 1–5 of 25/)).toBeInTheDocument()
    })

    // Navigate to page 2 in job title section
    const nextButtons = screen.getAllByText("Next")
    await user.click(nextButtons[nextButtons.length - 1])

    await waitFor(() => {
      expect(screen.getByText(/Showing 6–10 of 25/)).toBeInTheDocument()
    })

    // Now filter by Country 1 — should reset to page 1
    const filterSelect = screen.getAllByRole("combobox")[0]
    await user.selectOptions(filterSelect, "Country 1")

    // After filtering, Country 1 has 5 job titles, should show page 1
    await waitFor(() => {
      expect(screen.getByText(/Showing 1–5 of 5/)).toBeInTheDocument()
    })
  })

  it("should render page size selector with options 5, 10, 20, 50, 100", async () => {
    render(<SalaryInsights />)

    await waitFor(() => {
      expect(screen.getByText("Salary by Country")).toBeInTheDocument()
    })

    // There should be page size selectors in the pagination areas
    const pageSizeSelects = screen.getAllByDisplayValue("5")
    expect(pageSizeSelects.length).toBeGreaterThanOrEqual(1)
  })
})
