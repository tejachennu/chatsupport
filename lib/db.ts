import mysql from "mysql2/promise"

// Database configuration - cleaned up for mysql2
const dbConfig = {
  host: process.env.DB_HOST || "194.163.45.105",
  port: Number.parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "marketingOwner",
  password: process.env.DB_PASSWORD || "M@rketing123!",
  database: process.env.DB_NAME || "MarketingDb",
  // Valid mysql2 options only
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
  // Connection pool specific options
  connectionLimit: 10,
  queueLimit: 0,
}

// Create connection pool
const pool = mysql.createPool(dbConfig)

// Query function that works with mysql2/promise
export async function query(sql: string, params: any[] = []): Promise<any> {
  try {
    const [results] = await pool.execute(sql, params)
    return results
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

// Test connection function
export async function testConnection() {
  try {
    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()
    console.log("Database connection test successful")
    return true
  } catch (error) {
    console.error("Database connection test failed:", error)
    throw error
  }
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    console.log("Initializing database tables...")

    // Create agents table
    await query(`
      CREATE TABLE IF NOT EXISTS agents (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        online_status BOOLEAN DEFAULT FALSE,
        current_chat_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create customers table
    await query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create chat_sessions table
    await query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        agent_id INT,
        customer_id INT,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP NULL,
        status ENUM('active', 'ended') DEFAULT 'active',
        INDEX idx_agent_id (agent_id),
        INDEX idx_customer_id (customer_id)
      )
    `)

    // Create messages table
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT PRIMARY KEY AUTO_INCREMENT,
        chat_session_id INT NOT NULL,
        sender_type ENUM('agent', 'customer') NOT NULL,
        sender_id INT NOT NULL,
        content TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_chat_session_id (chat_session_id)
      )
    `)

    // Create tickets table
    await query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        service ENUM('PCC', 'OCI', 'Others') NOT NULL,
        description TEXT NOT NULL,
        status ENUM('open', 'in_progress', 'resolved') DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log("Database tables initialized successfully")
  } catch (error) {
    console.error("Error initializing database:", error)
    throw error
  }
}

// Database helper functions
export async function getAvailableAgent() {
  const agents = await query(`
    SELECT * FROM agents 
    WHERE online_status = true AND current_chat_count < 4 
    ORDER BY current_chat_count ASC 
    LIMIT 1
  `)
  return Array.isArray(agents) && agents.length > 0 ? agents[0] : null
}

export async function createChatSession(agentId: number, customerId: number) {
  const result = await query(`INSERT INTO chat_sessions (agent_id, customer_id) VALUES (?, ?)`, [agentId, customerId])

  // Update agent's chat count
  await query(`UPDATE agents SET current_chat_count = current_chat_count + 1 WHERE id = ?`, [agentId])

  // Get the created session
  const sessions = await query(`SELECT * FROM chat_sessions WHERE id = ?`, [(result as any).insertId])

  return Array.isArray(sessions) ? sessions[0] : null
}

export async function endChatSession(sessionId: number) {
  await query(`UPDATE chat_sessions SET ended_at = NOW(), status = 'ended' WHERE id = ?`, [sessionId])

  // Get the updated session to get agent_id
  const session = await query(`SELECT * FROM chat_sessions WHERE id = ?`, [sessionId])

  if (Array.isArray(session) && session.length > 0) {
    // Decrease agent's chat count
    await query(`UPDATE agents SET current_chat_count = current_chat_count - 1 WHERE id = ?`, [session[0].agent_id])
  }

  return Array.isArray(session) ? session[0] : null
}

// Alternative direct connection method (like your example)
export async function createDirectConnection() {
  try {
    // Simplified config for direct connections
    const directConfig = {
      host: process.env.DB_HOST || "194.163.45.105",
      port: Number.parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "marketingOwner",
      password: process.env.DB_PASSWORD || "M@rketing123!",
      database: process.env.DB_NAME || "MarketingDb",
    }

    console.log("Creating direct connection with config:", {
      host: directConfig.host,
      port: directConfig.port,
      user: directConfig.user,
      database: directConfig.database,
      passwordProvided: !!directConfig.password,
    })

    const connection = await mysql.createConnection(directConfig)
    return connection
  } catch (error) {
    console.error("Direct connection failed:", error)
    throw error
  }
}
