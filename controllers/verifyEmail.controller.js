import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { JWT_SECRET } from '../config/env.js';

export const verifyEmail = async (req, res) => {
  const token = req.query.token;
  const lang = req.query.lang === 'ar' ? 'ar' : 'en';
  const t = (en, ar) => lang === 'ar' ? ar : en;

  if (!token) return res.status(400).json({ error: t("Verification token is missing", "رمز التحقق مفقود") });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.changeEmail) {
      const user = await User.findById(decoded.userId);
      if (!user) return res.status(404).json({ error: t("User not found", "المستخدم غير موجود") });

      user.email = decoded.email;
      await user.save();

      return res.redirect(`https://lupira.onrender.com/api/auth/deeplink?to=verify-email&token=${token}`);
    }

    const existing = await User.findOne({ email: decoded.email });
    if (existing) return res.status(400).json({ error: t("Account already exists", "الحساب موجود بالفعل") });

    const newUser = new User({
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

    await newUser.save();
    return res.send(`
  <html>
    <head><title>Email Verified</title></head>
    <body style="font-family: sans-serif; text-align: center; padding-top: 40px;">
      <h2>✅ Your email has been verified!</h2>
      <p>You can now return to the app and log in.</p>
    </body>
  </html>
`);


  } catch (err) {
    return res.status(400).json({ error: t("Invalid or expired verification token", "رمز التحقق غير صالح أو منتهي") });
  }
};