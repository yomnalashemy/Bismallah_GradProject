import { OAuth2Client } from 'google-auth-library';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
import User from '../models/user.model.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { sendEmailVerificationLink } from '../utils/emailService.js';
import { parsePhoneNumberFromString } from 'libphonenumber-js'; // FOR VALID PHONE NUMBERS
import {JWT_SECRET, JWT_EXPIRES_IN} from '../config/env.js';
import { t, translateProfileFields } from '../utils/translationHelper.js';


export const signUp = async (req, res, next) => {
  const lang = req.query.lang === 'ar' ? 'ar' : 'en';
  const t = (en, ar) => lang === 'ar' ? ar : en;
  
  try {
    const {
      username,
      email,
      password,
      confirmPassword,
      phoneNumber,
      gender,
      country,
      DateOfBirth,
      ethnicity
    } = req.body;

    

    if (!username || username.length < 5)
      return res.status(400).json({ error: t("Username must be at least 5 characters", "اسم المستخدم يجب أن يكون 5 أحرف على الأقل") });

    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    if (!usernameRegex.test(username))
      return res.status(400).json({ error: t("Username contains invalid characters", "اسم المستخدم يحتوي على رموز غير مسموح بها") });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ error: t("Invalid email", "البريد الإلكتروني غير صالح") });

    if (password !== confirmPassword)
      return res.status(400).json({ error: t("Passwords must match", "كلمتا المرور يجب أن تتطابق") });

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password))
      return res.status(400).json({ error: t("Password must include uppercase, lowercase, number, and symbol", "يجب أن تحتوي كلمة المرور على حرف كبير وصغير ورقم ورمز") });

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ error: t("Email already in use", "اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل") });
    }
    const existingPhone = await User.findOne({ phoneNumber});
    if (existingPhone) {
      return res.status(409).json({ error: t("Phone Number already in use", "رقم الهاتف مستخدم بالفعل") });
    }
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ error: t("Username already in use", "اسم المستخدم مستخدم بالفعل") });
    }

    // Translate values to English if in Arabic
    const genderEn = translateProfileFields.toEnglish(gender, 'gender');
    const countryEn = translateProfileFields.toEnglish(country, 'country');
    const ethnicityEn = translateProfileFields.toEnglish(ethnicity, 'ethnicity');

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = jwt.sign(
      {
        username,
        email,
        password: hashedPassword,
        phoneNumber,
        gender: genderEn,
        country: countryEn,
        DateOfBirth,
        ethnicity: ethnicityEn
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    await sendEmailVerificationLink(email, username, token);

    res.status(200).json({
      success: true,
      message: t("Verification email sent", "تم إرسال بريد التحقق")
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
  const t = (en, ar) => lang === 'ar' ? ar : en;

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: t("User Not Found", "المستخدم غير موجود") });
    }

    // Reject if social auth
    if (user.authProvider !== "local") {
      return res.status(400).json({
        error: t(`Please log in with ${user.authProvider}.`, `يرجى تسجيل الدخول باستخدام ${user.authProvider}`)
      });
    }

    // Require email verification
    if (!user.isVerified) {
      return res.status(403).json({
        error: t("Please verify your email before logging in", "يرجى التحقق من بريدك الإلكتروني قبل تسجيل الدخول")
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: t("Invalid password", "كلمة المرور غير صحيحة") });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({
      success: true,
      message: t("User logged in successfully", "تم تسجيل الدخول بنجاح"),
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
