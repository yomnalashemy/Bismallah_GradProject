import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, //Gmail app password
    },
    tls: { rejectUnauthorized: false },
});

export const sendWelcomeEmail = async (email, username) => {
    try {
        const mailOptions = {
            from: `Lupira <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Welcome to Lupira!",
            html: `
                <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; line-height: 1.6;">
                    <div style="background-color: #6A5ACD; color: #ffffff; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1>Welcome to Lupira, ${username}! 🎉</h2>
                    </div>
                    <div style="border: 1px solid #ddd; padding: 20px;">
                        <h3 style="color: #333;">Hello ${username},</h3>
                        <p style="color: #555;">Thank you for joining <strong>Lupira</strong>! We're thrilled to have you in our community dedicated to supporting your journey.</p>
                        
                        <p style="color: #555;">Here’s what you can expect:</p>
                        <ul style="color: #555;">
                            <li>🔹 Personalized Diagnosis</li>
                            <li>🔹 Easy symptom monitoring & insights</li>
                            <li>🗓️ Review your detection history</li>
                            <li>📊 Learn more about Lupus</li>
                        </ul>

                        <p style="color: #555;">If you ever need support, our team is just an email away.</p>
                        
                        <a href="https://lupira.app" style="display:inline-block; margin-top:15px; padding:10px 15px; background-color: #6A5ACD; color:#ffffff; text-decoration:none; border-radius:5px;">Get Started</a>

                        <p style="margin-top: 20px; color: #555;">Warm regards,<br><strong>The Lupira Team</strong></p>
                    </div>

                    <footer style="background-color: #f5f5f5; padding: 10px; text-align: center; color: #888; font-size: 12px;">
                        © ${new Date().getFullYear()} Lupira. All rights reserved.
                    </footer>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log("Welcome email sent to:", email);
    } catch (error) {
        console.error("Failed to send email:", error.message);
        
        // Nodemailer error code for undeliverable addresses is typically 550
        if (error.responseCode === 550 || error.responseCode === 553) {
            throw new Error("Email not found or undeliverable");
        }
        throw error;  // For other errors
    }
};

export const sendResetPasswordEmail = async (email, username, resetToken) => {
    const resetLink = `https://Lupira.com/reset-password/${resetToken}`;

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

export const sendEmailChangeConfirmation = async (email, username) => {
    const mailOptions = {
        from: `Lupira <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your Lupira Email Was Updated",
        html: `
            <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; line-height: 1.6;">
                <div style="background-color: #6A5ACD; color: #ffffff; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h2>Email Updated</h2>
                </div>
                <div style="border: 1px solid #ddd; padding: 20px;">
                    <p>Hello <strong>${username}</strong>,</p>
                    <p>This is a confirmation that your email address on Lupira has been changed successfully.</p>
                    <p>If this wasn’t you, please contact our support team immediately.</p>
                    <p style="margin-top: 20px;">Warm Regards,<br><strong>The Lupira Team</strong></p>
                </div>
                <footer style="background-color: #f5f5f5; padding: 10px; text-align: center; color: #888; font-size: 12px;">
                    © ${new Date().getFullYear()} Lupira. All rights reserved.
                </footer>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};