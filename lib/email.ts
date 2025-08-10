import nodemailer from "nodemailer"

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendTicketConfirmation(
  email: string,
  name: string,
  ticketId: number,
  service: string,
  description: string,
) {
  // Skip email sending if SMTP is not configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("SMTP not configured, skipping email send")
    return true
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || "support@company.com",
    to: email,
    subject: `Support Ticket #${ticketId} - Confirmation`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Support Ticket Confirmation</h2>
        <p>Dear ${name},</p>
        <p>Thank you for contacting our support team. Your ticket has been received and assigned ID: <strong>#${ticketId}</strong></p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Ticket Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Ticket ID:</strong> #${ticketId}</li>
            <li><strong>Service:</strong> ${service}</li>
            <li><strong>Description:</strong> ${description}</li>
            <li><strong>Status:</strong> Open</li>
            <li><strong>Created:</strong> ${new Date().toLocaleString()}</li>
          </ul>
        </div>
        
        <p>Our team will review your request and get back to you as soon as possible.</p>
        
        <p>Best regards,<br>Customer Support Team</p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error("Email sending failed:", error)
    throw error
  }
}
