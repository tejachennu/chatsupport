"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, Database, Server, Wifi } from "lucide-react"
import Link from "next/link"

interface DiagnosticResult {
  test: string
  status: "success" | "error" | "warning" | "loading"
  message: string
  details?: any
}

export default function TroubleshootPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addDiagnostic = (result: DiagnosticResult) => {
    setDiagnostics((prev) => [...prev, result])
  }

  const updateDiagnostic = (test: string, updates: Partial<DiagnosticResult>) => {
    setDiagnostics((prev) => prev.map((d) => (d.test === test ? { ...d, ...updates } : d)))
  }

  const runDiagnostics = async () => {
    setIsRunning(true)
    setDiagnostics([])

    // Test 1: Basic connectivity
    addDiagnostic({
      test: "Basic Connectivity",
      status: "loading",
      message: "Testing basic server connectivity...",
    })

    try {
      const response = await fetch("/api/test-db")
      const isJson = response.headers.get("content-type")?.includes("application/json")

      if (isJson) {
        const data = await response.json()
        updateDiagnostic("Basic Connectivity", {
          status: response.ok ? "success" : "error",
          message: response.ok ? "Server is responding correctly" : `Server error: ${data.error}`,
          details: data,
        })
      } else {
        const text = await response.text()
        updateDiagnostic("Basic Connectivity", {
          status: "error",
          message: "Server returned non-JSON response (likely an error page)",
          details: { responseText: text.substring(0, 500), contentType: response.headers.get("content-type") },
        })
      }
    } catch (error) {
      updateDiagnostic("Basic Connectivity", {
        status: "error",
        message: `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: { error: error instanceof Error ? error.stack : error },
      })
    }

    // Test 2: Environment Variables
    addDiagnostic({
      test: "Environment Variables",
      status: "loading",
      message: "Checking database configuration...",
    })

    try {
      const envTest = await fetch("/api/test-env")
      if (envTest.ok) {
        const envData = await envTest.json()
        updateDiagnostic("Environment Variables", {
          status: "success",
          message: "Environment variables are configured",
          details: envData,
        })
      } else {
        updateDiagnostic("Environment Variables", {
          status: "warning",
          message: "Could not verify environment variables",
        })
      }
    } catch (error) {
      updateDiagnostic("Environment Variables", {
        status: "warning",
        message: "Environment check endpoint not available",
      })
    }

    // Test 3: Database Tables
    addDiagnostic({
      test: "Database Tables",
      status: "loading",
      message: "Checking database table structure...",
    })

    try {
      const tablesResponse = await fetch("/api/test-tables")
      if (tablesResponse.ok) {
        const tablesData = await tablesResponse.json()
        updateDiagnostic("Database Tables", {
          status: "success",
          message: "Database tables are accessible",
          details: tablesData,
        })
      } else {
        updateDiagnostic("Database Tables", {
          status: "error",
          message: "Could not access database tables",
        })
      }
    } catch (error) {
      updateDiagnostic("Database Tables", {
        status: "error",
        message: "Database table check failed",
      })
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case "loading":
        return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    }
  }

  const getStatusColor = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return "border-green-200 bg-green-50"
      case "error":
        return "border-red-200 bg-red-50"
      case "warning":
        return "border-yellow-200 bg-yellow-50"
      case "loading":
        return "border-blue-200 bg-blue-50"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Troubleshooting</h1>
              <p className="text-gray-600">Diagnose and fix database connection issues</p>
            </div>
            <Link href="/api-test">
              <Button variant="outline">← Back to API Tests</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Diagnostic Tools</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Button onClick={runDiagnostics} disabled={isRunning} className="flex items-center space-x-2">
                  <Server className="w-4 h-4" />
                  <span>{isRunning ? "Running Diagnostics..." : "Run Full Diagnostics"}</span>
                </Button>
                <Button variant="outline" onClick={() => setDiagnostics([])}>
                  Clear Results
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Common Issues */}
          <Card>
            <CardHeader>
              <CardTitle>Common Database Issues & Solutions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Non-JSON Response:</strong> This usually indicates a server error or missing environment
                  variables. Check that all database credentials are correctly set in your environment.
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Wifi className="w-4 h-4 mr-2" />
                    Connection Issues
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Check database host and port</li>
                    <li>• Verify network connectivity</li>
                    <li>• Confirm firewall settings</li>
                    <li>• Test database credentials</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Database className="w-4 h-4 mr-2" />
                    Table Issues
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Run database initialization</li>
                    <li>• Check table permissions</li>
                    <li>• Verify schema structure</li>
                    <li>• Review SQL syntax</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle>Required Environment Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Database Configuration</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <code>DB_HOST</code>
                      <Badge variant="outline">194.163.45.105</Badge>
                    </div>
                    <div className="flex justify-between">
                      <code>DB_PORT</code>
                      <Badge variant="outline">3306</Badge>
                    </div>
                    <div className="flex justify-between">
                      <code>DB_USER</code>
                      <Badge variant="outline">marketingOwner</Badge>
                    </div>
                    <div className="flex justify-between">
                      <code>DB_PASSWORD</code>
                      <Badge variant="outline">M@rketing123!</Badge>
                    </div>
                    <div className="flex justify-between">
                      <code>DB_NAME</code>
                      <Badge variant="outline">MarketingDb</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Optional Configuration</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <code>JWT_SECRET</code>
                      <Badge variant="secondary">Optional</Badge>
                    </div>
                    <div className="flex justify-between">
                      <code>SMTP_HOST</code>
                      <Badge variant="secondary">Optional</Badge>
                    </div>
                    <div className="flex justify-between">
                      <code>SMTP_USER</code>
                      <Badge variant="secondary">Optional</Badge>
                    </div>
                    <div className="flex justify-between">
                      <code>SMTP_PASS</code>
                      <Badge variant="secondary">Optional</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Diagnostic Results */}
          {diagnostics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Diagnostic Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {diagnostics.map((diagnostic, index) => (
                    <div key={index} className={`border rounded-lg p-4 ${getStatusColor(diagnostic.status)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(diagnostic.status)}
                          <h4 className="font-semibold">{diagnostic.test}</h4>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {diagnostic.status}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-700 mb-2">{diagnostic.message}</p>

                      {diagnostic.details && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">View Details</summary>
                          <pre className="mt-2 bg-gray-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(diagnostic.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
