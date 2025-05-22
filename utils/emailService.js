import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { JWT_SECRET} from '../config/env.js'; // Add FRONTEND_URL in .env
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

export const sendEmailVerificationLink = async (email, username, userId) => {
  const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '1h' });
  const verifyUrl = `https://lupira.onrender.com/api/auth/deeplink?to=verify-email&token=${token}`;

  const mailOptions = {
    from: `Lupira <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email - Lupira",
    html: `
      <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; line-height: 1.6;">
        <div style="background-color: #6A5ACD; color: #ffffff; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1>Verify Your Email</h1>
        </div>
        <div style="border: 1px solid #ddd; padding: 20px;">
          <p style="color: #555;">Hello <strong>${username}</strong>,</p>
          <p style="color: #555;">Thank you for signing up with <strong>Lupira</strong>! Please verify your email address by clicking the button below:</p>

          <a href="${verifyUrl}" style="display:inline-block; margin-top:15px; padding:10px 15px; background-color: #28a745; color:#ffffff; text-decoration:none; border-radius:5px;">
            Verify Email
          </a>

          <p style="color: #555;">This link will expire in 1 hour. If you did not create an account, please ignore this message.</p>

          <p style="margin-top: 20px; color: #555;">Warm Regards,<br><strong>The Lupira Team</strong></p>
        </div>

        <footer style="background-color: #f5f5f5; padding: 10px; text-align: center; color: #888; font-size: 12px;">
          © ${new Date().getFullYear()} Lupira. All rights reserved.
        </footer>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log("Verification email sent to:", email);
};

export const sendResetPasswordEmail = async (email, username, resetToken) => {
    const resetLink = `https://lupira.onrender.com/api/auth/deeplink?to=reset-password&token=${resetToken}`;

    const mailOptions = {
        from: `Lupira <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Reset Your Password",
        html: `
             <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; line-height: 1.6;">
        <div style="background-color: #6A5ACD; color: #ffffff; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1>Password Reset Request</h1>
        </div>
        <div style="border: 1px solid #ddd; padding: 20px;">
            <p style="color: #555;">Hello <strong>${username}</strong>,</p>
            <p style="color: #555;">We received a request to reset your password. Click the button below to reset it:</p>
            
            <a href="${resetLink}" style="display:inline-block; margin-top:15px; padding:10px 15px; background-color: #6A5ACD; color:#ffffff; text-decoration:none; border-radius:5px;">Reset Password</a>

            <p style="color: #555;">If you didn't request this, please ignore this email.</p>

            <p style="margin-top: 20px; color: #555;">Warm Regards,<br><strong>The Lupira Team</strong></p>
        </div>

        <footer style="background-color: #f5f5f5; padding: 10px; text-align: center; color: #888; font-size: 12px;">
            © ${new Date().getFullYear()} Lupira. All rights reserved.
        </footer>
    </div>
        `
    };

    await transporter.sendMail(mailOptions);
};

export const sendEmailChangeVerificationLink = async (email, userId) => {
  const token = jwt.sign({ userId, email, changeEmail: true }, JWT_SECRET, { expiresIn: '1h' });
  const verifyUrl = `https://lupira.onrender.com/api/auth/deeplink?to=verify-email&token=${token}`;

  const mailOptions = {
    from: `Lupira <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Confirm Your New Email",
    html: `
      <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; line-height: 1.6;">
        <div style="background-color: #6A5ACD; color: #ffffff; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1>Confirm Email Change</h1>
        </div>
        <div style="border: 1px solid #ddd; padding: 20px;">
          <p>Hello,</p>
          <p>You requested to change your email on <strong>Lupira</strong>. Please confirm it by clicking below:</p>
          <a href="${verifyUrl}" style="display:inline-block; margin-top:15px; padding:10px 15px; background-color: #6A5ACD; color:#ffffff; text-decoration:none; border-radius:5px;">
            Confirm New Email
          </a>
          <p>This link is valid for 1 hour.</p>
        </div>
        <footer style="background-color: #f5f5f5; padding: 10px; text-align: center; color: #888; font-size: 12px;">
          © ${new Date().getFullYear()} Lupira. All rights reserved.
        </footer>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};