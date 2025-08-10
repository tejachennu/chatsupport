"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageCircle, X, Send, Ticket, CheckCircle, Minimize2, Maximize2, User, Bot } from "lucide-react"
import { useSocket } from "@/hooks/useSocket"

interface ChatbotPopupProps {
  isOpen: boolean
  onClose: () => void
}

type ViewState = "menu" | "chat-form" | "ticket-form" | "chat-active" | "ticket-success"

interface Message {
  id: number
  content: string
  sender_type: "agent" | "customer"
  sender_name: string
  timestamp: string
}

export function ChatbotPopup({ isOpen, onClose }: ChatbotPopupProps) {
  const [currentView, setCurrentView] = useState<ViewState>("menu")
  const [isMinimized, setIsMinimized] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const { socket, isConnected } = useSocket()

  // Chat state
  const [chatSessionId, setChatSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [customerName, setCustomerName] = useState("")

  // Chat form state
  const [chatForm, setChatForm] = useState({
    name: "",
    email: "",
  })

  // Ticket form state
  const [ticketForm, setTicketForm] = useState({
    name: "",
    email: "",
    service: "",
    description: "",
  })

  // Reset state when popup closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setCurrentView("menu")
        setIsMinimized(false)
        setMessage("")
        setChatForm({ name: "", email: "" })
        setTicketForm({ name: "", email: "", service: "", description: "" })
        setChatSessionId(null)
        setMessages([])
        setCustomerId(null)
        setCustomerName("")
      }, 300)
    }
  }, [isOpen])

  // Socket event listeners for chat
  useEffect(() => {
    if (socket && chatSessionId) {
      // Join the chat room
      socket.emit("join-chat", chatSessionId)

      // Listen for new messages
      socket.on("new-message", (messageData: Message) => {
        setMessages((prev) => [...prev, messageData])
      })

      // Listen for typing indicators
      socket.on("user-typing", (data) => {
        if (data.senderType === "agent") {
          // Handle agent typing indicator
          console.log("Agent is typing:", data.senderName)
        }
      })

      return () => {
        socket.off("new-message")
        socket.off("user-typing")
      }
    }
  }, [socket, chatSessionId])

  const startLiveChat = async () => {
    if (!chatForm.name || !chatForm.email) {
      setMessage("Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: chatForm.name,
          customerEmail: chatForm.email,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Set chat session data
        setChatSessionId(data.chatSession.id.toString())
        setCustomerId(data.chatSession.customerId)
        setCustomerName(data.chatSession.customerName)
        setCurrentView("chat-active")
        setMessage("")

        // Load existing messages
        loadChatMessages(data.chatSession.id)
      } else if (data.showTicketForm) {
        setMessage("No agents are currently available. Please submit a support ticket instead.")
        setCurrentView("ticket-form")
        setTicketForm({
          ...ticketForm,
          name: chatForm.name,
          email: chatForm.email,
        })
      }
    } catch (error) {
      setMessage("Failed to start chat. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const loadChatMessages = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/messages?sessionId=${sessionId}`)
      const data = await response.json()

      if (data.messages) {
        setMessages(data.messages)
      }
    } catch (error) {
      console.error("Failed to load messages:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatSessionId || !customerId || !socket) return

    const messageContent = newMessage.trim()
    setNewMessage("")

    try {
      // Send message via Socket.IO
      socket.emit("send-message", {
        sessionId: chatSessionId,
        content: messageContent,
        senderType: "customer",
        senderId: customerId,
      })
    } catch (error) {
      console.error("Failed to send message:", error)
      setMessage("Failed to send message. Please try again.")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const submitTicket = async () => {
    if (!ticketForm.name || !ticketForm.email || !ticketForm.service || !ticketForm.description) {
      setMessage("Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketForm),
      })

      const data = await response.json()

      if (data.success) {
        setCurrentView("ticket-success")
        setMessage(`Ticket #${data.ticket.id} created successfully!`)
      } else {
        setMessage("Failed to create ticket. Please try again.")
      }
    } catch (error) {
      setMessage("Failed to create ticket. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const renderContent = () => {
    switch (currentView) {
      case "menu":
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">How can we help you?</h3>
              <p className="text-gray-600 text-sm">Choose an option below to get started</p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => setCurrentView("chat-form")}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center space-x-3 transition-all duration-200 hover:shadow-lg"
              >
                <MessageCircle className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Live Chat</div>
                  <div className="text-xs opacity-90">Chat with our support team</div>
                </div>
              </Button>

              <Button
                onClick={() => setCurrentView("ticket-form")}
                variant="outline"
                className="w-full h-14 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg flex items-center justify-center space-x-3 transition-all duration-200"
              >
                <Ticket className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Raise a Ticket</div>
                  <div className="text-xs text-gray-600">Submit a support request</div>
                </div>
              </Button>
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-xs text-gray-500">Our support team is available 24/7 to assist you</p>
            </div>
          </div>
        )

      case "chat-form":
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <Button variant="ghost" size="sm" onClick={() => setCurrentView("menu")} className="p-1 h-8 w-8">
                ←
              </Button>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Start Live Chat</h3>
                <p className="text-sm text-gray-600">Connect with our support team</p>
              </div>
            </div>

            {message && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">{message}</div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="chat-name" className="text-sm font-medium text-gray-700">
                  Your Name
                </Label>
                <Input
                  id="chat-name"
                  value={chatForm.name}
                  onChange={(e) => setChatForm({ ...chatForm, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="chat-email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="chat-email"
                  type="email"
                  value={chatForm.email}
                  onChange={(e) => setChatForm({ ...chatForm, email: e.target.value })}
                  placeholder="Enter your email"
                  className="mt-1"
                />
              </div>

              <Button onClick={startLiveChat} disabled={loading} className="w-full">
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Starting Chat...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className="w-4 h-4" />
                    <span>Start Chat</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        )

      case "chat-active":
        return (
          <div className="space-y-4 h-96 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Live Chat</h3>
                <p className="text-sm text-gray-600">
                  Connected as {customerName} • {isConnected ? "Online" : "Disconnected"}
                </p>
              </div>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
                <span className="text-xs text-gray-500">{isConnected ? "Connected" : "Disconnected"}</span>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-gray-50 rounded">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bot className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Start the conversation by sending a message</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === "customer" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        msg.sender_type === "customer" ? "bg-blue-600 text-white" : "bg-white text-gray-900 border"
                      }`}
                    >
                      <div className="flex items-center space-x-1 mb-1">
                        {msg.sender_type === "customer" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                        <span className="text-xs opacity-75">
                          {msg.sender_type === "customer" ? "You" : msg.sender_name}
                        </span>
                      </div>
                      <p>{msg.content}</p>
                      <p className="text-xs opacity-75 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="border-t pt-3">
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1"
                  disabled={!isConnected}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim() || !isConnected} size="sm">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Press Enter to send • {isConnected ? "Connected" : "Reconnecting..."}
              </p>
            </div>
          </div>
        )

      case "ticket-form":
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <Button variant="ghost" size="sm" onClick={() => setCurrentView("menu")} className="p-1 h-8 w-8">
                ←
              </Button>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Submit Support Ticket</h3>
                <p className="text-sm text-gray-600">We'll get back to you soon</p>
              </div>
            </div>

            {message && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-800 text-sm">
                {message}
              </div>
            )}

            <div className="space-y-4 max-h-80 overflow-y-auto">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="ticket-name" className="text-sm font-medium text-gray-700">
                    Your Name
                  </Label>
                  <Input
                    id="ticket-name"
                    value={ticketForm.name}
                    onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                    placeholder="Enter your full name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="ticket-email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="ticket-email"
                    type="email"
                    value={ticketForm.email}
                    onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })}
                    placeholder="Enter your email"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="service" className="text-sm font-medium text-gray-700">
                    Service Category
                  </Label>
                  <Select onValueChange={(value) => setTicketForm({ ...ticketForm, service: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PCC">PCC</SelectItem>
                      <SelectItem value="OCI">OCI</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Issue Description
                  </Label>
                  <Textarea
                    id="description"
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                    placeholder="Describe your issue in detail..."
                    rows={4}
                    className="mt-1 resize-none"
                  />
                </div>
              </div>
            </div>

            <Button onClick={submitTicket} disabled={loading} className="w-full">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Ticket className="w-4 h-4" />
                  <span>Submit Ticket</span>
                </div>
              )}
            </Button>
          </div>
        )

      case "ticket-success":
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ticket Submitted Successfully!</h3>
              <p className="text-sm text-gray-600 mb-4">{message}</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                <h4 className="font-medium text-green-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• You'll receive a confirmation email shortly</li>
                  <li>• Our team will review your request</li>
                  <li>• We'll respond within 24 hours</li>
                </ul>
              </div>
            </div>
            <Button onClick={() => setCurrentView("menu")} variant="outline" className="w-full">
              Back to Menu
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
      <div
        className={`
          bg-white rounded-lg shadow-2xl border border-gray-200 pointer-events-auto
          transition-all duration-300 ease-in-out transform
          ${isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95"}
          ${isMinimized ? "h-14" : "h-auto"}
          w-full max-w-sm sm:max-w-md
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Support Assistant</h2>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
                <span className="text-xs text-gray-600">{isConnected ? "Online" : "Connecting..."}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 h-8 w-8 hover:bg-gray-100"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-1 h-8 w-8 hover:bg-gray-100">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && <div className="p-4">{renderContent()}</div>}
      </div>
    </div>
  )
}
