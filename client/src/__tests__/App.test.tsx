import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import App from "../App"

// Mock the child components to isolate App testing
vi.mock("@/components/EmployeeTable", () => ({
  EmployeeTable: () => <div data-testid="employee-table">Employee Table</div>,
}))

vi.mock("@/components/SalaryInsights", () => ({
  SalaryInsights: () => <div data-testid="salary-insights">Salary Insights</div>,
}))

describe("App", () => {
  beforeEach(() => {
    render(<App />)
  })

  it("should render the app title", () => {
    expect(screen.getByText("Salary Manager")).toBeInTheDocument()
  })

  it("should show Employees tab as active by default", () => {
    expect(screen.getByTestId("employee-table")).toBeInTheDocument()
  })

  it("should switch to Insights tab when clicked", async () => {
    const user = userEvent.setup()
    await user.click(screen.getByText("Insights"))
    expect(screen.getByTestId("salary-insights")).toBeInTheDocument()
  })

  it("should switch back to Employees tab", async () => {
    const user = userEvent.setup()
    await user.click(screen.getByText("Insights"))
    await user.click(screen.getByText("Employees"))
    expect(screen.getByTestId("employee-table")).toBeInTheDocument()
  })

  it("should render navigation buttons", () => {
    expect(screen.getByText("Employees")).toBeInTheDocument()
    expect(screen.getByText("Insights")).toBeInTheDocument()
  })
})
