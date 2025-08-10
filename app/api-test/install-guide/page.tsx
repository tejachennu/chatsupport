"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle, Terminal, Package, AlertTriangle, Copy } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function InstallGuidePage() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const commands = [
    {
      id: "uninstall",
      title: "1. Remove old MySQL package",
      command: "npm uninstall mysql @types/mysql",
      description: "Remove the old mysql package that doesn't support modern authentication",
    },
    {
      id: "install",
      title: "2. Install MySQL2",
      command: "npm install mysql2",
      description: "Install mysql2 which supports modern MySQL authentication methods",
    },
    {
      id: "types",
      title: "3. Install Types (Optional)",
      command: "npm install --save-dev @types/mysql2",
      description: "Install TypeScript types for better development experience",
    },
    {
      id: "restart",
      title: "4. Restart Development Server",
      command: "npm run dev",
      description: "Restart your Next.js development server to apply changes",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">MySQL2 Installation Guide</h1>
              <p className="text-gray-600">Fix the authentication protocol error by upgrading to mysql2</p>
            </div>
            <Link href="/api-test">
              <Button variant="outline">← Back to API Tests</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Problem Explanation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <span>The Problem</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>ER_NOT_SUPPORTED_AUTH_MODE:</strong> The old <code>mysql</code> package doesn't support modern
                  MySQL authentication methods like <code>caching_sha2_password</code> which is the default in MySQL
                  8.0+.
                </AlertDescription>
              </Alert>

              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-900 mb-2">Current Error:</h4>
                <code className="text-sm text-red-800">
                  Client does not support authentication protocol requested by server; consider upgrading MySQL client
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Solution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>The Solution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-gray-700">
                  Switch from the old <Badge variant="destructive">mysql</Badge> package to{" "}
                  <Badge variant="default">mysql2</Badge> which supports:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>✅ Modern MySQL authentication (caching_sha2_password)</li>
                  <li>✅ Better performance with prepared statements</li>
                  <li>✅ Promise-based API</li>
                  <li>✅ Full MySQL 8.0+ compatibility</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Installation Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Terminal className="w-5 h-5" />
                <span>Installation Steps</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {commands.map((cmd, index) => (
                  <div key={cmd.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{cmd.title}</h4>
                      <Badge variant="outline">Step {index + 1}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{cmd.description}</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                        {cmd.command}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(cmd.command, cmd.id)}
                        className="flex items-center space-x-1"
                      >
                        <Copy className="w-4 h-4" />
                        <span>{copied === cmd.id ? "Copied!" : "Copy"}</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* What Changed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>What Changed in the Code</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-red-700">❌ Before (mysql)</h4>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {`import mysql from "mysql"
import { promisify } from "util"

const pool = mysql.createPool(config)
const query = promisify(pool.query).bind(pool)`}
                  </pre>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-green-700">✅ After (mysql2)</h4>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {`import mysql from "mysql2/promise"

const pool = mysql.createPool(config)
// Built-in promise support!`}
                  </pre>
                </div>
              </div>

              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Key Improvements:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Native Promise support (no need for promisify)</li>
                  <li>• Modern authentication protocol support</li>
                  <li>• Better error handling and connection management</li>
                  <li>• Improved performance with prepared statements</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">1</span>
                  </div>
                  <span>Run the installation commands above</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">2</span>
                  </div>
                  <span>Restart your development server</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">3</span>
                  </div>
                  <Link href="/api-test" className="text-blue-600 hover:underline">
                    Test the database connection again
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
