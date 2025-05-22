import mongoose from 'mongoose';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { isEmailDeliverable } from '../utils/validateEmail.js';
import { sendEmailVerificationLink } from '../utils/emailService.js';
import { parsePhoneNumberFromString } from 'libphonenumber-js'; // FOR VALID PHONE NUMBERS
import {JWT_SECRET, JWT_EXPIRES_IN, GOOGLE_CLIENT_ID} from '../config/env.js';

export const signUp = async (req, res, next) => {
  const lang = req.query.lang === 'ar' ? 'ar' : 'en';
  const t = (en, ar) => lang === 'ar' ? ar : en;

  try {
    const { username, email, password, confirmPassword, phoneNumber, gender, country, DateOfBirth, ethnicity } = req.body;

    if (!username || username.length < 5) {
      return res.status(400).json({ error: t("Username must be at least 5 characters", "يجب أن يكون اسم المستخدم 5 أحرف على الأقل") });
    }

    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ error: t("Username can only contain letters, numbers, periods, and underscores", "يمكن أن يحتوي اسم المستخدم فقط على حروف وأرقام ونقاط وشرطات سفلية") });
    }

    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: t("Please enter a valid email address", "يرجى إدخال بريد إلكتروني صالح") });
    }

    const deliverable = await isEmailDeliverable(email);
    if (!deliverable) {
      return res.status(400).json({ error: t("Email is invalid or undeliverable", "البريد الإلكتروني غير صالح أو غير موجود") });
    }

    const parsedPhone = parsePhoneNumberFromString(phoneNumber);
    if (!parsedPhone || !parsedPhone.isValid()) {
      return res.status(400).json({ error: t("Invalid phone number format", "تنسيق رقم الهاتف غير صالح") });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: t("Passwords do not match", "كلمتا المرور غير متطابقتين") });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: t("Password must include uppercase, lowercase, number, and symbol", "يجب أن تحتوي كلمة المرور على حرف كبير وصغير ورقم ورمز") });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = jwt.sign(
      { username, email, password: hashedPassword, phoneNumber, gender, country, DateOfBirth, ethnicity },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    await sendEmailVerificationLink(email, username, token);

    res.status(200).json({
      success: true,
      message: t("Verification email sent. Please check your inbox.", "تم إرسال بريد التحقق. يرجى التحقق من صندوق الوارد.")
    });
  } catch (error) {
    next(error);
  }
};

export const logIn = async (req, res, next) => {
  const lang = req.query.lang === 'ar' ? 'ar' : 'en';

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        error: lang === 'ar' ? "المستخدم غير موجود" : "User Not Found"
      });
    }

    if (user.authProvider !== "local") {
      return res.status(400).json({
        error: lang === 'ar'
          ? `يرجى تسجيل الدخول باستخدام ${user.authProvider}`
          : `Please log in with ${user.authProvider}.`
      });
    }

    // ✅ Require email verification
    if (!user.isEmailVerified) {
      return res.status(403).json({
        error: lang === 'ar'
          ? "يرجى التحقق من بريدك الإلكتروني قبل تسجيل الدخول"
          : "Please verify your email before logging in"
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: lang === 'ar' ? "كلمة المرور غير صحيحة" : "Invalid password"
      });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({
      success: true,
      message: lang === 'ar' ? "تم تسجيل الدخول بنجاح" : "User logged in successfully",
      data: { token, user }
    });

  } catch (error) {
    next(error);
  }
};

export const logOut = async (req, res, next) => {
  const lang = req.query.lang === 'ar' ? 'ar' : 'en';

  try {
    res.status(200).json({
      success: true,
      message: lang === 'ar'
        ? "تم تسجيل الخروج بنجاح. يرجى حذف التوكن من الجهاز"
        : "User logged out successfully. Please clear token on client-side."
    });
  } catch (error) {
    next(error);
  }
};