import { useState } from "react"
import { EmployeeTable } from "@/components/EmployeeTable"
import { SalaryInsights } from "@/components/SalaryInsights"
import { Button } from "@/components/ui/button"
import { Users, BarChart3 } from "lucide-react"

type Tab = "employees" | "insights"

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("employees")

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <DollarIcon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Salary Manager</h1>
          </div>
          <nav className="flex gap-2">
            <Button
              variant={activeTab === "employees" ? "default" : "ghost"}
              onClick={() => setActiveTab("employees")}
            >
              <Users className="mr-2 h-4 w-4" /> Employees
            </Button>
            <Button
              variant={activeTab === "insights" ? "default" : "ghost"}
              onClick={() => setActiveTab("insights")}
            >
              <BarChart3 className="mr-2 h-4 w-4" /> Insights
            </Button>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        {activeTab === "employees" ? <EmployeeTable /> : <SalaryInsights />}
      </main>
    </div>
  )
}

function DollarIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

export default App
