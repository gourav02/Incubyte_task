import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { EmployeeForm } from "../components/EmployeeForm"

describe("EmployeeForm", () => {
  let mockOnSubmit: ReturnType<typeof vi.fn>
  let mockOnCancel: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnSubmit = vi.fn()
    mockOnCancel = vi.fn()
  })

  it("should render all form fields", () => {
    render(<EmployeeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    expect(screen.getByLabelText("Full Name *")).toBeInTheDocument()
    expect(screen.getByLabelText("Job Title *")).toBeInTheDocument()
    expect(screen.getByLabelText("Department *")).toBeInTheDocument()
    expect(screen.getByLabelText("Country *")).toBeInTheDocument()
    expect(screen.getByLabelText("Salary (USD) *")).toBeInTheDocument()
    expect(screen.getByLabelText("Hire Date *")).toBeInTheDocument()
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
    expect(screen.getByLabelText("Full Name *")).toHaveValue("John Doe")
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

    await user.type(screen.getByLabelText("Full Name *"), "Jane Smith")
    await user.clear(screen.getByLabelText("Salary (USD) *"))
    await user.type(screen.getByLabelText("Salary (USD) *"), "75000")
    await user.click(screen.getByText("Create"))

    expect(mockOnSubmit).toHaveBeenCalledOnce()
    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: "Jane Smith",
        salary: 75000,
      })
    )
  })

  it("should show validation error when salary is zero", async () => {
    const user = userEvent.setup()
    render(<EmployeeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    await user.type(screen.getByLabelText("Full Name *"), "Jane Smith")
    await user.click(screen.getByText("Create"))

    expect(screen.getByText("Salary must be greater than 0")).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it("should show validation error when salary is negative", async () => {
    const user = userEvent.setup()
    render(<EmployeeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    await user.type(screen.getByLabelText("Full Name *"), "Jane Smith")
    fireEvent.change(screen.getByLabelText("Salary (USD) *"), { target: { value: "-5000" } })
    await user.click(screen.getByText("Create"))

    expect(screen.getByText("Salary must be greater than 0")).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it("should mark all text inputs as required with asterisk labels", () => {
    render(<EmployeeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    expect(screen.getByText("Full Name *")).toBeInTheDocument()
    expect(screen.getByText("Job Title *")).toBeInTheDocument()
    expect(screen.getByText("Department *")).toBeInTheDocument()
    expect(screen.getByText("Country *")).toBeInTheDocument()
    expect(screen.getByText("Salary (USD) *")).toBeInTheDocument()
    expect(screen.getByText("Hire Date *")).toBeInTheDocument()
  })

  it("should submit all mandatory fields in the payload", async () => {
    const user = userEvent.setup()
    render(<EmployeeForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    await user.type(screen.getByLabelText("Full Name *"), "Alice Bob")
    await user.clear(screen.getByLabelText("Salary (USD) *"))
    await user.type(screen.getByLabelText("Salary (USD) *"), "90000")
    await user.click(screen.getByText("Create"))

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: "Alice Bob",
        job_title: expect.any(String),
        country: expect.any(String),
        salary: 90000,
        department: expect.any(String),
        hire_date: expect.any(String),
      })
    )
  })
})
