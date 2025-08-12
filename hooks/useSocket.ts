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
  startTyping: (senderName: string, senderType: "agent" | "customer") => void
  stopTyping: (senderType: "agent" | "customer") => void
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
    const socketInstance: Socket = io("http://localhost:3001", {
      transports: ["websocket", "polling"],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: true,
    })

    socketInstance.on("connect", () => {
      console.log("✅ Connected to socket")
      setIsConnected(true)
    })

    socketInstance.on("disconnect", (reason) => {
      console.warn("❌ Disconnected from socket:", reason)
      setIsConnected(false)
    })

    socketInstance.on("new-message", (message: Message) => {
      setMessages((prev) => [...prev, message])
    })

    socketInstance.on("user-typing", ({ senderName }) => {
      setTypingUser(senderName)
      setIsTyping(true)
    })

    socketInstance.on("user-stop-typing", () => {
      setTypingUser(null)
      setIsTyping(false)
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

  const sendMessage = (
    content: string,
    senderType: "agent" | "customer",
    senderId: number,
    senderName: string
  ) => {
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

  const startTyping = (senderName: string, senderType: "agent" | "customer") => {
    if (socket && currentSessionId.current) {
      socket.emit("typing", {
        sessionId: currentSessionId.current,
        senderName,
        senderType,
      })
    }
  }

  const stopTyping = (senderType: "agent" | "customer") => {
    if (socket && currentSessionId.current) {
      socket.emit("stop-typing", {
        sessionId: currentSessionId.current,
        senderType,
      })
    }
  }

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
