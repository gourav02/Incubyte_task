import { describe, it, expect, vi, beforeEach } from "vitest"
import { employeeApi, insightsApi } from "../lib/api"

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

describe("employeeApi", () => {
  describe("getAll", () => {
    it("should fetch employees with default params", async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await employeeApi.getAll()

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/employees?",
        expect.objectContaining({
          headers: { "Content-Type": "application/json" },
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it("should include search params when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [] }),
      })

      await employeeApi.getAll({ page: 2, search: "John", country: "USA" })

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain("page=2")
      expect(calledUrl).toContain("search=John")
      expect(calledUrl).toContain("country=USA")
    })
  })

  describe("create", () => {
    it("should send POST request with employee data", async () => {
      const newEmployee = {
        full_name: "John Doe",
        job_title: "Engineer",
        country: "USA",
        salary: 80000,
        department: "Engineering",
        hire_date: "2023-01-01",
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: "1", ...newEmployee }),
      })

      const result = await employeeApi.create(newEmployee)

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/employees",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(newEmployee),
        })
      )
      expect(result.full_name).toBe("John Doe")
    })
  })

  describe("delete", () => {
    it("should send DELETE request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: () => Promise.reject(),
      })

      await employeeApi.delete("123")

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/employees/123",
        expect.objectContaining({ method: "DELETE" })
      )
    })
  })

  describe("error handling", () => {
    it("should throw error when response is not ok", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "Bad request" }),
      })

      await expect(employeeApi.getAll()).rejects.toThrow("Bad request")
    })
  })
})

describe("insightsApi", () => {
  describe("getSummary", () => {
    it("should fetch salary summary", async () => {
      const mockSummary = {
        total_employees: 100,
        overall_avg_salary: 75000,
        overall_min_salary: 30000,
        overall_max_salary: 150000,
        total_countries: 5,
        total_job_titles: 10,
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSummary),
      })

      const result = await insightsApi.getSummary()

      expect(result).toEqual(mockSummary)
    })
  })

  describe("getByCountry", () => {
    it("should fetch insights without country filter", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      })

      await insightsApi.getByCountry()

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toBe("/api/insights/by-country")
    })

    it("should include country filter when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      })

      await insightsApi.getByCountry("USA")

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toBe("/api/insights/by-country?country=USA")
    })
  })
})
