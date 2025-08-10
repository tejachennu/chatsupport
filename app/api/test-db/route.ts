import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"

export async function GET(request: NextRequest) {
  try {
    console.log("Testing database connection with mysql2/promise...")

    // Debug environment variables
    console.log("Environment variables check:", {
      DB_HOST: process.env.DB_HOST || "194.163.45.105",
      DB_PORT: process.env.DB_PORT || "3306",
      DB_USER: process.env.DB_USER || "marketingOwner",
      DB_NAME: process.env.DB_NAME || "MarketingDb",
      DB_PASSWORD_PROVIDED: !!process.env.DB_PASSWORD,
      DB_PASSWORD_LENGTH: process.env.DB_PASSWORD?.length || 0,
    })

    // Simplified config for direct connection test
    const dbConfig = {
      host: process.env.DB_HOST || "194.163.45.105",
      port: Number.parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "marketingOwner",
      password: process.env.DB_PASSWORD || "M@rketing123!",
      database: process.env.DB_NAME || "MarketingDb",
    }

    console.log("Attempting connection with config:", {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database,
      passwordProvided: !!dbConfig.password,
      passwordLength: dbConfig.password?.length || 0,
    })

    // Create direct connection
    const connection = await mysql.createConnection(dbConfig)

    try {
      // Test basic connection
      await connection.ping()
      console.log("Basic connection successful")

      // Test a simple query
      const [testResult] = await connection.execute("SELECT 1 as test, ? as password_test", ["password_working"])
      console.log("Test query result:", testResult)

      // Test database and table access
      const [databases] = await connection.execute("SHOW DATABASES")
      console.log("Available databases:", databases)

      // Try to use the database
      await connection.execute(`USE ${dbConfig.database}`)

      // Show tables
      const [tables] = await connection.execute("SHOW TABLES")
      console.log("Available tables:", tables)

      // Get table counts if tables exist
      const tableCounts = {
        agents: 0,
        customers: 0,
        tickets: 0,
        sessions: 0,
        messages: 0,
      }

      // Check each table
      for (const [tableName, countKey] of [
        ["agents", "agents"],
        ["customers", "customers"],
        ["tickets", "tickets"],
        ["chat_sessions", "sessions"],
        ["messages", "messages"],
      ]) {
        try {
          const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`)
          tableCounts[countKey as keyof typeof tableCounts] = Array.isArray(countResult)
            ? (countResult[0] as any).count
            : 0
        } catch (e) {
          console.log(`Table ${tableName} not accessible:`, (e as Error).message)
          // Try to create the table
          try {
            if (tableName === "agents") {
              await connection.execute(`
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
              console.log("Created agents table")
            }
            // Add other table creation logic as needed
          } catch (createError) {
            console.log(`Failed to create table ${tableName}:`, (createError as Error).message)
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: "Database connection successful with mysql2/promise",
        testQuery: testResult,
        databases: databases,
        tables: tables,
        tableCounts,
        timestamp: new Date().toISOString(),
        database: {
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          user: dbConfig.user,
        },
        mysqlVersion: "Using mysql2/promise with proper configuration",
      })
    } finally {
      // Always close the connection
      await connection.end()
    }
  } catch (error) {
    console.error("Database test error:", error)

    // Ensure we always return valid JSON
    const errorMessage = error instanceof Error ? error.message : "Unknown database error"
    const errorCode = (error as any)?.code || "UNKNOWN_ERROR"
    const errorStack = error instanceof Error ? error.stack : undefined

    return NextResponse.json(
      {
        success: false,
        error: "Database connection failed",
        errorCode: errorCode,
        details: errorMessage,
        stack: errorStack,
        timestamp: new Date().toISOString(),
        database: {
          host: process.env.DB_HOST || "194.163.45.105",
          port: process.env.DB_PORT || "3306",
          database: process.env.DB_NAME || "MarketingDb",
          user: process.env.DB_USER || "marketingOwner",
        },
        environmentCheck: {
          DB_HOST: !!process.env.DB_HOST,
          DB_PORT: !!process.env.DB_PORT,
          DB_USER: !!process.env.DB_USER,
          DB_PASSWORD: !!process.env.DB_PASSWORD,
          DB_NAME: !!process.env.DB_NAME,
        },
        troubleshooting: {
          possibleCauses: [
            "Environment variables not properly set",
            "Database credentials incorrect",
            "Database server not accessible from your IP",
            "User permissions insufficient",
          ],
          nextSteps: [
            "Check your .env.local file",
            "Verify database credentials",
            "Test connection from database client",
            "Check firewall/network settings",
          ],
        },
      },
      { status: 500 },
    )
  }
}
