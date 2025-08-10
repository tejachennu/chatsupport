import { type NextRequest, NextResponse } from "next/server"
import { query, initializeDatabase } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    // Validate session exists
    const sessions = await query("SELECT id FROM chat_sessions WHERE id = ?", [sessionId])
    if (!Array.isArray(sessions) || sessions.length === 0) {
      return NextResponse.json({ error: "Chat session not found" }, { status: 404 })
    }

    // Get all messages for this chat session
    const messages = await query(
      `
      SELECT 
        m.*,
        CASE 
          WHEN m.sender_type = 'agent' THEN a.name
          WHEN m.sender_type = 'customer' THEN c.name
          ELSE 'Unknown'
        END as sender_name
      FROM messages m
      LEFT JOIN agents a ON m.sender_type = 'agent' AND m.sender_id = a.id
      LEFT JOIN customers c ON m.sender_type = 'customer' AND m.sender_id = c.id
      WHERE m.chat_session_id = ?
      ORDER BY m.timestamp ASC
    `,
      [sessionId],
    )

    return NextResponse.json({ messages: Array.isArray(messages) ? messages : [] })
  } catch (error) {
    console.error("Messages fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()

    const { sessionId, content, senderType, senderId } = await request.json()

    if (!sessionId || !content || !senderType || !senderId) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Validate sender type
    if (!["agent", "customer"].includes(senderType)) {
      return NextResponse.json({ error: "Invalid sender type" }, { status: 400 })
    }

    // Validate session exists and is active
    const sessions = await query("SELECT id, status FROM chat_sessions WHERE id = ?", [sessionId])
    if (!Array.isArray(sessions) || sessions.length === 0) {
      return NextResponse.json({ error: "Chat session not found" }, { status: 404 })
    }

    if (sessions[0].status !== "active") {
      return NextResponse.json({ error: "Chat session is not active" }, { status: 400 })
    }

    // Insert the message
    const result = await query(
      "INSERT INTO messages (chat_session_id, sender_type, sender_id, content) VALUES (?, ?, ?, ?)",
      [sessionId, senderType, senderId, content],
    )

    // Get the created message with sender info
    const message = await query(
      `
      SELECT 
        m.*,
        CASE 
          WHEN m.sender_type = 'agent' THEN a.name
          WHEN m.sender_type = 'customer' THEN c.name
          ELSE 'Unknown'
        END as sender_name
      FROM messages m
      LEFT JOIN agents a ON m.sender_type = 'agent' AND m.sender_id = a.id
      LEFT JOIN customers c ON m.sender_type = 'customer' AND m.sender_id = c.id
      WHERE m.id = ?
    `,
      [(result as any).insertId],
    )

    const messageData = Array.isArray(message) && message.length > 0 ? message[0] : null

    if (!messageData) {
      return NextResponse.json({ error: "Failed to retrieve created message" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: messageData,
    })
  } catch (error) {
    console.error("Message send error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
