import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendTicketConfirmation(
  to: string,
  ticketId: number,
  name: string,
  service: string,
  description: string,
) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: `Ticket Confirmation - #${ticketId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Support Ticket Confirmation</h2>
          <p>Dear ${name},</p>
          <p>Thank you for contacting our support team. Your ticket has been successfully created.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Ticket Details:</h3>
            <p><strong>Ticket ID:</strong> #${ticketId}</p>
            <p><strong>Service:</strong> ${service}</p>
            <p><strong>Description:</strong> ${description}</p>
            <p><strong>Status:</strong> Open</p>
          </div>
          
          <p>Our support team will review your request and get back to you as soon as possible.</p>
          <p>You can reference this ticket using ID: <strong>#${ticketId}</strong></p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Email sending failed:", error)
    return { success: false, error: error.message }
  }
}

export async function sendChatTranscript(
  to: string,
  customerName: string,
  agentName: string,
  messages: any[],
  sessionId: string,
) {
  try {
    const messagesHtml = messages
      .map(
        (msg) => `
        <div style="margin: 10px 0; padding: 10px; background-color: ${
          msg.sender_type === "customer" ? "#e3f2fd" : "#f3e5f5"
        }; border-radius: 5px;">
          <strong>${msg.sender_type === "customer" ? customerName : agentName}:</strong>
          <p style="margin: 5px 0 0 0;">${msg.content}</p>
          <small style="color: #666;">${new Date(msg.timestamp).toLocaleString()}</small>
        </div>
      `,
      )
      .join("")

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: `Chat Transcript - Session ${sessionId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Chat Transcript</h2>
          <p>Dear ${customerName},</p>
          <p>Thank you for using our chat support. Here's a transcript of your conversation:</p>
          
          <div style="border: 1px solid #ddd; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Conversation with ${agentName}</h3>
            ${messagesHtml}
          </div>
          
          <p>If you need further assistance, please don't hesitate to contact us again.</p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Chat transcript sent:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Chat transcript sending failed:", error)
    return { success: false, error: error.message }
  }
}
