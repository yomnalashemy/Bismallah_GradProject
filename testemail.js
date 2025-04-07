import nodemailer from 'nodemailer';
import {EMAIL_USER, EMAIL_PASS} from './config/env.js';


// Load environment variables

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
    logger: true,
    debug: true,
});

const mailOptions = {
    from: `"Test Sender" <${process.env.EMAIL_USER}>`,
    to: "your-test-email@gmail.com", // Change this to a test email
    subject: "Test Email",
    text: "This is a test email from Nodemailer.",
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error("❌ Error sending test email:", error);
    } else {
        console.log(`✅ Test email sent successfully: ${info.response}`);
    }
});
