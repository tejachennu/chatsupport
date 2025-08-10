import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { initializeDatabase } from "@/lib/db"

const dbConfig = {
  host: process.env.DB_HOST || "194.163.45.105",
  port: Number.parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "marketingOwner",
  password: process.env.DB_PASSWORD || "M@rketing123!",
  database: process.env.DB_NAME || "MarketingDb",
}

export async function POST(request: NextRequest) {
  try {
    // Initialize database tables if they don't exist
    await initializeDatabase()

    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Create direct connection
    const connection = await mysql.createConnection(dbConfig)

    try {
      // Check if agent already exists
      const [existingAgents] = await connection.execute("SELECT id FROM agents WHERE email = ?", [email])

      if (Array.isArray(existingAgents) && existingAgents.length > 0) {
        return NextResponse.json({ error: "Agent already exists" }, { status: 400 })
      }

      // Hash password and create agent
      const hashedPassword = await bcrypt.hash(password, 10)
      const [result] = await connection.execute("INSERT INTO agents (name, email, password) VALUES (?, ?, ?)", [
        name,
        email,
        hashedPassword,
      ])

      // Get the created agent
      const [agents] = await connection.execute("SELECT id, name, email FROM agents WHERE id = ?", [
        (result as any).insertId,
      ])

      const agentData = Array.isArray(agents) && agents.length > 0 ? agents[0] : null

      if (!agentData) {
        return NextResponse.json({ error: "Failed to create agent" }, { status: 500 })
      }

      const token = jwt.sign(
        { id: (agentData as any).id, email: (agentData as any).email },
        process.env.JWT_SECRET || "your-secret-key-change-in-production",
        { expiresIn: "24h" },
      )

      return NextResponse.json({
        success: true,
        agent: agentData,
        token,
      })
    } finally {
      // Always close the connection
      await connection.end()
    }
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
