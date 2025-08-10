"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, LogOut, User } from "lucide-react"
import Link from "next/link"

interface ChatSession {
  id: number
  started_at: string
  customer_name: string
  customer_email: string
  last_message: string
}

interface Agent {
  id: number
  name: string
  email: string
  current_chat_count: number
}

export default function AgentDashboard() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [activeSessions, setActiveSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("agentToken")
    if (!token) {
      window.location.href = "/agent/login"
      return
    }

    fetchDashboardData(token)
  }, [])

  const fetchDashboardData = async (token: string) => {
    try {
      const response = await fetch("/api/agent/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.error) {
        localStorage.removeItem("agentToken")
        localStorage.removeItem("agentData")
        window.location.href = "/agent/login"
        return
      }

      setAgent(data.agent)
      setActiveSessions(data.activeSessions)
    } catch (error) {
      console.error("Dashboard fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("agentToken")
    localStorage.removeItem("agentData")
    window.location.href = "/agent/login"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
            <Badge variant="secondary">{agent?.current_chat_count || 0}/4 Active Chats</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">{agent?.name}</span>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Active Chat Sessions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeSessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No active chat sessions</p>
                  <p className="text-sm">New chats will appear here automatically</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{session.customer_name}</h3>
                          <p className="text-sm text-gray-600">{session.customer_email}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">Active</Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            Started: {new Date(session.started_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      {session.last_message && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-700 bg-gray-100 rounded p-2">Last: {session.last_message}</p>
                        </div>
                      )}
                      <Link href={`/agent/chat/${session.id}`}>
                        <Button size="sm" className="w-full">
                          Open Chat
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Today's Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{activeSessions.length}</div>
                <p className="text-sm text-gray-600">Active Chats</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700">Online</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{4 - (agent?.current_chat_count || 0)}</div>
                <p className="text-sm text-gray-600">Available Slots</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
