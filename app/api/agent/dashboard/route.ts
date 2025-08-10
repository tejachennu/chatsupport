import { type NextRequest, NextResponse } from "next/server"
import { query, initializeDatabase } from "@/lib/db"
import { getAgentFromToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Initialize database tables if they don't exist
    await initializeDatabase()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const agent = await getAgentFromToken(token)
    if (!agent) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get active chat sessions for this agent
    const activeSessions = await query(
      `
      SELECT 
        cs.id,
        cs.started_at,
        c.name as customer_name,
        c.email as customer_email,
        (
          SELECT content 
          FROM messages 
          WHERE chat_session_id = cs.id 
          ORDER BY timestamp DESC 
          LIMIT 1
        ) as last_message
      FROM chat_sessions cs
      JOIN customers c ON cs.customer_id = c.id
      WHERE cs.agent_id = ? AND cs.status = 'active'
      ORDER BY cs.started_at DESC
    `,
      [agent.id],
    )

    return NextResponse.json({
      agent,
      activeSessions: Array.isArray(activeSessions) ? activeSessions : [],
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
