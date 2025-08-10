import { type NextRequest, NextResponse } from "next/server"
import { endChatSession, initializeDatabase } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    await initializeDatabase()

    const sessionId = Number.parseInt(params.sessionId)

    if (isNaN(sessionId)) {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 })
    }

    const session = await endChatSession(sessionId)

    if (!session) {
      return NextResponse.json({ error: "Session not found or already ended" }, { status: 404 })
    }

    return NextResponse.json({ success: true, session })
  } catch (error) {
    console.error("End chat error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
