import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const tableTests = []

    // Test each table individually
    const tables = ["agents", "customers", "chat_sessions", "messages", "tickets"]

    for (const table of tables) {
      try {
        const result = await query(`DESCRIBE ${table}`)
        const countResult = await query(`SELECT COUNT(*) as count FROM ${table}`)
        const count = Array.isArray(countResult) ? countResult[0].count : 0

        tableTests.push({
          table,
          status: "success",
          columns: Array.isArray(result) ? result.length : 0,
          records: count,
          structure: result,
        })
      } catch (error) {
        tableTests.push({
          table,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      success: true,
      tables: tableTests,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test database tables",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
