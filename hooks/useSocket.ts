"use client"

import { useEffect, useState, useRef } from "react"
import { io, type Socket } from "socket.io-client"

interface Message {
  id: number
  content: string
  senderType: "agent" | "customer"
  senderName: string
  timestamp: Date
}

interface UseSocketReturn {
  socket: Socket | null
  isConnected: boolean
  messages: Message[]
  sendMessage: (content: string, senderType: "agent" | "customer", senderId: number, senderName: string) => void
  joinSession: (sessionId: string) => void
  startTyping: (senderName: string) => void
  stopTyping: () => void
  isTyping: boolean
  typingUser: string | null
}

export const useSocket = (sessionId?: string): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const currentSessionId = useRef<string | null>(null)

  useEffect(() => {
    const socketInstance = io(process.env.NODE_ENV === "production" ? "" : "http://localhost:3000", {
      path: "/api/socketio",
      addTrailingSlash: false,
      transports: ["polling", "websocket"],
    })

    socketInstance.on("connect", () => {
      console.log("Connected to socket server")
      setIsConnected(true)
    })

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from socket server")
      setIsConnected(false)
    })

    socketInstance.on("new-message", (message: Message) => {
      setMessages((prev) => [...prev, message])
    })

    socketInstance.on("user-typing", (data: { senderName: string }) => {
      setIsTyping(true)
      setTypingUser(data.senderName)
    })

    socketInstance.on("user-stopped-typing", () => {
      setIsTyping(false)
      setTypingUser(null)
    })

    socketInstance.on("error", (error: { message: string }) => {
      console.error("Socket error:", error.message)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const joinSession = (sessionId: string) => {
    if (socket && sessionId) {
      socket.emit("join-session", sessionId)
      currentSessionId.current = sessionId
    }
  }

  const sendMessage = (content: string, senderType: "agent" | "customer", senderId: number, senderName: string) => {
    if (socket && currentSessionId.current) {
      socket.emit("send-message", {
        sessionId: currentSessionId.current,
        senderType,
        senderId,
        content,
        senderName,
      })
    }
  }

  const startTyping = (senderName: string) => {
    if (socket && currentSessionId.current) {
      socket.emit("typing", {
        sessionId: currentSessionId.current,
        senderName,
      })
    }
  }

  const stopTyping = () => {
    if (socket && currentSessionId.current) {
      socket.emit("stop-typing", {
        sessionId: currentSessionId.current,
      })
    }
  }

  // Auto-join session if provided
  useEffect(() => {
    if (socket && sessionId && isConnected) {
      joinSession(sessionId)
    }
  }, [socket, sessionId, isConnected])

  return {
    socket,
    isConnected,
    messages,
    sendMessage,
    joinSession,
    startTyping,
    stopTyping,
    isTyping,
    typingUser,
  }
}
