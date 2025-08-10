import mysql from "mysql2/promise"

let connection: mysql.Connection | null = null

export async function getConnection() {
  if (!connection) {
    try {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number.parseInt(process.env.DB_PORT || "3306"),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: {
          rejectUnauthorized: false,
        },
      })
      console.log("Database connected successfully")
    } catch (error) {
      console.error("Database connection failed:", error)
      throw error
    }
  }
  return connection
}

export async function query(sql: string, params: any[] = []) {
  try {
    const conn = await getConnection()
    const [results] = await conn.execute(sql, params)
    return results
  } catch (error) {
    console.error("Database query failed:", error)
    throw error
  }
}

export async function initializeDatabase() {
  try {
    const conn = await getConnection()

    // Create customers table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create agents table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS agents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        online_status BOOLEAN DEFAULT FALSE,
        current_chat_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // Create chat_sessions table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        agent_id INT,
        customer_id INT,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP NULL,
        status ENUM('active', 'ended') DEFAULT 'active',
        INDEX idx_agent_id (agent_id),
        INDEX idx_customer_id (customer_id),
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `)

    // Create messages table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chat_session_id INT NOT NULL,
        sender_type ENUM('agent', 'customer') NOT NULL,
        sender_id INT NOT NULL,
        content TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_chat_session_id (chat_session_id),
        FOREIGN KEY (chat_session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
      )
    `)

    // Create tickets table
    await conn.execute(`
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

    console.log("Database tables initialized successfully")
  } catch (error) {
    console.error("Database initialization failed:", error)
    throw error
  }
}

// Get available agent for chat assignment
export async function getAvailableAgent() {
  try {
    const agents = await query(`
      SELECT * FROM agents 
      WHERE online_status = true AND current_chat_count < 4 
      ORDER BY current_chat_count ASC 
      LIMIT 1
    `)
    return Array.isArray(agents) && agents.length > 0 ? agents[0] : null
  } catch (error) {
    console.error("Error getting available agent:", error)
    throw error
  }
}

// Create a new chat session
export async function createChatSession(agentId: number, customerId: number) {
  try {
    const result = await query(`INSERT INTO chat_sessions (agent_id, customer_id) VALUES (?, ?)`, [agentId, customerId])

    // Update agent's chat count
    await query(`UPDATE agents SET current_chat_count = current_chat_count + 1 WHERE id = ?`, [agentId])

    // Get the created session
    const sessions = await query(`SELECT * FROM chat_sessions WHERE id = ?`, [(result as any).insertId])

    return Array.isArray(sessions) && sessions.length > 0 ? sessions[0] : null
  } catch (error) {
    console.error("Error creating chat session:", error)
    throw error
  }
}

// End a chat session
export async function endChatSession(sessionId: number) {
  try {
    await query(`UPDATE chat_sessions SET ended_at = NOW(), status = 'ended' WHERE id = ?`, [sessionId])

    // Get the updated session to get agent_id
    const session = await query(`SELECT * FROM chat_sessions WHERE id = ?`, [sessionId])

    if (Array.isArray(session) && session.length > 0) {
      // Decrease agent's chat count
      await query(`UPDATE agents SET current_chat_count = current_chat_count - 1 WHERE id = ?`, [session[0].agent_id])
    }

    return Array.isArray(session) && session.length > 0 ? session[0] : null
  } catch (error) {
    console.error("Error ending chat session:", error)
    throw error
  }
}

// Helper function to create or get customer
export async function createOrGetCustomer(name: string, email: string) {
  try {
    // Check if customer exists
    const existingCustomers = await query(`SELECT * FROM customers WHERE email = ?`, [email])

    if (Array.isArray(existingCustomers) && existingCustomers.length > 0) {
      return existingCustomers[0]
    }

    // Create new customer
    const result = await query(`INSERT INTO customers (name, email) VALUES (?, ?)`, [name, email])

    const newCustomers = await query(`SELECT * FROM customers WHERE id = ?`, [(result as any).insertId])

    return Array.isArray(newCustomers) && newCustomers.length > 0 ? newCustomers[0] : null
  } catch (error) {
    console.error("Error creating/getting customer:", error)
    throw error
  }
}

// Get chat session with details
export async function getChatSessionWithDetails(sessionId: number) {
  try {
    const sessions = await query(
      `
      SELECT 
        cs.*,
        a.name as agent_name,
        a.email as agent_email,
        c.name as customer_name,
        c.email as customer_email
      FROM chat_sessions cs
      LEFT JOIN agents a ON cs.agent_id = a.id
      LEFT JOIN customers c ON cs.customer_id = c.id
      WHERE cs.id = ?
    `,
      [sessionId],
    )

    return Array.isArray(sessions) && sessions.length > 0 ? sessions[0] : null
  } catch (error) {
    console.error("Error getting chat session details:", error)
    throw error
  }
}

// Get messages for a chat session
export async function getChatMessages(sessionId: number) {
  try {
    const messages = await query(
      `
      SELECT * FROM messages 
      WHERE chat_session_id = ? 
      ORDER BY timestamp ASC
    `,
      [sessionId],
    )

    return Array.isArray(messages) ? messages : []
  } catch (error) {
    console.error("Error getting chat messages:", error)
    throw error
  }
}

// Add message to chat session
export async function addChatMessage(
  sessionId: number,
  senderType: "agent" | "customer",
  senderId: number,
  content: string,
) {
  try {
    const result = await query(
      `
      INSERT INTO messages (chat_session_id, sender_type, sender_id, content) 
      VALUES (?, ?, ?, ?)
    `,
      [sessionId, senderType, senderId, content],
    )

    const messages = await query(`SELECT * FROM messages WHERE id = ?`, [(result as any).insertId])

    return Array.isArray(messages) && messages.length > 0 ? messages[0] : null
  } catch (error) {
    console.error("Error adding chat message:", error)
    throw error
  }
}
