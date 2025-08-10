import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendTicketConfirmation(ticketData: {
  id: number
  name: string
  email: string
  service: string
  description: string
}) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: ticketData.email,
      subject: `Support Ticket #${ticketData.id} - Confirmation`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Support Ticket Confirmation</h2>
          <p>Dear ${ticketData.name},</p>
          <p>Thank you for contacting our support team. We have received your ticket and will respond within 24 hours.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Ticket Details:</h3>
            <p><strong>Ticket ID:</strong> #${ticketData.id}</p>
            <p><strong>Service:</strong> ${ticketData.service}</p>
            <p><strong>Description:</strong> ${ticketData.description}</p>
          </div>
          
          <p>If you have any additional information or questions, please reply to this email with your ticket ID.</p>
          <p>Best regards,<br>Customer Support Team</p>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error("Error sending ticket confirmation:", error)
    return false
  }
}

export async function sendChatTranscript(customerEmail: string, customerName: string, messages: any[]) {
  try {
    const transcript = messages
      .map((msg) => `[${new Date(msg.created_at).toLocaleString()}] ${msg.sender_name}: ${msg.content}`)
      .join("\n")

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: customerEmail,
      subject: "Chat Transcript - Customer Support",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Chat Transcript</h2>
          <p>Dear ${customerName},</p>
          <p>Thank you for using our live chat support. Here is a transcript of your conversation:</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <pre style="white-space: pre-wrap; font-family: monospace;">${transcript}</pre>
          </div>
          
          <p>If you need further assistance, please don't hesitate to contact us.</p>
          <p>Best regards,<br>Customer Support Team</p>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error("Error sending chat transcript:", error)
    return false
  }
}
