import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { EmployeeForm } from "../components/EmployeeForm"

describe("EmployeeForm", () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  it("should render all form fields", () => {
    render(<EmployeeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    expect(screen.getByLabelText("Full Name")).toBeInTheDocument()
    expect(screen.getByLabelText("Job Title")).toBeInTheDocument()
    expect(screen.getByLabelText("Department")).toBeInTheDocument()
    expect(screen.getByLabelText("Country")).toBeInTheDocument()
    expect(screen.getByLabelText("Salary (USD)")).toBeInTheDocument()
    expect(screen.getByLabelText("Hire Date")).toBeInTheDocument()
  })

  it("should show 'Create' button when no employee provided", () => {
    render(<EmployeeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    expect(screen.getByText("Create")).toBeInTheDocument()
  })

  it("should show 'Update' button when editing an employee", () => {
    const employee = {
      id: "123",
      full_name: "John Doe",
      job_title: "Software Engineer",
      country: "USA",
      salary: 85000,
      department: "Engineering",
      hire_date: "2023-01-15",
      created_at: "2023-01-15",
      updated_at: "2023-01-15",
    }
    render(
      <EmployeeForm employee={employee} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    )
    expect(screen.getByText("Update")).toBeInTheDocument()
  })

  it("should pre-fill form when editing an employee", () => {
    const employee = {
      id: "123",
      full_name: "John Doe",
      job_title: "Software Engineer",
      country: "USA",
      salary: 85000,
      department: "Engineering",
      hire_date: "2023-01-15",
      created_at: "2023-01-15",
      updated_at: "2023-01-15",
    }
    render(
      <EmployeeForm employee={employee} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    )
    expect(screen.getByLabelText("Full Name")).toHaveValue("John Doe")
  })

  it("should show validation error when name is empty", async () => {
    const user = userEvent.setup()
    render(<EmployeeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    await user.click(screen.getByText("Create"))

    expect(screen.getByText("Full name is required")).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it("should call onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup()
    render(<EmployeeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    await user.click(screen.getByText("Cancel"))

    expect(mockOnCancel).toHaveBeenCalledOnce()
  })

  it("should call onSubmit with form data when valid", async () => {
    const user = userEvent.setup()
    render(<EmployeeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    await user.type(screen.getByLabelText("Full Name"), "Jane Smith")
    await user.click(screen.getByText("Create"))

    expect(mockOnSubmit).toHaveBeenCalledOnce()
    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: "Jane Smith",
      })
    )
  })
})
