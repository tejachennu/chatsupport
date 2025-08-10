import nodemailer from "nodemailer"

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendTicketConfirmation(to: string, ticketId: number, subject: string) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to,
      subject: `Ticket Confirmation - ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Support Ticket Created</h2>
          <p>Thank you for contacting our support team. Your ticket has been created successfully.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Ticket Details:</h3>
            <p><strong>Ticket ID:</strong> #${ticketId}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Status:</strong> Open</p>
          </div>
          
          <p>Our support team will review your request and respond as soon as possible.</p>
          <p>You can reference this ticket using ID: <strong>#${ticketId}</strong></p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log("Email sent successfully:", result.messageId)
    return result
  } catch (error) {
    console.error("Failed to send email:", error)
    throw error
  }
}

export async function sendChatTranscript(to: string, sessionId: string, messages: any[]) {
  try {
    const messagesHtml = messages
      .map(
        (msg) => `
        <div style="margin: 10px 0; padding: 10px; background-color: ${
          msg.sender_type === "customer" ? "#e3f2fd" : "#f3e5f5"
        }; border-radius: 5px;">
          <strong>${msg.sender_name}:</strong> ${msg.content}
          <br>
          <small style="color: #666;">${new Date(msg.created_at).toLocaleString()}</small>
        </div>
      `,
      )
      .join("")

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to,
      subject: `Chat Transcript - Session ${sessionId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Chat Transcript</h2>
          <p>Here is the transcript of your chat session:</p>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Session ID: ${sessionId}</h3>
            ${messagesHtml}
          </div>
          
          <p>Thank you for using our support chat service.</p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log("Chat transcript sent successfully:", result.messageId)
    return result
  } catch (error) {
    console.error("Failed to send chat transcript:", error)
    throw error
  }
}
