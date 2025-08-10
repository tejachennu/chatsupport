"use client"

import { useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Initialize socket connection with better Vercel compatibility
    const socketInstance = io({
      path: "/api/socket/io",
      addTrailingSlash: false,
      transports: ["polling", "websocket"], // Start with polling, upgrade to websocket if available
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 5,
      forceNew: false,
    })

    socketInstance.on("connect", () => {
      console.log("Connected to Socket.IO server:", socketInstance.id)
      setIsConnected(true)
    })

    socketInstance.on("disconnect", (reason) => {
      console.log("Disconnected from Socket.IO server:", reason)
      setIsConnected(false)
    })

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
      setIsConnected(false)
    })

    socketInstance.on("reconnect", (attemptNumber) => {
      console.log("Reconnected to Socket.IO server after", attemptNumber, "attempts")
      setIsConnected(true)
    })

    socketInstance.on("reconnect_error", (error) => {
      console.error("Socket reconnection error:", error)
    })

    socketInstance.on("reconnect_failed", () => {
      console.error("Failed to reconnect to Socket.IO server")
      setIsConnected(false)
    })

    setSocket(socketInstance)

    return () => {
      console.log("Cleaning up socket connection")
      socketInstance.disconnect()
    }
  }, [])

  return { socket, isConnected }
}
