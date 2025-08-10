import { type NextRequest, NextResponse } from "next/server"
import { query, getAvailableAgent, createChatSession, initializeDatabase } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    // Initialize database tables if they don't exist
    await initializeDatabase()

    const { customerName, customerEmail } = await request.json()

    if (!customerName || !customerEmail) {
      return NextResponse.json({ error: "Customer name and email are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Check for available agent
    const agent = await getAvailableAgent()

    if (!agent) {
      return NextResponse.json({
        success: false,
        message: "No agents available",
        showTicketForm: true,
      })
    }

    // Create or get customer
    const customers = await query("SELECT * FROM customers WHERE email = ?", [customerEmail])

    let customer
    if (!Array.isArray(customers) || customers.length === 0) {
      const result = await query("INSERT INTO customers (name, email) VALUES (?, ?)", [customerName, customerEmail])

      const newCustomers = await query("SELECT * FROM customers WHERE id = ?", [(result as any).insertId])

      customer = Array.isArray(newCustomers) && newCustomers.length > 0 ? newCustomers[0] : null
    } else {
      customer = customers[0]
      // Update customer name if it's different
      if (customer.name !== customerName) {
        await query("UPDATE customers SET name = ? WHERE id = ?", [customerName, customer.id])
        customer.name = customerName
      }
    }

    if (!customer) {
      return NextResponse.json({ error: "Failed to create or retrieve customer" }, { status: 500 })
    }

    // Create chat session
    const chatSession = await createChatSession(agent.id, customer.id)

    if (!chatSession) {
      return NextResponse.json({ error: "Failed to create chat session" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      chatSession: {
        id: chatSession.id,
        agentName: agent.name,
        customerId: customer.id,
        customerName: customer.name,
      },
    })
  } catch (error) {
    console.error("Chat start error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
