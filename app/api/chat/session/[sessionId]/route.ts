import { type NextRequest, NextResponse } from "next/server"
import { query, initializeDatabase } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    await initializeDatabase()

    const sessionId = params.sessionId

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    // Get chat session details
    const sessions = await query(
      `
      SELECT 
        cs.*,
        a.name as agent_name,
        a.email as agent_email,
        c.name as customer_name,
        c.email as customer_email
      FROM chat_sessions cs
      LEFT JOIN agents a ON cs.agent_id = a.id
      LEFT JOIN customers c ON cs.customer_id = c.id
      WHERE cs.id = ?
    `,
      [sessionId],
    )

    if (!Array.isArray(sessions) || sessions.length === 0) {
      return NextResponse.json({ error: "Chat session not found" }, { status: 404 })
    }

    const session = sessions[0]

    // Check if session data is complete
    if (!session.agent_name || !session.customer_name) {
      return NextResponse.json({ error: "Incomplete session data" }, { status: 500 })
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error("Session fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
