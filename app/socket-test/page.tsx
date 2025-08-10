"use client"

import { useEffect, useState } from "react"
import { useSocket } from "@/hooks/useSocket"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export default function SocketTestPage() {
  const { socket, isConnected, connectionError, joinChat, sendMessage } = useSocket()
  const [messages, setMessages] = useState<any[]>([])
  const [testMessage, setTestMessage] = useState("")
  const [sessionId] = useState("test-session-123")

  useEffect(() => {
    if (socket) {
      socket.on("joined-chat", (data) => {
        console.log("Joined chat:", data)
        setMessages((prev) => [...prev, { type: "system", content: `Joined chat: ${data.sessionId}` }])
      })

      socket.on("new-message", (data) => {
        console.log("New message:", data)
        setMessages((prev) => [...prev, { type: "message", ...data }])
      })

      socket.on("user-typing", (data) => {
        console.log("User typing:", data)
        setMessages((prev) => [...prev, { type: "typing", content: `${data.senderName} is typing...` }])
      })

      return () => {
        socket.off("joined-chat")
        socket.off("new-message")
        socket.off("user-typing")
      }
    }
  }, [socket])

  const handleJoinChat = () => {
    joinChat(sessionId)
  }

  const handleSendMessage = () => {
    if (testMessage.trim()) {
      sendMessage({
        sessionId,
        content: testMessage,
        senderType: "customer",
        senderName: "Test User",
      })
      setTestMessage("")
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Socket.IO Connection Test</CardTitle>
          <CardDescription>Test the WebSocket connection and real-time messaging</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span>Connection Status:</span>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            {socket && <Badge variant="outline">Socket ID: {socket.id}</Badge>}
          </div>

          {connectionError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">Connection Error: {connectionError}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleJoinChat} disabled={!isConnected}>
              Join Test Chat
            </Button>
          </div>

          <div className="flex gap-2">
            <Input
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Type a test message..."
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <Button onClick={handleSendMessage} disabled={!isConnected || !testMessage.trim()}>
              Send Message
            </Button>
          </div>

          <div className="border rounded-md p-4 h-64 overflow-y-auto bg-gray-50">
            <h3 className="font-semibold mb-2">Messages:</h3>
            {messages.length === 0 ? (
              <p className="text-gray-500">No messages yet...</p>
            ) : (
              <div className="space-y-2">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded ${
                      msg.type === "system" ? "bg-blue-100" : msg.type === "typing" ? "bg-yellow-100" : "bg-white"
                    }`}
                  >
                    <div className="text-sm">
                      {msg.type === "message" && (
                        <>
                          <strong>{msg.sender_name}:</strong> {msg.content}
                          <div className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                        </>
                      )}
                      {msg.type !== "message" && msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
