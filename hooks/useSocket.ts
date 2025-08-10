"use client"

import { useEffect, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"

interface Message {
  id: number
  sessionId: string
  message: string
  senderType: "customer" | "agent"
  senderName: string
  timestamp: string
}

interface UseSocketReturn {
  socket: Socket | null
  isConnected: boolean
  messages: Message[]
  joinSession: (sessionId: string, userType: "customer" | "agent", userData: any) => void
  sendMessage: (sessionId: string, message: string, senderType: "customer" | "agent", senderName: string) => void
  sendTyping: (sessionId: string, senderName: string, isTyping: boolean) => void
  getChatHistory: (sessionId: string) => void
  endChat: (sessionId: string) => void
}

export function useSocket(): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000", {
      path: "/api/socketio",
      addTrailingSlash: false,
    })

    const socket = socketRef.current

    socket.on("connect", () => {
      console.log("Connected to server:", socket.id)
      setIsConnected(true)
    })

    socket.on("disconnect", () => {
      console.log("Disconnected from server")
      setIsConnected(false)
    })

    socket.on("new-message", (messageData: Message) => {
      setMessages((prev) => [...prev, messageData])
    })

    socket.on("chat-history", (data) => {
      setMessages(data.messages)
    })

    socket.on("agent-joined", (data) => {
      console.log("Agent joined:", data)
    })

    socket.on("customer-waiting", (data) => {
      console.log("Customer waiting:", data)
    })

    socket.on("user-typing", (data) => {
      console.log("User typing:", data)
    })

    socket.on("chat-ended", (data) => {
      console.log("Chat ended:", data)
    })

    socket.on("error", (error) => {
      console.error("Socket error:", error)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const joinSession = (sessionId: string, userType: "customer" | "agent", userData: any) => {
    if (socketRef.current) {
      socketRef.current.emit("join-session", { sessionId, userType, userData })
    }
  }

  const sendMessage = (sessionId: string, message: string, senderType: "customer" | "agent", senderName: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("send-message", { sessionId, message, senderType, senderName })
    }
  }

  const sendTyping = (sessionId: string, senderName: string, isTyping: boolean) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("typing", { sessionId, senderName, isTyping })
    }
  }

  const getChatHistory = (sessionId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("get-history", { sessionId })
    }
  }

  const endChat = (sessionId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("end-chat", { sessionId })
    }
  }

  return {
    socket: socketRef.current,
    isConnected,
    messages,
    joinSession,
    sendMessage,
    sendTyping,
    getChatHistory,
    endChat,
  }
}
