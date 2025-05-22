import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { JWT_SECRET } from '../config/env.js';

export const verifyEmail = async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).send("Missing token");

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    let existingUser = await User.findOne({ email: decoded.email });

    if (existingUser) {
      if (!existingUser.isVerified) {
        existingUser.isVerified = true;
        await existingUser.save();
      }
    } else {
      await User.create({
        username: decoded.username,
        email: decoded.email,
        password: decoded.password,
        phoneNumber: decoded.phoneNumber,
        gender: decoded.gender,
        country: decoded.country,
        DateOfBirth: decoded.DateOfBirth,
        ethnicity: decoded.ethnicity,
        authProvider: "local",
        isVerified: true
      });
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verified</title>
       <h2>Your email has been verified!</h2>
<p>✅ Now tap the button below to open the Lupira app:</p>
<a href="lupira://verify-email?token=${token}" style="padding: 10px 20px; background-color: #6A5ACD; color: #fff; border-radius: 5px; text-decoration: none;">
  Open App
</a>
      </head>
      <body>
        <h2>✅ Your email has been verified!</h2>
        <p>If nothing happens, <a href="lupira://verify-email?token=${token}">tap here</a>.</p>
      </body>
      </html>
    `);

  } catch (err) {
    console.error("Email verification error:", err);
    return res.status(400).send("Invalid or expired verification token");
  }
};
