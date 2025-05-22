import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { JWT_SECRET } from '../config/env.js';

export const verifyEmail = async (req, res) => {
  const token = req.query.token;
  const lang = req.query.lang === 'ar' ? 'ar' : 'en';
  const t = (en, ar) => lang === 'ar' ? ar : en;

  if (!token) {
    return res.status(400).json({ error: t("Verification token is missing", "رمز التحقق مفقود") });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { username, email, password, phoneNumber, gender, country, DateOfBirth, ethnicity } = decoded;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: t("Account already exists", "الحساب موجود بالفعل") });
    }

    const newUser = new User({
      username,
      email,
      password,
      phoneNumber,
      gender,
      country,
      DateOfBirth,
      ethnicity,
      authProvider: "local",
      isVerified: true
    });

    await newUser.save();

    // ✅ No redirect here — just send success
    return res.status(200).json({
      success: true,
      message: t("Email verified and account created successfully", "تم التحقق من البريد الإلكتروني وإنشاء الحساب بنجاح")
    });

  } catch (err) {
    return res.status(400).json({
      error: t("Invalid or expired verification token", "رمز التحقق غير صالح أو منتهي")
    });
  }
};
