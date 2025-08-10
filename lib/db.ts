import mysql from "mysql2/promise"

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number.parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "customer_support",
  waitForConnections: true,
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  ssl: false,
  insecureAuth: true,
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number.parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

export async function query(sql: string, params: any[] = []) {
  try {
    const [results] = await pool.execute(sql, params)
    return results
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

export async function initializeDatabase() {
  try {
    // Create database if it doesn't exist
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      ssl: false,
      insecureAuth: true,
    })

    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``)
    await connection.end()

    // Create tables
    await query(`
      CREATE TABLE IF NOT EXISTS agents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        online_status BOOLEAN DEFAULT FALSE,
        current_chats INT DEFAULT 0,
        max_concurrent_chats INT DEFAULT 4,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    await query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        agent_id INT,
        customer_id INT,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP NULL,
        status ENUM('active', 'waiting', 'ended') DEFAULT 'waiting',
        INDEX idx_agent_id (agent_id),
        INDEX idx_customer_id (customer_id),
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `)

    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chat_session_id INT NOT NULL,
        sender_type ENUM('agent', 'customer') NOT NULL,
        sender_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_chat_session_id (chat_session_id),
        FOREIGN KEY (chat_session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
      )
    `)

    await query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        service ENUM('PCC', 'OCI', 'Others') NOT NULL,
        description TEXT NOT NULL,
        status ENUM('open', 'in_progress', 'resolved') DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    console.log("Database initialized successfully")
  } catch (error) {
    console.error("Database initialization error:", error)
    throw error
  }
}

export async function testConnection() {
  try {
    await pool.execute("SELECT 1")
    return { success: true, message: "Database connection successful" }
  } catch (error) {
    console.error("Database connection test failed:", error)
    return { success: false, message: `Database connection failed: ${error}` }
  }
}

// Get available agent for chat assignment
export async function getAvailableAgent() {
  try {
    const agents = await query(
      `SELECT id, name, email, current_chats 
       FROM agents 
       WHERE online_status = true 
       AND current_chats < max_concurrent_chats 
       ORDER BY current_chats ASC, last_activity DESC 
       LIMIT 1`,
    )

    return Array.isArray(agents) && agents.length > 0 ? agents[0] : null
  } catch (error) {
    console.error("Error getting available agent:", error)
    return null
  }
}

// Create or get existing customer
export async function createOrGetCustomer(name: string, email: string) {
  try {
    // Check if customer exists
    const existingCustomer = await query("SELECT * FROM customers WHERE email = ?", [email])

    if (Array.isArray(existingCustomer) && existingCustomer.length > 0) {
      return existingCustomer[0]
    }

    // Create new customer
    const result = (await query("INSERT INTO customers (name, email) VALUES (?, ?)", [name, email])) as any

    return {
      id: result.insertId,
      name,
      email,
      created_at: new Date(),
    }
  } catch (error) {
    console.error("Error creating/getting customer:", error)
    throw error
  }
}

// Create new chat session
export async function createChatSession(customerId: number, agentId?: number) {
  try {
    const sessionData = {
      customer_id: customerId,
      agent_id: agentId || null,
      status: agentId ? "active" : "waiting",
      started_at: new Date(),
    }

    const result = (await query(
      `INSERT INTO chat_sessions (customer_id, agent_id, status, started_at) 
       VALUES (?, ?, ?, ?)`,
      [sessionData.customer_id, sessionData.agent_id, sessionData.status, sessionData.started_at],
    )) as any

    // If agent assigned, increment their current chat count
    if (agentId) {
      await query("UPDATE agents SET current_chats = current_chats + 1 WHERE id = ?", [agentId])
    }

    return {
      id: result.insertId,
      ...sessionData,
    }
  } catch (error) {
    console.error("Error creating chat session:", error)
    throw error
  }
}

// End chat session
export async function endChatSession(sessionId: number) {
  try {
    // Get session details first
    const session = await query("SELECT * FROM chat_sessions WHERE id = ?", [sessionId])

    if (!Array.isArray(session) || session.length === 0) {
      throw new Error("Chat session not found")
    }

    const sessionData = session[0] as any

    // Update session status
    await query("UPDATE chat_sessions SET status = ?, ended_at = ? WHERE id = ?", ["ended", new Date(), sessionId])

    // If agent was assigned, decrement their current chat count
    if (sessionData.agent_id) {
      await query("UPDATE agents SET current_chats = GREATEST(current_chats - 1, 0) WHERE id = ?", [
        sessionData.agent_id,
      ])
    }

    return true
  } catch (error) {
    console.error("Error ending chat session:", error)
    throw error
  }
}

// Get chat session with details
export async function getChatSessionWithDetails(sessionId: number) {
  try {
    const result = await query(
      `SELECT 
        cs.*,
        c.name as customer_name,
        c.email as customer_email,
        a.name as agent_name,
        a.email as agent_email
       FROM chat_sessions cs
       LEFT JOIN customers c ON cs.customer_id = c.id
       LEFT JOIN agents a ON cs.agent_id = a.id
       WHERE cs.id = ?`,
      [sessionId],
    )

    return Array.isArray(result) && result.length > 0 ? result[0] : null
  } catch (error) {
    console.error("Error getting chat session details:", error)
    return null
  }
}

// Get chat messages
export async function getChatMessages(sessionId: number) {
  try {
    const messages = await query(
      `SELECT 
        m.*,
        CASE 
          WHEN m.sender_type = 'agent' THEN a.name
          WHEN m.sender_type = 'customer' THEN c.name
        END as sender_name
       FROM messages m
       LEFT JOIN agents a ON m.sender_type = 'agent' AND m.sender_id = a.id
       LEFT JOIN customers c ON m.sender_type = 'customer' AND m.sender_id = c.id
       WHERE m.chat_session_id = ?
       ORDER BY m.created_at ASC`,
      [sessionId],
    )

    return Array.isArray(messages) ? messages : []
  } catch (error) {
    console.error("Error getting chat messages:", error)
    return []
  }
}

// Add chat message
export async function addChatMessage(sessionId: number, senderType: string, senderId: number, content: string) {
  try {
    const result = (await query(
      "INSERT INTO messages (chat_session_id, sender_type, sender_id, content) VALUES (?, ?, ?, ?)",
      [sessionId, senderType, senderId, content],
    )) as any

    // Get the created message with sender info
    const message = await query(
      `SELECT 
        m.*,
        CASE 
          WHEN m.sender_type = 'agent' THEN a.name
          WHEN m.sender_type = 'customer' THEN c.name
        END as sender_name
       FROM messages m
       LEFT JOIN agents a ON m.sender_type = 'agent' AND m.sender_id = a.id
       LEFT JOIN customers c ON m.sender_type = 'customer' AND m.sender_id = c.id
       WHERE m.id = ?`,
      [result.insertId],
    )

    return Array.isArray(message) && message.length > 0 ? message[0] : null
  } catch (error) {
    console.error("Error adding chat message:", error)
    throw error
  }
}

export default pool
