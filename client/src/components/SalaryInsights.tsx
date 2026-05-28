import { useState, useEffect, useRef, useMemo } from "react"
import type { SalaryInsightByCountry, SalaryInsightByJobTitle, SalarySummary } from "@/types/employee"
import { insightsApi, employeeApi } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, DollarSign, Globe, Briefcase, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from "lucide-react"

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100]

function usePagination<T>(items: T[], initialPageSize = 5) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))

  // Reset to page 1 when the data length changes (filter applied, new data loaded)
  const prevLengthRef = useRef(items.length)
  useEffect(() => {
    if (items.length !== prevLengthRef.current) {
      setPage(1)
      prevLengthRef.current = items.length
    }
  }, [items.length])

  // Clamp page if it exceeds totalPages (e.g. after page size increase)
  const safePage = Math.min(page, totalPages)

  const paginatedItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  )

  const handleSetPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)))
  const handleSetPageSize = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  return {
    page: safePage,
    pageSize,
    totalPages,
    total: items.length,
    items: paginatedItems,
    setPage: handleSetPage,
    setPageSize: handleSetPageSize,
    start: items.length === 0 ? 0 : (safePage - 1) * pageSize + 1,
    end: Math.min(safePage * pageSize, items.length),
  }
}

function useSummary() {
  const [summary, setSummary] = useState<SalarySummary | null>(null)
  useEffect(() => {
    let cancelled = false
    insightsApi.getSummary().then((r) => { if (!cancelled) setSummary(r) }).catch(() => {})
    return () => { cancelled = true }
  }, [])
  return summary
}

function useCountryInsights(country: string) {
  const [data, setData] = useState<SalaryInsightByCountry[]>([])
  useEffect(() => {
    let cancelled = false
    insightsApi.getByCountry(country || undefined).then((r) => { if (!cancelled) setData(r) }).catch(() => {})
    return () => { cancelled = true }
  }, [country])
  return data
}

function useJobTitleInsights(country: string) {
  const [data, setData] = useState<SalaryInsightByJobTitle[]>([])
  useEffect(() => {
    let cancelled = false
    insightsApi.getByJobTitle(country || undefined).then((r) => { if (!cancelled) setData(r) }).catch(() => {})
    return () => { cancelled = true }
  }, [country])
  return data
}

function useCountries() {
  const [countries, setCountries] = useState<string[]>([])
  useEffect(() => {
    let cancelled = false
    employeeApi.getCountries().then((r) => { if (!cancelled) setCountries(r) }).catch(() => {})
    return () => { cancelled = true }
  }, [])
  return countries
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(val)

export function SalaryInsights() {
  const [countryFilter, setCountryFilter] = useState("")
  const summary = useSummary()
  const countryInsightsAll = useCountryInsights(countryFilter)
  const jobTitleInsightsAll = useJobTitleInsights(countryFilter)
  const countries = useCountries()

  const countryPag = usePagination(countryInsightsAll)
  const jobTitlePag = usePagination(jobTitleInsightsAll)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Salary Insights</h2>
        <Select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="w-56"
        >
          <option value="">All Countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_employees.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.overall_avg_salary)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Countries</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_countries}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Job Titles</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_job_titles}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Salary by Country</CardTitle>
            <CardDescription>Min, max, and average salary per country</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <TrendingDown className="h-3 w-3" /> Min
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <TrendingUp className="h-3 w-3" /> Max
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Avg</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countryPag.items.map((row) => (
                  <TableRow key={row.country}>
                    <TableCell className="font-medium">{row.country}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.min_salary)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.max_salary)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(row.avg_salary)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{row.employee_count}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {countryPag.total > 0 && (
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Showing {countryPag.start}–{countryPag.end} of {countryPag.total}
                  </p>
                  <Select
                    value={countryPag.pageSize}
                    onChange={(e) => countryPag.setPageSize(Number(e.target.value))}
                    className="w-20 h-8 text-xs"
                  >
                    {PAGE_SIZE_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={countryPag.page <= 1} onClick={() => countryPag.setPage(countryPag.page - 1)}>
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <Button variant="outline" size="sm" disabled={countryPag.page >= countryPag.totalPages} onClick={() => countryPag.setPage(countryPag.page + 1)}>
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Salary by Job Title</CardTitle>
            <CardDescription>Average salary for each job title{countryFilter ? ` in ${countryFilter}` : ""}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {!countryFilter && <TableHead>Country</TableHead>}
                  <TableHead>Job Title</TableHead>
                  <TableHead className="text-right">Avg Salary</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobTitlePag.items.map((row) => (
                  <TableRow key={`${row.country}-${row.job_title}`}>
                    {!countryFilter && <TableCell>{row.country}</TableCell>}
                    <TableCell className="font-medium">{row.job_title}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(row.avg_salary)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{row.employee_count}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {jobTitlePag.total > 0 && (
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Showing {jobTitlePag.start}–{jobTitlePag.end} of {jobTitlePag.total}
                  </p>
                  <Select
                    value={jobTitlePag.pageSize}
                    onChange={(e) => jobTitlePag.setPageSize(Number(e.target.value))}
                    className="w-20 h-8 text-xs"
                  >
                    {PAGE_SIZE_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={jobTitlePag.page <= 1} onClick={() => jobTitlePag.setPage(jobTitlePag.page - 1)}>
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <Button variant="outline" size="sm" disabled={jobTitlePag.page >= jobTitlePag.totalPages} onClick={() => jobTitlePag.setPage(jobTitlePag.page + 1)}>
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
