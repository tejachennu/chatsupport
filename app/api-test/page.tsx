"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle,
  XCircle,
  Clock,
  Database,
  User,
  MessageCircle,
  Ticket,
  Shield,
  Play,
  Copy,
  RefreshCw,
} from "lucide-react"

interface TestResult {
  endpoint: string
  method: string
  status: "success" | "error" | "loading"
  statusCode?: number
  response?: any
  error?: string
  timestamp: string
}

export default function APITestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [authToken, setAuthToken] = useState("")
  const [testData, setTestData] = useState({
    // Auth data
    agentName: "Test Agent",
    agentEmail: "test@example.com",
    agentPassword: "password123",
    loginEmail: "test@example.com",
    loginPassword: "password123",

    // Customer data
    customerName: "John Doe",
    customerEmail: "john@example.com",

    // Ticket data
    ticketName: "Jane Smith",
    ticketEmail: "jane@example.com",
    ticketService: "PCC",
    ticketDescription: "Test ticket description for API testing",

    // Chat data
    sessionId: "",
    messageContent: "Hello, this is a test message",
    senderType: "customer",
    senderId: "1",
  })

  const addTestResult = (result: Omit<TestResult, "timestamp">) => {
    const newResult = {
      ...result,
      timestamp: new Date().toLocaleTimeString(),
    }
    setTestResults((prev) => [newResult, ...prev])
  }

  const updateTestResult = (endpoint: string, method: string, updates: Partial<TestResult>) => {
    setTestResults((prev) =>
      prev.map((result) =>
        result.endpoint === endpoint && result.method === method
          ? { ...result, ...updates, timestamp: new Date().toLocaleTimeString() }
          : result,
      ),
    )
  }

  // Update the testAPI function to handle non-JSON responses
  const testAPI = async (endpoint: string, method: string, body?: any, requiresAuth = false) => {
    addTestResult({
      endpoint,
      method,
      status: "loading",
    })

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (requiresAuth && authToken) {
        headers["Authorization"] = `Bearer ${authToken}`
      }

      const response = await fetch(endpoint, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })

      let data: any
      let responseText = ""

      try {
        // Try to parse as JSON first
        responseText = await response.text()
        data = JSON.parse(responseText)
      } catch (jsonError) {
        // If JSON parsing fails, treat as text response
        data = {
          error: "Non-JSON response received",
          responseText: responseText.substring(0, 500) + (responseText.length > 500 ? "..." : ""),
          contentType: response.headers.get("content-type") || "unknown",
        }
      }

      updateTestResult(endpoint, method, {
        status: response.ok ? "success" : "error",
        statusCode: response.status,
        response: data,
        error: response.ok ? undefined : data.error || `HTTP ${response.status}: ${response.statusText}`,
      })

      return { success: response.ok, data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Network error"
      updateTestResult(endpoint, method, {
        status: "error",
        error: errorMessage,
      })
      return { success: false, error: errorMessage }
    }
  }

  const runAllTests = async () => {
    // Clear previous results
    setTestResults([])

    // Test database connection first
    await testAPI("/api/test-db", "GET")

    // Test agent signup
    const signupResult = await testAPI("/api/auth/signup", "POST", {
      name: testData.agentName,
      email: testData.agentEmail,
      password: testData.agentPassword,
    })

    // Test agent login
    const loginResult = await testAPI("/api/auth/login", "POST", {
      email: testData.loginEmail,
      password: testData.loginPassword,
    })

    if (loginResult.success && loginResult.data.token) {
      setAuthToken(loginResult.data.token)

      // Test agent dashboard with token
      setTimeout(() => {
        testAPI("/api/agent/dashboard", "GET", undefined, true)
      }, 500)
    }

    // Test ticket creation
    await testAPI("/api/tickets", "POST", {
      name: testData.ticketName,
      email: testData.ticketEmail,
      service: testData.ticketService,
      description: testData.ticketDescription,
    })

    // Test ticket retrieval
    setTimeout(() => {
      testAPI("/api/tickets", "GET")
    }, 500)

    // Test chat start
    const chatResult = await testAPI("/api/chat/start", "POST", {
      customerName: testData.customerName,
      customerEmail: testData.customerEmail,
    })

    if (chatResult.success && chatResult.data.chatSession) {
      const sessionId = chatResult.data.chatSession.id
      setTestData((prev) => ({ ...prev, sessionId: sessionId.toString() }))

      // Test session retrieval
      setTimeout(() => {
        testAPI(`/api/chat/session/${sessionId}`, "GET")
      }, 500)

      // Test message sending
      setTimeout(() => {
        testAPI("/api/chat/messages", "POST", {
          sessionId,
          content: testData.messageContent,
          senderType: testData.senderType,
          senderId: testData.senderId,
        })
      }, 1000)

      // Test message retrieval
      setTimeout(() => {
        testAPI(`/api/chat/messages?sessionId=${sessionId}`, "GET")
      }, 1500)

      // Test chat end
      setTimeout(() => {
        testAPI(`/api/chat/end/${sessionId}`, "POST")
      }, 2000)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "loading":
        return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />
    }
  }

  const getStatusColor = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-50 border-green-200"
      case "error":
        return "bg-red-50 border-red-200"
      case "loading":
        return "bg-yellow-50 border-yellow-200"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API Testing Dashboard</h1>
          <p className="text-gray-600">Comprehensive testing interface for all API endpoints</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Test Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Authentication</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Auth Token</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={authToken}
                      onChange={(e) => setAuthToken(e.target.value)}
                      placeholder="JWT token will appear here"
                      className="font-mono text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(authToken)}
                      disabled={!authToken}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Data Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="auth" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="auth">Auth</TabsTrigger>
                    <TabsTrigger value="customer">Customer</TabsTrigger>
                    <TabsTrigger value="ticket">Ticket</TabsTrigger>
                    <TabsTrigger value="chat">Chat</TabsTrigger>
                  </TabsList>

                  <TabsContent value="auth" className="space-y-4">
                    <div>
                      <Label>Agent Name</Label>
                      <Input
                        value={testData.agentName}
                        onChange={(e) => setTestData((prev) => ({ ...prev, agentName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Agent Email</Label>
                      <Input
                        value={testData.agentEmail}
                        onChange={(e) => setTestData((prev) => ({ ...prev, agentEmail: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Password</Label>
                      <Input
                        type="password"
                        value={testData.agentPassword}
                        onChange={(e) => setTestData((prev) => ({ ...prev, agentPassword: e.target.value }))}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="customer" className="space-y-4">
                    <div>
                      <Label>Customer Name</Label>
                      <Input
                        value={testData.customerName}
                        onChange={(e) => setTestData((prev) => ({ ...prev, customerName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Customer Email</Label>
                      <Input
                        value={testData.customerEmail}
                        onChange={(e) => setTestData((prev) => ({ ...prev, customerEmail: e.target.value }))}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="ticket" className="space-y-4">
                    <div>
                      <Label>Ticket Name</Label>
                      <Input
                        value={testData.ticketName}
                        onChange={(e) => setTestData((prev) => ({ ...prev, ticketName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Ticket Email</Label>
                      <Input
                        value={testData.ticketEmail}
                        onChange={(e) => setTestData((prev) => ({ ...prev, ticketEmail: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Service</Label>
                      <Select
                        value={testData.ticketService}
                        onValueChange={(value) => setTestData((prev) => ({ ...prev, ticketService: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PCC">PCC</SelectItem>
                          <SelectItem value="OCI">OCI</SelectItem>
                          <SelectItem value="Others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={testData.ticketDescription}
                        onChange={(e) => setTestData((prev) => ({ ...prev, ticketDescription: e.target.value }))}
                        rows={3}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="chat" className="space-y-4">
                    <div>
                      <Label>Session ID</Label>
                      <Input
                        value={testData.sessionId}
                        onChange={(e) => setTestData((prev) => ({ ...prev, sessionId: e.target.value }))}
                        placeholder="Auto-filled from chat start"
                      />
                    </div>
                    <div>
                      <Label>Message Content</Label>
                      <Textarea
                        value={testData.messageContent}
                        onChange={(e) => setTestData((prev) => ({ ...prev, messageContent: e.target.value }))}
                        rows={2}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={runAllTests} className="w-full" size="lg">
                  <Play className="w-4 h-4 mr-2" />
                  Run All Tests
                </Button>
                <Button onClick={() => setTestResults([])} variant="outline" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear Results
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Individual Tests */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Database Tests</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => testAPI("/api/test-db", "GET")}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Test Database Connection
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Authentication Tests</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() =>
                    testAPI("/api/auth/signup", "POST", {
                      name: testData.agentName,
                      email: testData.agentEmail,
                      password: testData.agentPassword,
                    })
                  }
                  variant="outline"
                  className="w-full justify-start"
                >
                  <User className="w-4 h-4 mr-2" />
                  Agent Signup
                </Button>
                <Button
                  onClick={() =>
                    testAPI("/api/auth/login", "POST", {
                      email: testData.loginEmail,
                      password: testData.loginPassword,
                    })
                  }
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Agent Login
                </Button>
                <Button
                  onClick={() => testAPI("/api/agent/dashboard", "GET", undefined, true)}
                  variant="outline"
                  className="w-full justify-start"
                  disabled={!authToken}
                >
                  <User className="w-4 h-4 mr-2" />
                  Agent Dashboard
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Ticket className="w-5 h-5" />
                  <span>Ticket Tests</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() =>
                    testAPI("/api/tickets", "POST", {
                      name: testData.ticketName,
                      email: testData.ticketEmail,
                      service: testData.ticketService,
                      description: testData.ticketDescription,
                    })
                  }
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Ticket className="w-4 h-4 mr-2" />
                  Create Ticket
                </Button>
                <Button
                  onClick={() => testAPI("/api/tickets", "GET")}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Ticket className="w-4 h-4 mr-2" />
                  Get All Tickets
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Chat Tests</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() =>
                    testAPI("/api/chat/start", "POST", {
                      customerName: testData.customerName,
                      customerEmail: testData.customerEmail,
                    })
                  }
                  variant="outline"
                  className="w-full justify-start"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Start Chat
                </Button>
                <Button
                  onClick={() => testAPI(`/api/chat/session/${testData.sessionId}`, "GET")}
                  variant="outline"
                  className="w-full justify-start"
                  disabled={!testData.sessionId}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Get Session
                </Button>
                <Button
                  onClick={() =>
                    testAPI("/api/chat/messages", "POST", {
                      sessionId: testData.sessionId,
                      content: testData.messageContent,
                      senderType: testData.senderType,
                      senderId: testData.senderId,
                    })
                  }
                  variant="outline"
                  className="w-full justify-start"
                  disabled={!testData.sessionId}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                <Button
                  onClick={() => testAPI(`/api/chat/messages?sessionId=${testData.sessionId}`, "GET")}
                  variant="outline"
                  className="w-full justify-start"
                  disabled={!testData.sessionId}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Get Messages
                </Button>
                <Button
                  onClick={() => testAPI(`/api/chat/end/${testData.sessionId}`, "POST")}
                  variant="outline"
                  className="w-full justify-start"
                  disabled={!testData.sessionId}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  End Chat
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Test Results */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Test Results</span>
                  <Badge variant="secondary">{testResults.length} tests</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[800px] overflow-y-auto">
                  {testResults.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Play className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No tests run yet</p>
                      <p className="text-sm">Click "Run All Tests" or test individual endpoints</p>
                    </div>
                  ) : (
                    testResults.map((result, index) => (
                      <div key={index} className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(result.status)}
                            <Badge variant="outline" className="text-xs">
                              {result.method}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">{result.timestamp}</span>
                        </div>

                        <div className="mb-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{result.endpoint}</code>
                        </div>

                        {result.statusCode && (
                          <div className="mb-2">
                            <Badge variant={result.statusCode < 400 ? "default" : "destructive"} className="text-xs">
                              {result.statusCode}
                            </Badge>
                          </div>
                        )}

                        {result.error && <div className="text-red-600 text-xs mb-2">{result.error}</div>}

                        {result.response && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                              View Response
                            </summary>
                            <pre className="mt-2 bg-gray-100 p-2 rounded overflow-x-auto">
                              {JSON.stringify(result.response, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
