import { OAuth2Client } from 'google-auth-library';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
import User from '../models/user.model.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { isEmailDeliverable } from '../utils/validateEmail.js';
import { sendEmailVerificationLink } from '../utils/emailService.js';
import { parsePhoneNumberFromString } from 'libphonenumber-js'; // FOR VALID PHONE NUMBERS
import {JWT_SECRET, JWT_EXPIRES_IN} from '../config/env.js';

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

export const signUpWithGoogle = async (req, res, next) => {
  const lang = req.query.lang === 'ar' ? 'ar' : 'en';
  const t = (en, ar) => lang === 'ar' ? ar : en;

  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: t("Google token is required", "مطلوب رمز Google") });

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name } = ticket.getPayload();

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: t("User already exists", "المستخدم موجود بالفعل") });

    const signupToken = jwt.sign({ email, source: "google" }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      success: true,
      message: t("Redirect to complete profile", "يرجى إكمال الملف الشخصي"),
      token: signupToken
    });
  } catch (error) {
    next(error);
  }
};

export const signUpWithFacebook = async (req, res, next) => {
  const lang = req.query.lang === 'ar' ? 'ar' : 'en';
  const t = (en, ar) => lang === 'ar' ? ar : en;

  try {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json({ error: t("Facebook access token is required", "مطلوب رمز Facebook") });

    const fbRes = await axios.get(`https://graph.facebook.com/me?fields=name,email&access_token=${accessToken}`);
    const { email, name } = fbRes.data;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: t("User already exists", "المستخدم موجود بالفعل") });

    const signupToken = jwt.sign({ email, source: "facebook" }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      success: true,
      message: t("Redirect to complete profile", "يرجى إكمال الملف الشخصي"),
      token: signupToken
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
export const loginWithGoogle = async (req, res, next) => {
  try {
    const { token } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const { email } = ticket.getPayload();
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ error: "User not found" });

    const jwtToken = generateToken(user._id);
    res.status(200).json({ success: true, token: jwtToken, user });
  } catch (error) {
    next(error);
  }
};

export const loginWithFacebook = async (req, res, next) => {
  try {
    const { accessToken } = req.body;

    const fbRes = await axios.get(`https://graph.facebook.com/me?fields=email&access_token=${accessToken}`);
    const { email } = fbRes.data;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const jwtToken = generateToken(user._id);
    res.status(200).json({ success: true, token: jwtToken, user });
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

export const completeProfile = async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    const token = authorization?.split(" ")[1];

    const lang = req.query.lang === 'ar' ? 'ar' : 'en';
    const t = (en, ar) => lang === 'ar' ? ar : en;

    const decoded = jwt.verify(token, JWT_SECRET);

    const {
      username, phoneNumber, gender,
      country, DateOfBirth, ethnicity
    } = req.body;

    const existing = await User.findOne({ email: decoded.email });
    if (existing) return res.status(400).json({ error: t("User already exists", "المستخدم موجود بالفعل") });

    const parsedPhone = parsePhoneNumberFromString(phoneNumber);
    if (!parsedPhone || !parsedPhone.isValid()) {
      return res.status(400).json({ error: t("Invalid phone number", "رقم الهاتف غير صالح") });
    }

    const newUser = await User.create({
      email: decoded.email,
      username,
      phoneNumber,
      gender,
      country,
      DateOfBirth,
      ethnicity,
      loginSource: decoded.source,
      password: null
    });

    const authToken = generateToken(newUser._id);
    res.status(201).json({ success: true, token: authToken, user: newUser });
  } catch (error) {
    next(error);
  }
};
