"use client"

import { useState } from "react"
import { useSocket } from "@/hooks/useSocket"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SocketTestPage() {
  const [sessionId, setSessionId] = useState("test-session-123")
  const [message, setMessage] = useState("")
  const [senderName, setSenderName] = useState("Test User")
  const [senderType, setSenderType] = useState<"agent" | "customer">("customer")

  const { socket, isConnected, messages, sendMessage, joinSession, startTyping, stopTyping, isTyping, typingUser } =
    useSocket()

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessage(message, senderType, 1, senderName)
      setMessage("")
    }
  }

  const handleJoinSession = () => {
    if (sessionId.trim()) {
      joinSession(sessionId)
    }
  }

  const handleTyping = () => {
    startTyping(senderName)
    setTimeout(() => stopTyping(), 2000) // Stop typing after 2 seconds
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Socket.IO Test Page</h1>

      {/* Connection Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            {isConnected ? "Connected" : "Disconnected"}
          </div>
          {socket && <p className="text-sm text-gray-600 mt-2">Socket ID: {socket.id}</p>}
        </CardContent>
      </Card>

      {/* Session Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Session Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Session ID" value={sessionId} onChange={(e) => setSessionId(e.target.value)} />
            <Button onClick={handleJoinSession} disabled={!isConnected}>
              Join Session
            </Button>
          </div>

          <div className="flex gap-2">
            <Input placeholder="Your name" value={senderName} onChange={(e) => setSenderName(e.target.value)} />
            <select
              value={senderType}
              onChange={(e) => setSenderType(e.target.value as "agent" | "customer")}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="customer">Customer</option>
              <option value="agent">Agent</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 overflow-y-auto border rounded-md p-4 mb-4 bg-gray-50">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center">No messages yet...</p>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-2 p-2 rounded-md ${
                    msg.senderType === "customer"
                      ? "bg-blue-100 text-blue-900 ml-8"
                      : "bg-green-100 text-green-900 mr-8"
                  }`}
                >
                  <div className="font-semibold text-xs mb-1">
                    {msg.senderName} ({msg.senderType})
                  </div>
                  <div>{msg.content}</div>
                  <div className="text-xs text-gray-500 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                </div>
              ))
            )}

            {isTyping && typingUser && <div className="text-gray-500 italic text-sm">{typingUser} is typing...</div>}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <Button onClick={handleSendMessage} disabled={!isConnected || !message.trim()}>
              Send
            </Button>
            <Button onClick={handleTyping} disabled={!isConnected} variant="outline">
              Test Typing
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-100 p-4 rounded-md overflow-auto">
            {JSON.stringify(
              {
                isConnected,
                socketId: socket?.id,
                messagesCount: messages.length,
                isTyping,
                typingUser,
                sessionId,
              },
              null,
              2,
            )}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
