"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, User, Bot, Mail, Clock, AlertCircle, Wifi, WifiOff } from "lucide-react"
import { useParams } from "next/navigation"
import { useSocket } from "@/hooks/useSocket"
import Link from "next/link"

interface Message {
  id: number
  content: string
  sender_type: "agent" | "customer"
  sender_id: number
  sender_name: string
  timestamp: string
}

interface ChatSession {
  id: number
  agent_id: number
  customer_id: number
  agent_name: string
  customer_name: string
  customer_email: string
  status: string
  started_at: string
}

export default function AgentChatInterface() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const { socket, isConnected } = useSocket()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [chatSession, setChatSession] = useState<ChatSession | null>(null)
  const [error, setError] = useState("")
  const [agentId, setAgentId] = useState<number | null>(null)
  const [agentName, setAgentName] = useState<string>("")
  const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("agentToken")
    if (!token) {
      window.location.href = "/agent/login"
      return
    }

    // Get agent data from localStorage
    const agentData = localStorage.getItem("agentData")
    if (agentData) {
      const agent = JSON.parse(agentData)
      setAgentId(agent.id)
      setAgentName(agent.name)
    }

    if (sessionId) {
      fetchChatSession()
      fetchMessages()
    }
  }, [sessionId])

  useEffect(() => {
    if (socket && sessionId && agentId) {
      // Join the chat room
      socket.emit("join-chat", sessionId)

      // Set agent as online
      socket.emit("agent-online", agentId)

      // Listen for new messages
      socket.on("new-message", (message: Message) => {
        setMessages((prev) => [...prev, message])
      })

      // Listen for typing indicators
      socket.on("user-typing", (data) => {
        if (data.senderType === "customer") {
          setTypingUser(data.senderName)
          setIsTyping(true)
        }
      })

      socket.on("user-stop-typing", (data) => {
        if (data.senderType === "customer") {
          setIsTyping(false)
          setTypingUser(null)
        }
      })

      return () => {
        socket.off("new-message")
        socket.off("user-typing")
        socket.off("user-stop-typing")

        // Set agent as offline when leaving
        if (agentId) {
          socket.emit("agent-offline", agentId)
        }
      }
    }
  }, [socket, sessionId, agentId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchChatSession = async () => {
    try {
      const response = await fetch(`/api/chat/session/${sessionId}`)
      const data = await response.json()

      if (data.error) {
        setError(data.error)
        return
      }

      setChatSession(data.session)
    } catch (error) {
      console.error("Failed to fetch chat session:", error)
      setError("Failed to load chat session")
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/messages?sessionId=${sessionId}`)
      const data = await response.json()

      if (data.error) {
        setError(data.error)
        return
      }

      setMessages(data.messages || [])
    } catch (error) {
      console.error("Failed to fetch messages:", error)
      setError("Failed to load messages")
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatSession || !socket || !agentId) return

    setLoading(true)
    try {
      // Send message via Socket.IO
      socket.emit("send-message", {
        sessionId: sessionId,
        content: newMessage,
        senderType: "agent",
        senderId: agentId,
      })

      setNewMessage("")

      // Stop typing indicator
      socket.emit("stop-typing", {
        sessionId: sessionId,
        senderType: "agent",
      })
    } catch (error) {
      console.error("Failed to send message:", error)
      setError("Failed to send message")
    } finally {
      setLoading(false)
    }
  }

  const handleTyping = () => {
    if (!socket || !agentName) return

    socket.emit("typing", {
      sessionId: sessionId,
      senderType: "agent",
      senderName: agentName,
    })

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop-typing", {
        sessionId: sessionId,
        senderType: "agent",
      })
    }, 1000)
  }

  const endChat = async () => {
    if (confirm("Are you sure you want to end this chat session?")) {
      try {
        const response = await fetch(`/api/chat/end/${sessionId}`, {
          method: "POST",
        })

        if (response.ok) {
          // Set agent as offline
          if (socket && agentId) {
            socket.emit("agent-offline", agentId)
          }
          window.location.href = "/agent/dashboard"
        }
      } catch (error) {
        console.error("Failed to end chat:", error)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    } else {
      handleTyping()
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Chat Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/agent/dashboard">
              <Button>Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!chatSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading chat session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/agent/dashboard">
                <Button variant="outline" size="sm">
                  ← Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Chat Session #{sessionId}</h1>
                <p className="text-sm text-gray-600">Agent Chat Interface</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-700">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-700">Disconnected</span>
                  </>
                )}
              </div>
              <Button variant="destructive" onClick={endChat}>
                End Chat
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="grid lg:grid-cols-4 gap-4">
          {/* Customer Info Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="font-medium">{chatSession.customer_name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">{chatSession.customer_email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">
                    Started: {new Date(chatSession.started_at).toLocaleTimeString()}
                  </span>
                </div>
                <Badge variant="outline" className="w-full justify-center">
                  {chatSession.status === "active" ? "Active Session" : "Ended Session"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[calc(100vh-200px)] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center justify-between">
                  <span>Chat Messages</span>
                  <Badge variant="secondary">{messages.length} messages</Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No messages yet. Customer will see your responses here.</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type === "agent" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_type === "agent" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900"
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          {message.sender_type === "agent" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          <span className="text-xs opacity-75">
                            {message.sender_type === "agent" ? "You" : message.sender_name}
                          </span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-75 mt-1">{new Date(message.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))
                )}

                {/* Typing indicator */}
                {isTyping && typingUser && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span className="text-xs opacity-75">{typingUser}</span>
                      </div>
                      <div className="flex space-x-1 mt-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </CardContent>

              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your response..."
                    className="flex-1"
                    disabled={loading || !isConnected}
                  />
                  <Button onClick={sendMessage} disabled={loading || !newMessage.trim() || !isConnected}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">Press Enter to send, Shift+Enter for new line</p>
                  {!isConnected && (
                    <Badge variant="destructive" className="text-xs">
                      Connection Lost
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
