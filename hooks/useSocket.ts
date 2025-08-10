"use client"

import { useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(process.env.NEXT_PUBLIC_SITE_URL || window.location.origin, {
      path: "/api/socket/io",
      addTrailingSlash: false,
      transports: ["websocket", "polling"], // Allow fallback to polling
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
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

    setSocket(socketInstance)

    return () => {
      console.log("Cleaning up socket connection")
      socketInstance.disconnect()
    }
  }, [])

  return { socket, isConnected }
}
