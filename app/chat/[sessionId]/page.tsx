"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, User, Bot, AlertCircle, Wifi, WifiOff } from "lucide-react"
import { useParams } from "next/navigation"
import { useSocket } from "@/hooks/useSocket"

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

export default function ChatInterface() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const { socket, isConnected } = useSocket()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [chatSession, setChatSession] = useState<ChatSession | null>(null)
  const [error, setError] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (sessionId) {
      fetchChatSession()
      fetchMessages()
    }
  }, [sessionId])

  useEffect(() => {
    if (socket && sessionId) {
      // Join the chat room
      socket.emit("join-chat", sessionId)

      // Listen for new messages
      socket.on("new-message", (message: Message) => {
        setMessages((prev) => [...prev, message])
      })

      // Listen for typing indicators
      socket.on("user-typing", (data) => {
        if (data.senderType === "agent") {
          setTypingUser(data.senderName)
          setIsTyping(true)
        }
      })

      socket.on("user-stop-typing", (data) => {
        if (data.senderType === "agent") {
          setIsTyping(false)
          setTypingUser(null)
        }
      })

      return () => {
        socket.off("new-message")
        socket.off("user-typing")
        socket.off("user-stop-typing")
      }
    }
  }, [socket, sessionId])

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
    if (!newMessage.trim() || !chatSession || !socket) return

    setLoading(true)
    try {
      // Send message via Socket.IO
      socket.emit("send-message", {
        sessionId: sessionId,
        content: newMessage,
        senderType: "customer",
        senderId: chatSession.customer_id,
        senderName: chatSession.customer_name, // ✅ Add this line
      })

      setNewMessage("")

      // Stop typing indicator
      socket.emit("stop-typing", {
        sessionId: sessionId,
        senderType: "customer",
      })
    } catch (error) {
      console.error("Failed to send message:", error)
      setError("Failed to send message")
    } finally {
      setLoading(false)
    }
  }

  const handleTyping = () => {
    if (!socket || !chatSession) return

    socket.emit("typing", {
      sessionId: sessionId,
      senderType: "customer",
      senderName: chatSession.customer_name,
    })

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop-typing", {
        sessionId: sessionId,
        senderType: "customer",
      })
    }, 1000)
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
            <Button onClick={() => (window.location.href = "/")}>Return to Home</Button>
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
            <div>
              <h1 className="text-xl font-bold text-gray-900">Chat Session #{sessionId}</h1>
              <p className="text-sm text-gray-600">Connected with {chatSession.agent_name}</p>
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
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-700">Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 max-w-4xl">
        <Card className="h-[calc(100vh-200px)] flex flex-col">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Start the conversation by sending a message</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_type === "customer" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_type === "customer" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900"
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {message.sender_type === "customer" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      <span className="text-xs opacity-75">
                        {message.sender_type === "customer" ? "You" : message.sender_name}
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
                    <Bot className="w-4 h-4" />
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
                placeholder="Type your message..."
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
      </main>
    </div>
  )
}
