import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    message: "Socket.IO test endpoint",
    timestamp: new Date().toISOString(),
    socketPath: "/api/socket/io",
  })
}
