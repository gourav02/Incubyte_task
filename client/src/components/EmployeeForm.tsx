import { useState } from "react"
import type { CreateEmployeeDTO, Employee } from "@/types/employee"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

const COUNTRIES = [
  "USA", "India", "United Kingdom", "Germany", "Canada",
  "Australia", "France", "Japan", "Brazil", "Netherlands",
]

const JOB_TITLES = [
  "Software Engineer", "Senior Software Engineer", "Product Manager",
  "Data Analyst", "UX Designer", "DevOps Engineer", "QA Engineer",
  "Engineering Manager", "Business Analyst", "Full Stack Developer",
]

const DEPARTMENTS = [
  "Engineering", "Product", "Design", "Data", "Operations",
  "Marketing", "Sales", "Human Resources", "Finance", "Legal",
]

interface EmployeeFormProps {
  employee?: Employee
  onSubmit: (data: CreateEmployeeDTO) => void
  onCancel: () => void
  isLoading?: boolean
}

export function EmployeeForm({ employee, onSubmit, onCancel, isLoading }: EmployeeFormProps) {
  const [formData, setFormData] = useState<CreateEmployeeDTO>({
    full_name: employee?.full_name || "",
    job_title: employee?.job_title || JOB_TITLES[0],
    country: employee?.country || COUNTRIES[0],
    salary: employee ? Number(employee.salary) : 0,
    department: employee?.department || DEPARTMENTS[0],
    hire_date: employee?.hire_date?.split("T")[0] || new Date().toISOString().split("T")[0],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.full_name.trim()) newErrors.full_name = "Full name is required"
    if (!formData.job_title) newErrors.job_title = "Job title is required"
    if (!formData.country) newErrors.country = "Country is required"
    if (!formData.department) newErrors.department = "Department is required"
    if (formData.salary === undefined || formData.salary === null || isNaN(formData.salary) || formData.salary <= 0) newErrors.salary = "Salary must be greater than 0"
    if (!formData.hire_date) newErrors.hire_date = "Hire date is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name *</Label>
        <Input
          id="full_name"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          placeholder="Enter full name"
        />
        {errors.full_name && <p className="text-sm text-destructive">{errors.full_name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="job_title">Job Title *</Label>
          <Select
            id="job_title"
            value={formData.job_title}
            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
          >
            {JOB_TITLES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Department *</Label>
          <Select
            id="department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country *</Label>
          <Select
            id="country"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="salary">Salary (USD) *</Label>
          <Input
            id="salary"
            type="number"
            value={formData.salary}
            onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
          />
          {errors.salary && <p className="text-sm text-destructive">{errors.salary}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hire_date">Hire Date *</Label>
        <Input
          id="hire_date"
          type="date"
          value={formData.hire_date}
          onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
        />
        {errors.hire_date && <p className="text-sm text-destructive">{errors.hire_date}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : employee ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  )
}
