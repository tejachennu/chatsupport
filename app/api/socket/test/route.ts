import { NextResponse } from "next/server"

<<<<<<< HEAD
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
=======
export async function GET() {
  return NextResponse.json({
    message: "Socket.IO test endpoint",
    timestamp: new Date().toISOString(),
    socketPath: "/api/socket/io",
  })
>>>>>>> 1155a43c51c98e8f0e412330456c9fd5701ca5e8
}
