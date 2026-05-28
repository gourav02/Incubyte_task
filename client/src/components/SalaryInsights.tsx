import { useState, useEffect } from "react"
import type { SalaryInsightByCountry, SalaryInsightByJobTitle, SalarySummary } from "@/types/employee"
import { insightsApi, employeeApi } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, DollarSign, Globe, Briefcase, TrendingUp, TrendingDown } from "lucide-react"

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
  const countryInsights = useCountryInsights(countryFilter)
  const jobTitleInsights = useJobTitleInsights(countryFilter)
  const countries = useCountries()

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
                {countryInsights.map((row) => (
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
                {jobTitleInsights.map((row) => (
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
