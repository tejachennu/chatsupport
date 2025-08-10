"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"
import Link from "next/link"

interface EnvStatus {
  database: Record<string, string>
  optional: Record<string, string>
  rawValues: Record<string, string>
}

export default function EnvCheckPage() {
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null)
  const [loading, setLoading] = useState(false)

  const checkEnvironment = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-env")
      const data = await response.json()
      setEnvStatus(data.environment)
    } catch (error) {
      console.error("Failed to check environment:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkEnvironment()
  }, [])

  const getStatusIcon = (status: string) => {
    if (status.includes("✓")) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    } else {
      return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusColor = (status: string) => {
    if (status.includes("✓")) {
      return "border-green-200 bg-green-50"
    } else {
      return "border-red-200 bg-red-50"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Environment Variables Check</h1>
              <p className="text-gray-600">Verify your database configuration</p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={checkEnvironment} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Link href="/api-test">
                <Button variant="outline">← Back to API Tests</Button>
              </Link>
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Checking environment variables...</p>
          </div>
        )}

        {envStatus && (
          <div className="grid gap-6">
            {/* Database Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <span>Database Configuration (Required)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(envStatus.database).map(([key, status]) => (
                    <div key={key} className={`border rounded-lg p-3 ${getStatusColor(status)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(status)}
                          <code className="font-mono text-sm">{key}</code>
                        </div>
                        <Badge variant={status.includes("✓") ? "default" : "destructive"}>{status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Current Values */}
            <Card>
              <CardHeader>
                <CardTitle>Current Values</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(envStatus.rawValues).map(([key, value]) => (
                    <div key={key} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <code className="font-mono text-sm font-semibold">{key}</code>
                        <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {value === "Not set" ? (
                            <span className="text-red-600">{value}</span>
                          ) : (
                            <span className="text-green-600">{value}</span>
                          )}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Setup Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Setup Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Create a <code>.env.local</code> file in your project root with these variables:
                  </AlertDescription>
                </Alert>

                <div className="mt-4 bg-gray-900 text-green-400 p-4 rounded font-mono text-sm">
                  <div>DB_HOST=194.163.45.105</div>
                  <div>DB_PORT=3306</div>
                  <div>DB_USER=marketingOwner</div>
                  <div>DB_PASSWORD=M@rketing123!</div>
                  <div>DB_NAME=MarketingDb</div>
                  <div className="mt-2 text-gray-500"># Optional</div>
                  <div>JWT_SECRET=your-secret-key</div>
                  <div>SMTP_HOST=smtp.gmail.com</div>
                  <div>SMTP_USER=your-email@gmail.com</div>
                  <div>SMTP_PASS=your-app-password</div>
                  <div>SMTP_FROM=your-email@gmail.com</div>
                </div>

                <div className="mt-4 space-y-2">
                  <h4 className="font-semibold">Important Notes:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Restart your development server after creating/updating .env.local</li>
                    <li>• Never commit .env.local to version control</li>
                    <li>• Environment variables are only loaded on server startup</li>
                    <li>• Check that there are no spaces around the = sign</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Optional Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Optional Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(envStatus.optional).map(([key, status]) => (
                    <div key={key} className={`border rounded-lg p-3 ${getStatusColor(status)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(status)}
                          <code className="font-mono text-sm">{key}</code>
                        </div>
                        <Badge variant={status.includes("✓") ? "default" : "secondary"}>{status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
