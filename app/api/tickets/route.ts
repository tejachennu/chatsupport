import { type NextRequest, NextResponse } from "next/server"
import { query, initializeDatabase } from "@/lib/db"
import { sendTicketConfirmation } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    // Initialize database tables if they don't exist
    await initializeDatabase()

    const { name, email, service, description } = await request.json()

    if (!name || !email || !service || !description) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Validate service type
    if (!["PCC", "OCI", "Others"].includes(service)) {
      return NextResponse.json({ error: "Invalid service type" }, { status: 400 })
    }

    // Create ticket
    const result = await query("INSERT INTO tickets (name, email, service, description) VALUES (?, ?, ?, ?)", [
      name,
      email,
      service,
      description,
    ])

    // Get the created ticket
    const ticket = await query("SELECT * FROM tickets WHERE id = ?", [(result as any).insertId])

    const ticketData = Array.isArray(ticket) && ticket.length > 0 ? ticket[0] : null

    if (!ticketData) {
      return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 })
    }

    // Send confirmation email (don't fail if email fails)
    try {
      await sendTicketConfirmation(email, name, ticketData.id, service, description)
    } catch (emailError) {
      console.error("Email sending failed:", emailError)
      // Continue without failing the API call
    }

    return NextResponse.json({
      success: true,
      ticket: ticketData,
    })
  } catch (error) {
    console.error("Ticket creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Initialize database tables if they don't exist
    await initializeDatabase()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    let sql = "SELECT * FROM tickets"
    const params: any[] = []

    if (status && ["open", "in_progress", "resolved"].includes(status)) {
      sql += " WHERE status = ?"
      params.push(status)
    }

    sql += " ORDER BY created_at DESC"

    const tickets = await query(sql, params)

    return NextResponse.json({ tickets: Array.isArray(tickets) ? tickets : [] })
  } catch (error) {
    console.error("Tickets fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
