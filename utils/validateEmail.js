import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export const isEmailDeliverable = async (email) => {
  try {
    const res = await axios.get(`http://apilayer.net/api/check`, {
      params: {
        access_key: process.env.MAILBOXLAYER_API_KEY,
        email,
        smtp: 1,
        format: 1
      }
    });

    return res.data.smtp_check && res.data.format_valid;
  } catch (err) {
    console.error("Email validation failed:", err.message);
    return false;
  }
};

