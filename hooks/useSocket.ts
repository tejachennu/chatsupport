"use client"

import { useEffect, useState, useCallback } from "react"
import { io, type Socket } from "socket.io-client"

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    let socketInstance: Socket

    const initializeSocket = () => {
      console.log("Initializing socket connection...")

      socketInstance = io({
        path: "/api/socket/io",
        addTrailingSlash: false,
        transports: ["polling", "websocket"],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        forceNew: false,
        autoConnect: true,
      })

      socketInstance.on("connect", () => {
        console.log("Connected to Socket.IO server:", socketInstance.id)
        setIsConnected(true)
        setConnectionError(null)
      })

      socketInstance.on("disconnect", (reason) => {
        console.log("Disconnected from Socket.IO server:", reason)
        setIsConnected(false)
        if (reason === "io server disconnect") {
          // Server disconnected, try to reconnect
          socketInstance.connect()
        }
      })

      socketInstance.on("connect_error", (error) => {
        console.error("Socket connection error:", error)
        setIsConnected(false)
        setConnectionError(error.message)
      })

      socketInstance.on("reconnect", (attemptNumber) => {
        console.log("Reconnected to Socket.IO server after", attemptNumber, "attempts")
        setIsConnected(true)
        setConnectionError(null)
      })

      socketInstance.on("reconnect_error", (error) => {
        console.error("Socket reconnection error:", error)
        setConnectionError(error.message)
      })

      socketInstance.on("reconnect_failed", () => {
        console.error("Failed to reconnect to Socket.IO server")
        setIsConnected(false)
        setConnectionError("Failed to reconnect to server")
      })

      setSocket(socketInstance)
    }

    initializeSocket()

    return () => {
      if (socketInstance) {
        console.log("Cleaning up socket connection")
        socketInstance.disconnect()
      }
    }
  }, [])

  const joinChat = useCallback(
    (sessionId: string) => {
      if (socket && isConnected) {
        console.log("Joining chat:", sessionId)
        socket.emit("join-chat", sessionId)
      }
    },
    [socket, isConnected],
  )

  const sendMessage = useCallback(
    (data: {
      sessionId: string
      content: string
      senderType: string
      senderId?: string
      senderName?: string
    }) => {
      if (socket && isConnected) {
        console.log("Sending message:", data)
        socket.emit("send-message", data)
      }
    },
    [socket, isConnected],
  )

  const startTyping = useCallback(
    (data: {
      sessionId: string
      senderType: string
      senderName: string
    }) => {
      if (socket && isConnected) {
        socket.emit("typing", data)
      }
    },
    [socket, isConnected],
  )

  const stopTyping = useCallback(
    (data: {
      sessionId: string
      senderType: string
    }) => {
      if (socket && isConnected) {
        socket.emit("stop-typing", data)
      }
    },
    [socket, isConnected],
  )

  return {
    socket,
    isConnected,
    connectionError,
    joinChat,
    sendMessage,
    startTyping,
    stopTyping,
  }
}
