import { OAuth2Client } from 'google-auth-library';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
import User from '../models/user.model.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { sendEmailVerificationLink } from '../utils/emailService.js';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env.js';
import { t, translateProfileFields } from '../utils/translationHelper.js';

export const signUp = async (req, res, next) => {
  const start = Date.now();
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

    // Validation
    const validateStart = Date.now();
    if (!username || username.length < 5)
      return res.status(400).json({ error: t("Username must be at least 5 characters", "اسم المستخدم يجب أن يكون 5 أحرف على الأقل") });
    if (username.length > 50)
      return res.status(400).json({ error: t("Username must be at most 50 characters", "اسم المستخدم يجب أن لا يزيد عن 50 حرفًا") });

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail))
      return res.status(400).json({ error: t("Invalid email format", "صيغة البريد الإلكتروني غير صالحة") });
    if (!normalizedEmail.endsWith('@gmail.com'))
      return res.status(400).json({ error: t("Email must be a Gmail address", "البريد الإلكتروني يجب أن يكون من Gmail") });

    if (!phoneNumber)
      return res.status(400).json({ error: t("Phone number is required", "رقم الهاتف مطلوب") });
    const parsedPhone = parsePhoneNumberFromString(phoneNumber);
    if (!parsedPhone || !parsedPhone.isValid())
      return res.status(400).json({ error: t("Invalid phone number", "رقم الهاتف غير صالح") });
    const nationalNumber = parsedPhone.nationalNumber;
    const countryCode = parsedPhone.country;
    // Validate digit length based on country (example ranges, adjust as needed)
    const minDigits = countryCode === 'US' ? 10 : 7; // US: 10 digits, others: at least 7
    const maxDigits = countryCode === 'US' ? 10 : 15; // US: 10 digits, others: up to 15
    if (nationalNumber.length < minDigits || nationalNumber.length > maxDigits)
      return res.status(400).json({ error: t(`Phone number must have ${minDigits}-${maxDigits} digits`, `رقم الهاتف يجب أن يحتوي على ${minDigits}-${maxDigits} أرقام`) });

    if (password !== confirmPassword)
      return res.status(400).json({ error: t("Passwords don't match", "كلمتا المرور غير متطابقتين") });

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password))
      return res.status(400).json({ error: t("Password must include uppercase, lowercase, number, and symbol", "كلمة المرور يجب أن تحتوي على حرف كبير، صغير، رقم، ورمز") });
    console.log(`Validation took ${Date.now() - validateStart}ms`);

    // Database checks
    const dbStart = Date.now();
    const existingEmail = await User.findOne({ email: normalizedEmail });
    const existingPhone = await User.findOne({ phoneNumber: parsedPhone.number });
    const existingUsername = await User.findOne({ username });
    console.log(`Database queries took ${Date.now() - dbStart}ms`);

    if (existingEmail)
      return res.status(409).json({ error: t("Email already in use", "البريد الإلكتروني مستخدم بالفعل") });

    if (existingPhone)
      return res.status(409).json({ error: t("Phone number already in use", "رقم الهاتف مستخدم بالفعل") });

    if (existingUsername)
      return res.status(409).json({ error: t("Username already in use", "اسم المستخدم مستخدم بالفعل") });

    const genderEn = translateProfileFields.toEnglish(gender, 'gender');
    const countryEn = translateProfileFields.toEnglish(country, 'country');
    const ethnicityEn = translateProfileFields.toEnglish(ethnicity, 'ethnicity');

    const hashStart = Date.now();
    const hashedPassword = await bcrypt.hash(password, 8);
    console.log(`Password hashing took ${Date.now() - hashStart}ms`);

    const tokenStart = Date.now();
    const token = jwt.sign({
      username,
      email: normalizedEmail
    }, JWT_SECRET, { expiresIn: '1h' });
    console.log(`JWT signing took ${Date.now() - tokenStart}ms`);

    // Create user with all required fields
    const newUser = await User.create({
      username,
      email: normalizedEmail,
      password: hashedPassword,
      phoneNumber: parsedPhone.number,
      gender: genderEn,
      country: countryEn,
      DateOfBirth,
      ethnicity: ethnicityEn,
      authProvider: 'local',
      isVerified: false,
      profileCompleted: false
    });

    // Respond to the user immediately
    res.status(200).json({
      success: true,
      message: t("Verification email sent", "تم إرسال بريد التحقق"),
      pendingVerification: true
    });
    console.log(`Response sent in ${Date.now() - start}ms`);

    // Send the email asynchronously
    sendEmailVerificationLink(normalizedEmail, username, token)
      .catch(err => console.error("Error sending verification email:", err));

  } catch (error) {
    console.error(`Signup failed: ${error.message}, total time: ${Date.now() - start}ms`);
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

export const login = async (req, res, next) => {
  const lang = req.query.lang === 'ar' ? 'ar' : 'en';
  const t = (en, ar) => lang === 'ar' ? ar : en;

  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: t("Please enter a valid email", "يرجى إدخال بريد إلكتروني صالح") });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ error: t("User Not Found", "المستخدم غير موجود") });
    }

    if (!user.password || !user.password.startsWith('$2b$')) {
      return res.status(500).json({ error: t("Invalid password hash in database", "تجزئة كلمة المرور غير صالحة في قاعدة البيانات") });
    }

    if (user.authProvider !== "local") {
      return res.status(400).json({
        error: t(`Please log in with ${user.authProvider}.`, `يرجى تسجيل الدخول باستخدام ${user.authProvider}`)
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        error: t("Please verify your email before logging in", "يرجى التحقق من بريدك الإلكتروني قبل تسجيل الدخول")
      });
    }

    const isPasswordValid = await bcrypt.compare(password.trim(), user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: t("Invalid password", "كلمة المرور غير صحيحة") });
    }

    // Optional: Introduce delay to slow brute force
    // await new Promise(r => setTimeout(r, 300));

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(201).json({
      success: true,
      message: t("User logged in successfully", "تم تسجيل الدخول بنجاح"),
      data: { token, user }
    });

  } catch (error) {
    console.error('Login error:', error);
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

    const genderEn = translateProfileFields.toEnglish(gender, 'gender');
    const countryEn = translateProfileFields.toEnglish(country, 'country');
    const ethnicityEn = translateProfileFields.toEnglish(ethnicity, 'ethnicity');

    const newUser = await User.create({
      email: decoded.email,
      username,
      phoneNumber: parsedPhone.number,
      gender: genderEn,
      country: countryEn,
      DateOfBirth,
      ethnicity: ethnicityEn,
      authProvider: decoded.source || 'local',
      isVerified: true,
      profileCompleted: true
    });

    const authToken = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.status(201).json({ success: true, token: authToken, user: newUser });
  } catch (error) {
    next(error);
  }
};
