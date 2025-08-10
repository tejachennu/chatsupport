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

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Create direct connection like your example
    const connection = await mysql.createConnection(dbConfig)

    try {
      // Find agent
      const [agents] = await connection.execute("SELECT id, name, email, password FROM agents WHERE email = ?", [email])

      if (!Array.isArray(agents) || agents.length === 0) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }

      const agent = agents[0] as any

      // Verify password
      const isValidPassword = await bcrypt.compare(password, agent.password)
      if (!isValidPassword) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }

      // Update online status
      await connection.execute("UPDATE agents SET online_status = true WHERE id = ?", [agent.id])

      const token = jwt.sign(
        { id: agent.id, email: agent.email },
        process.env.JWT_SECRET || "your-secret-key-change-in-production",
        { expiresIn: "24h" },
      )

      return NextResponse.json({
        success: true,
        agent: {
          id: agent.id,
          name: agent.name,
          email: agent.email,
        },
        token,
      })
    } finally {
      // Always close the connection
      await connection.end()
    }
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
