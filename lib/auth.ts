import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { query } from "./db"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" })
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export async function getAgentFromToken(token: string) {
  const decoded = verifyToken(token) as any
  if (!decoded) return null

  try {
    const agents = await query("SELECT id, name, email, online_status, current_chat_count FROM agents WHERE id = ?", [
      decoded.id,
    ])

    return Array.isArray(agents) && agents.length > 0 ? agents[0] : null
  } catch (error) {
    console.error("Error fetching agent from token:", error)
    return null
  }
}
