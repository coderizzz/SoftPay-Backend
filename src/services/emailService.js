import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const sendEmailWithAttachment = async ({ to, subject, html, attachmentPath }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const mailOptions = {
    from: process.env.MAIL_FROM,
    to,
    subject,
    html,
    attachments: attachmentPath
      ? [{ filename: "monthly_report.pdf", path: attachmentPath }]
      : [],
  };

  await transporter.sendMail(mailOptions);
  console.log(`✅ Email sent to ${to}`);
};

export default sendEmailWithAttachment;