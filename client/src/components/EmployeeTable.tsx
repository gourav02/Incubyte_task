import { useState, useEffect } from "react"
import type { Employee, CreateEmployeeDTO, PaginatedResponse } from "@/types/employee"
import { employeeApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmployeeForm } from "@/components/EmployeeForm"
import { Pencil, Trash2, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react"

const PAGE_LIMIT = 20

function useEmployees(page: number, search: string, countryFilter: string, refreshKey: number) {
  const [data, setData] = useState<PaginatedResponse<Employee> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    employeeApi.getAll({
      page,
      limit: PAGE_LIMIT,
      search: search || undefined,
      country: countryFilter || undefined,
    }).then((result) => {
      if (!cancelled) { setData(result); setIsLoading(false) }
    }).catch(() => {
      if (!cancelled) setIsLoading(false)
    })
    return () => { cancelled = true }
  }, [page, search, countryFilter, refreshKey])

  return { data, isLoading }
}

function useCountries() {
  const [countries, setCountries] = useState<string[]>([])
  useEffect(() => {
    let cancelled = false
    employeeApi.getCountries().then((result) => {
      if (!cancelled) setCountries(result)
    }).catch(() => {/* ignore */})
    return () => { cancelled = true }
  }, [])
  return countries
}

export function EmployeeTable() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [countryFilter, setCountryFilter] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { data, isLoading } = useEmployees(page, search, countryFilter, refreshKey)
  const countries = useCountries()

  const refresh = () => setRefreshKey((k) => k + 1)

  const handleCreate = async (formData: CreateEmployeeDTO) => {
    try {
      await employeeApi.create(formData)
      setDialogOpen(false)
      setEditingEmployee(undefined)
      refresh()
    } catch (error) {
      console.error("Failed to create employee:", error)
    }
  }

  const handleUpdate = async (formData: CreateEmployeeDTO) => {
    if (!editingEmployee) return
    try {
      await employeeApi.update(editingEmployee.id, formData)
      setDialogOpen(false)
      setEditingEmployee(undefined)
      refresh()
    } catch (error) {
      console.error("Failed to update employee:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await employeeApi.delete(id)
      setDeleteConfirm(null)
      refresh()
    } catch (error) {
      console.error("Failed to delete employee:", error)
    }
  }

  const openCreateDialog = () => {
    setEditingEmployee(undefined)
    setDialogOpen(true)
  }

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee)
    setDialogOpen(true)
  }

  const formatSalary = (salary: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(Number(salary))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Employees</h2>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Employee
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <Select
          value={countryFilter}
          onChange={(e) => { setCountryFilter(e.target.value); setPage(1) }}
          className="w-48"
        >
          <option value="">All Countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Country</TableHead>
              <TableHead className="text-right">Salary</TableHead>
              <TableHead>Hire Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.full_name}</TableCell>
                  <TableCell>{employee.job_title}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.country}</TableCell>
                  <TableCell className="text-right">{formatSalary(employee.salary)}</TableCell>
                  <TableCell>{new Date(employee.hire_date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(employee)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(employee.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * PAGE_LIMIT) + 1}–{Math.min(page * PAGE_LIMIT, data.total)} of {data.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>{editingEmployee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
        </DialogHeader>
        <EmployeeForm
          employee={editingEmployee}
          onSubmit={editingEmployee ? handleUpdate : handleCreate}
          onCancel={() => setDialogOpen(false)}
        />
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogHeader>
          <DialogTitle>Delete Employee</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete this employee? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
