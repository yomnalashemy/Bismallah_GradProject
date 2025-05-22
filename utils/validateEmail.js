import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export const isEmailDeliverable = async (email) => {
  try {
    const res = await axios.get(`http://apilayer.net/api/check`, {
      params: {
        access_key: process.env.MAILBOXLAYER_API_KEY,
        email,
        format: 1, // keep this
        smtp: 0    // disable this on free tier
      }
    });

    return res.data.format_valid; // only check format
  } catch (err) {
    console.error("Email validation failed:", err.message);
    return true; // don't block the user if MailboxLayer fails
  }
};