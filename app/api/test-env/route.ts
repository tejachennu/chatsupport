import { NextResponse } from "next/server"

export async function GET() {
  try {
    const envStatus = {
      database: {
        DB_HOST: process.env.DB_HOST ? `✓ Set (${process.env.DB_HOST})` : "✗ Missing",
        DB_PORT: process.env.DB_PORT ? `✓ Set (${process.env.DB_PORT})` : "✗ Missing",
        DB_USER: process.env.DB_USER ? `✓ Set (${process.env.DB_USER})` : "✗ Missing",
        DB_PASSWORD: process.env.DB_PASSWORD ? `✓ Set (${process.env.DB_PASSWORD.length} chars)` : "✗ Missing",
        DB_NAME: process.env.DB_NAME ? `✓ Set (${process.env.DB_NAME})` : "✗ Missing",
      },
      optional: {
        JWT_SECRET: process.env.JWT_SECRET ? `✓ Set (${process.env.JWT_SECRET.length} chars)` : "✗ Missing",
        SMTP_HOST: process.env.SMTP_HOST ? `✓ Set (${process.env.SMTP_HOST})` : "✗ Missing",
        SMTP_USER: process.env.SMTP_USER ? `✓ Set (${process.env.SMTP_USER})` : "✗ Missing",
        SMTP_PASS: process.env.SMTP_PASS ? `✓ Set (${process.env.SMTP_PASS.length} chars)` : "✗ Missing",
        SMTP_FROM: process.env.SMTP_FROM ? `✓ Set (${process.env.SMTP_FROM})` : "✗ Missing",
      },
      rawValues: {
        DB_HOST: process.env.DB_HOST || "Not set",
        DB_PORT: process.env.DB_PORT || "Not set",
        DB_USER: process.env.DB_USER || "Not set",
        DB_NAME: process.env.DB_NAME || "Not set",
        NODE_ENV: process.env.NODE_ENV || "Not set",
      },
    }

    return NextResponse.json({
      success: true,
      environment: envStatus,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check environment variables",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
