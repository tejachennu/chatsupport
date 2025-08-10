"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, Database, Server, Copy, Terminal } from "lucide-react"
import Link from "next/link"

export default function MySQLTroubleshootPage() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const sqlCommands = [
    {
      id: "check-user",
      title: "Check Current Authentication Method",
      command: "SELECT user, host, plugin FROM mysql.user WHERE user = 'marketingOwner';",
      description: "Check what authentication plugin your user is currently using",
    },
    {
      id: "change-auth",
      title: "Change to Legacy Authentication",
      command: "ALTER USER 'marketingOwner'@'%' IDENTIFIED WITH mysql_native_password BY 'M@rketing123!';",
      description: "Change the user to use legacy authentication that works with the mysql package",
    },
    {
      id: "flush-privileges",
      title: "Apply Changes",
      command: "FLUSH PRIVILEGES;",
      description: "Apply the authentication changes",
    },
    {
      id: "verify-change",
      title: "Verify the Change",
      command: "SELECT user, host, plugin FROM mysql.user WHERE user = 'marketingOwner';",
      description: "Confirm the authentication method has been changed",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">MySQL Package Troubleshooting</h1>
              <p className="text-gray-600">Fix authentication issues while keeping the mysql package</p>
            </div>
            <Link href="/api-test">
              <Button variant="outline">← Back to API Tests</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Current Fix Applied */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Code Changes Applied</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    I've updated the database configuration to work better with the <code>mysql</code> package by adding
                    legacy authentication support.
                  </AlertDescription>
                </Alert>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Configuration Changes:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>
                      ✅ Added <code>insecureAuth: true</code> to allow legacy authentication
                    </li>
                    <li>✅ Disabled SSL to avoid connection issues</li>
                    <li>✅ Added proper connection flags</li>
                    <li>✅ Improved error handling and connection testing</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Current Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Server className="w-5 h-5" />
                <span>Test Current Setup</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">First, let's test if the current configuration fixes the issue:</p>
                <Link href="/api-test">
                  <Button className="w-full">
                    <Database className="w-4 h-4 mr-2" />
                    Test Database Connection Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* If Still Not Working */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <span>If Connection Still Fails</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  If you're still getting the authentication error, the MySQL server needs to be configured to use
                  legacy authentication for your user account.
                </AlertDescription>
              </Alert>

              <div className="mt-4">
                <h4 className="font-semibold mb-3">Server-Side Fix (Run these SQL commands on your MySQL server):</h4>
                <div className="space-y-4">
                  {sqlCommands.map((cmd, index) => (
                    <div key={cmd.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{cmd.title}</h5>
                        <Badge variant="outline">Step {index + 1}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{cmd.description}</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-900 text-green-400 p-3 rounded font-mono text-sm overflow-x-auto">
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
              </div>
            </CardContent>
          </Card>

          {/* How to Run SQL Commands */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Terminal className="w-5 h-5" />
                <span>How to Run These Commands</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Option 1: MySQL Command Line</h4>
                    <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                      mysql -h 194.163.45.105 -u root -p
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Connect as root user and run the SQL commands</p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Option 2: phpMyAdmin/GUI Tool</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Open your MySQL management tool</li>
                      <li>• Go to SQL tab</li>
                      <li>• Paste and execute each command</li>
                    </ul>
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Note:</strong> You need administrative access to the MySQL server to run these commands.
                    Contact your database administrator if you don't have root access.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* Alternative Solutions */}
          <Card>
            <CardHeader>
              <CardTitle>Alternative Solutions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Database className="w-4 h-4 mr-2" />
                    Option 1: Server Configuration
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">Change the MySQL server's default authentication method:</p>
                  <div className="bg-gray-900 text-green-400 p-2 rounded font-mono text-xs">
                    default_authentication_plugin=mysql_native_password
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Add this to your MySQL configuration file (my.cnf)</p>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Server className="w-4 h-4 mr-2" />
                    Option 2: Create New User
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">Create a new user with legacy authentication:</p>
                  <div className="bg-gray-900 text-green-400 p-2 rounded font-mono text-xs">
                    CREATE USER 'newuser'@'%' IDENTIFIED WITH mysql_native_password BY 'password';
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What Each Setting Does */}
          <Card>
            <CardHeader>
              <CardTitle>Understanding the Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Connection Settings</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <code>insecureAuth: true</code>
                      <Badge variant="outline">Allows legacy auth</Badge>
                    </div>
                    <div className="flex justify-between">
                      <code>ssl: false</code>
                      <Badge variant="outline">Disables SSL</Badge>
                    </div>
                    <div className="flex justify-between">
                      <code>reconnect: true</code>
                      <Badge variant="outline">Auto-reconnect</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Authentication Methods</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <code>mysql_native_password</code>
                      <Badge variant="default">Legacy (Works)</Badge>
                    </div>
                    <div className="flex justify-between">
                      <code>caching_sha2_password</code>
                      <Badge variant="destructive">Modern (Fails)</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
