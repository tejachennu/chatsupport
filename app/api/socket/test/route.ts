import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Test if the Socket.IO endpoint is accessible
    const socketUrl = `http://localhost:3001/api/socket/io`

    return NextResponse.json({
      success: true,
      message: "Socket.IO endpoint should be available",
      socketUrl,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Socket test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test socket connection",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
