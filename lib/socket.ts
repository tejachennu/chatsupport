import type { Server as NetServer } from "http"
import { Server as ServerIO } from "socket.io"
import { query } from "./db"

export type NextApiResponseServerIO = {
  socket: {
    server: NetServer & {
      io: ServerIO
    }
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export function initializeSocket(server: NetServer) {
  if (!(server as any).io) {
    console.log("Initializing Socket.IO server...")

    const io = new ServerIO(server, {
      path: "/api/socket/io",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    })

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id)

      // Join a chat room
      socket.on("join-chat", (sessionId: string) => {
        socket.join(`chat-${sessionId}`)
        console.log(`Socket ${socket.id} joined chat-${sessionId}`)
      })

      // Handle new messages
      socket.on("send-message", async (data) => {
        try {
          const { sessionId, content, senderType, senderId } = data

          // Save message to database
          const result = await query(
            `INSERT INTO messages (chat_session_id, sender_type, sender_id, content) VALUES (?, ?, ?, ?)`,
            [sessionId, senderType, senderId, content],
          )

          // Get the created message with sender info
          const message = await query(
            `
            SELECT 
              m.*,
              CASE 
                WHEN m.sender_type = 'agent' THEN a.name
                WHEN m.sender_type = 'customer' THEN c.name
              END as sender_name
            FROM messages m
            LEFT JOIN agents a ON m.sender_type = 'agent' AND m.sender_id = a.id
            LEFT JOIN customers c ON m.sender_type = 'customer' AND m.sender_id = c.id
            WHERE m.id = ?
          `,
            [(result as any).insertId],
          )

          const messageData = Array.isArray(message) ? message[0] : null

          if (messageData) {
            // Broadcast message to all clients in the chat room
            io.to(`chat-${sessionId}`).emit("new-message", messageData)
          }
        } catch (error) {
          console.error("Error sending message:", error)
          socket.emit("message-error", { error: "Failed to send message" })
        }
      })

      // Handle typing indicators
      socket.on("typing", (data) => {
        socket.to(`chat-${data.sessionId}`).emit("user-typing", {
          senderType: data.senderType,
          senderName: data.senderName,
        })
      })

      socket.on("stop-typing", (data) => {
        socket.to(`chat-${data.sessionId}`).emit("user-stop-typing", {
          senderType: data.senderType,
        })
      })

      // Handle agent status updates
      socket.on("agent-online", async (agentId: number) => {
        try {
          await query(`UPDATE agents SET online_status = true WHERE id = ?`, [agentId])
          socket.broadcast.emit("agent-status-changed", { agentId, online: true })
        } catch (error) {
          console.error("Error updating agent status:", error)
        }
      })

      socket.on("agent-offline", async (agentId: number) => {
        try {
          await query(`UPDATE agents SET online_status = false WHERE id = ?`, [agentId])
          socket.broadcast.emit("agent-status-changed", { agentId, online: false })
        } catch (error) {
          console.error("Error updating agent status:", error)
        }
      })

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id)
      })
    })
    ;(server as any).io = io
  }

  return (server as any).io
}
