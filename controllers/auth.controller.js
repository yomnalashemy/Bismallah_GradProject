import mongoose from 'mongoose';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { isEmailDeliverable } from '../utils/validateEmail.js';
import { parsePhoneNumberFromString } from 'libphonenumber-js'; // FOR VALID PHONE NUMBERS
import {JWT_SECRET, JWT_EXPIRES_IN, GOOGLE_CLIENT_ID} from '../config/env.js';

export const signUp = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const lang = req.query.lang === 'ar' ? 'ar' : 'en';

  try {
    const { username, email, password, confirmPassword, phoneNumber, gender, country, DateOfBirth, ethnicity } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingUser) {
      return res.status(409).json({
        error: lang === 'ar' ? "المستخدم موجود بالفعل" : "User already exists"
      });
    }

    if (!username || username.length < 5) {
      return res.status(400).json({
        error: lang === 'ar' ? "يجب أن يكون اسم المستخدم 5 أحرف على الأقل" : "Username must be at least 5 characters long!"
      });
    }

    const usernameRegex = /^(?=.*[\d])[a-zA-Z0-9._]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        error: lang === 'ar' ? "يمكن أن يحتوي اسم المستخدم فقط على حروف وأرقام ونقاط" : "Username can only contain letters, numbers, periods."
      });
    }

    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: lang === 'ar' ? "يرجى إدخال بريد إلكتروني صالح!" : "Please enter a valid email address!"
      });
    }

    const parsedPhone = parsePhoneNumberFromString(phoneNumber);
    if (!parsedPhone || !parsedPhone.isValid()) {
      return res.status(400).json({
        error: lang === 'ar' ? "رقم الهاتف غير صالح" : "Invalid phone number format!"
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: lang === 'ar' ? "كلمتا المرور غير متطابقتين!" : "Passwords don't match!"
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        error: lang === 'ar' ? "يجب أن تكون كلمة المرور 8 أحرف على الأقل!" : "Password must be at least 8 characters long!"
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error: lang === 'ar'
          ? "يجب أن تحتوي كلمة المرور على حرف صغير وحرف كبير ورقم ورمز خاص!"
          : "Password must include at least one lowercase letter, one uppercase letter, one number, and one special character!"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username, email, phoneNumber, country,
      password: hashedPassword, DateOfBirth, ethnicity, gender,
      authProvider: "local"
    });

    newUser.confirmPassword = confirmPassword;
    await newUser.save({ session });

    try {
      await sendWelcomeEmail(email, username);
    } catch (emailError) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({
        error: lang === 'ar' ? "فشل إرسال البريد الإلكتروني الترحيبي!" : "Email not found or undeliverable!"
      });
    }
    await sendEmailVerificationLink(email, username, newUser._id);


    await session.commitTransaction();
    session.endSession();

    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(201).json({
      success: true,
      message: lang === 'ar'
        ? "تم تسجيل المستخدم بنجاح. تم إرسال بريد إلكتروني ترحيبي"
        : "User signed in successfully. A welcome email has been sent",
      data: { token, user: newUser }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
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