const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendEnrollmentConfirmation({ to, name, plan, courses, amount, utr, receiptId }) {
  const courseList = courses.map(c => `• ${c.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`).join('\n');
  
  await transporter.sendMail({
    from: `"LPU Summer Exchange" <${process.env.GMAIL_USER}>`,
    to,
    subject: '🎉 Enrollment Received — LPU Summer Exchange',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
        <div style="background: #1A1A2E; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #E8671A; font-size: 24px; margin: 0;">LPU Summer Exchange</h1>
          <p style="color: #F5EDD6; margin: 8px 0 0;">A Joint Initiative by Eduniketan × LPU</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1A1A2E;">Hi ${name}! 🎉</h2>
          <p style="color: #555;">Your enrollment has been received. We'll verify your payment and activate your course access within 24 hours.</p>
          
          <div style="background: #F5EDD6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1A1A2E; margin-top: 0;">Enrollment Summary</h3>
            <p><strong>Plan:</strong> ${plan.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            <p><strong>Courses:</strong><br>${courseList}</p>
            <p><strong>Amount:</strong> ₹${amount}</p>
            <p><strong>UTR Number:</strong> ${utr}</p>
            <p><strong>Receipt ID:</strong> ${receiptId}</p>
          </div>

          <div style="background: #E8F5E9; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #2D6A4F;">📱 <strong>Next Step:</strong> Join your batch WhatsApp group for class schedules and joining links. Contact us at +91 9161412190.</p>
          </div>

          <p style="color: #555; font-size: 14px;">For support, contact us at <a href="mailto:support@eduniketanpvtltd.com" style="color: #E8671A;">support@eduniketanpvtltd.com</a> or WhatsApp <a href="https://wa.me/919161412190" style="color: #E8671A;">+91 9161412190</a>.</p>
        </div>
      </div>
    `,
  });
}

async function sendSupportEmail({ name, email, message }) {
  await transporter.sendMail({
    from: `"LPU Summer Exchange Support" <${process.env.GMAIL_USER}>`,
    to: process.env.SUPPORT_EMAIL || process.env.GMAIL_USER,
    subject: `Support Request from ${name}`,
    html: `
      <h2>New Support Request</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `,
    replyTo: email,
  });

  // Auto-reply to user
  await transporter.sendMail({
    from: `"LPU Summer Exchange" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'We received your message — LPU Summer Exchange',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #E8671A;">Hi ${name},</h2>
        <p>Thanks for reaching out. We've received your message and will get back to you within 24 hours.</p>
        <p>For urgent queries, WhatsApp us at <strong>+91 9161412190</strong>.</p>
        <p style="color: #888;">— LPU Summer Exchange Support Team</p>
      </div>
    `,
  });
}

module.exports = { sendEnrollmentConfirmation, sendSupportEmail };
