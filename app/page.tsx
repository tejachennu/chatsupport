"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageCircle, Ticket, Users } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const [showChatForm, setShowChatForm] = useState(false)
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [ticketData, setTicketData] = useState({
    name: "",
    email: "",
    service: "",
    description: "",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const startChat = async () => {
    if (!customerName || !customerEmail) {
      setMessage("Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName, customerEmail }),
      })

      const data = await response.json()

      if (data.success) {
        // Redirect to chat interface
        window.location.href = `/chat/${data.chatSession.id}`
      } else if (data.showTicketForm) {
        setShowTicketForm(true)
        setShowChatForm(false)
        setMessage("No agents are currently available. Please submit a support ticket.")
      }
    } catch (error) {
      setMessage("Failed to start chat. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const submitTicket = async () => {
    if (!ticketData.name || !ticketData.email || !ticketData.service || !ticketData.description) {
      setMessage("Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketData),
      })

      const data = await response.json()

      if (data.success) {
        setMessage(`Ticket #${data.ticket.id} created successfully! Check your email for confirmation.`)
        setTicketData({ name: "", email: "", service: "", description: "" })
        setShowTicketForm(false)
      }
    } catch (error) {
      setMessage("Failed to create ticket. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Customer Support Center</h1>
          <p className="text-xl text-gray-600">Get help from our support team or submit a ticket</p>
        </div>

        {message && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-blue-100 border border-blue-300 rounded-lg text-blue-800">
            {message}
          </div>
        )}

        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowChatForm(true)}>
            <CardHeader className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto text-blue-600 mb-2" />
              <CardTitle>Live Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">Chat with our support agents in real-time</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowTicketForm(true)}>
            <CardHeader className="text-center">
              <Ticket className="w-12 h-12 mx-auto text-green-600 mb-2" />
              <CardTitle>Submit Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">Create a support ticket for non-urgent issues</p>
            </CardContent>
          </Card>

          <Link href="/agent/login">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Users className="w-12 h-12 mx-auto text-purple-600 mb-2" />
                <CardTitle>Agent Login</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">Access the agent dashboard</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {showChatForm && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Start Live Chat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <Label htmlFor="email">Your Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={startChat} disabled={loading} className="flex-1">
                  {loading ? "Starting..." : "Start Chat"}
                </Button>
                <Button variant="outline" onClick={() => setShowChatForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {showTicketForm && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Submit Support Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ticket-name">Your Name</Label>
                <Input
                  id="ticket-name"
                  value={ticketData.name}
                  onChange={(e) => setTicketData({ ...ticketData, name: e.target.value })}
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <Label htmlFor="ticket-email">Your Email</Label>
                <Input
                  id="ticket-email"
                  type="email"
                  value={ticketData.email}
                  onChange={(e) => setTicketData({ ...ticketData, email: e.target.value })}
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <Label htmlFor="service">Service</Label>
                <Select onValueChange={(value) => setTicketData({ ...ticketData, service: value })}>
                  <SelectTrigger>
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
                <Label htmlFor="description">Issue Description</Label>
                <Textarea
                  id="description"
                  value={ticketData.description}
                  onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
                  placeholder="Describe your issue in detail"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={submitTicket} disabled={loading} className="flex-1">
                  {loading ? "Submitting..." : "Submit Ticket"}
                </Button>
                <Button variant="outline" onClick={() => setShowTicketForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center mt-8">
          <Link href="/admin" className="text-blue-600 hover:underline">
            Admin Panel
          </Link>
        </div>
      </div>
    </div>
  )
}
