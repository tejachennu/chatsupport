"use client"

import type React from "react"

import { useState } from "react"
import { useSocket } from "@/hooks/useSocket"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function SocketTestPage() {
  const { socket, isConnected, messages, joinSession, sendMessage, getChatHistory } = useSocket()
  const [sessionId] = useState(`test-${Date.now()}`)
  const [messageInput, setMessageInput] = useState("")
  const [userName] = useState("Test User")
  const [hasJoined, setHasJoined] = useState(false)

  const handleJoinSession = () => {
    joinSession(sessionId, "customer", {
      name: userName,
      email: "test@example.com",
    })
    setHasJoined(true)
    getChatHistory(sessionId)
  }

  const handleSendMessage = () => {
    if (messageInput.trim() && hasJoined) {
      sendMessage(sessionId, messageInput, "customer", userName)
      setMessageInput("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            WebSocket Connection Test
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Socket ID:</strong> {socket?.id || "Not connected"}
            </div>
            <div>
              <strong>Session ID:</strong> {sessionId}
            </div>
            <div>
              <strong>User:</strong> {userName}
            </div>
            <div>
              <strong>Status:</strong> {hasJoined ? "Joined" : "Not joined"}
            </div>
          </div>

          {!hasJoined && (
            <Button onClick={handleJoinSession} disabled={!isConnected} className="w-full">
              Join Test Session
            </Button>
          )}

          <div className="border rounded-lg p-4 h-64 overflow-y-auto bg-gray-50">
            <div className="text-sm font-medium mb-2">Messages ({messages.length})</div>
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No messages yet. Send a message to test the connection.
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      msg.senderType === "customer" ? "bg-blue-100 ml-4" : "bg-green-100 mr-4"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">{msg.senderName}</div>
                        <div className="text-sm">{msg.message}</div>
                      </div>
                      <div className="text-xs text-gray-500 ml-2">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={!isConnected || !hasJoined}
            />
            <Button onClick={handleSendMessage} disabled={!isConnected || !hasJoined || !messageInput.trim()}>
              Send
            </Button>
          </div>

          <div className="text-xs text-gray-600 space-y-1">
            <div>• Make sure to join the session first</div>
            <div>• Messages are saved to the database</div>
            <div>• Real-time communication via WebSocket</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
