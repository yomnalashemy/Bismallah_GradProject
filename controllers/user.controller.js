import mongoose from 'mongoose';            
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import { sendResetPasswordEmail } from '../utils/emailService.js';
import { JWT_SECRET } from '../config/env.js';
import { sendEmailChangeConfirmation } from '../utils/emailService.js';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

const t = (en, ar, lang) => lang === 'ar' ? ar : en;

export const changePassword = async (req, res, next) => {
  const lang = req.query.lang === 'ar' ? 'ar' : 'en';
  const { oldPassword, newPassword, confirmNewPassword } = req.body;

  if (!oldPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ error: t("Please provide all password fields.", "يرجى إدخال جميع حقول كلمة المرور.", lang) });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ error: t("New passwords do not match.", "كلمتا المرور غير متطابقتين.", lang) });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({ error: t("Password must meet complexity requirements.", "يجب أن تحتوي كلمة المرور على تعقيد كافٍ.", lang) });
  }

  try {
    const user = await User.findById(req.user._id).select('+password +authProvider');
    if (!user) return res.status(404).json({ error: t("User not found.", "المستخدم غير موجود.", lang) });

    if (user.authProvider !== "local") {
      return res.status(400).json({ error: t("Use the original login provider.", "يرجى استخدام مزود تسجيل الدخول الأصلي.", lang) });
    }

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(401).json({ error: t("Old password incorrect.", "كلمة المرور القديمة غير صحيحة.", lang) });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ success: true, message: t("Password updated.", "تم تحديث كلمة المرور.", lang) });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  const lang = req.query.lang === 'ar' ? 'ar' : 'en';
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: t("Email is required.", "البريد الإلكتروني مطلوب.", lang) });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: t("User not found.", "المستخدم غير موجود.", lang) });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
    await sendResetPasswordEmail(user.email, user.username, token);

    res.status(200).json({
      success: true,
      message: t("Password reset email sent.", "تم إرسال بريد إعادة تعيين كلمة المرور.", lang)
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  const lang = req.query.lang === 'ar' ? 'ar' : 'en';
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: t("No token provided.", "لم يتم تقديم رمز التحقق.", lang) });
    }

    const token = authHeader.split(' ')[1];
    const { newPassword, confirmNewPassword } = req.body;

    if (!newPassword || !confirmNewPassword) {
      return res.status(400).json({ error: t("All password fields required.", "جميع حقول كلمة المرور مطلوبة.", lang) });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ error: t("Passwords do not match.", "كلمتا المرور غير متطابقتين.", lang) });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ error: t("User not found.", "المستخدم غير موجود.", lang) });

    if (Date.now() > user.resetPasswordExpires) {
      return res.status(400).json({ error: t("Token expired.", "انتهت صلاحية الرمز.", lang) });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: t("Password updated successfully.", "تم تحديث كلمة المرور بنجاح.", lang)
    });
  } catch (error) {
    next(error);
  }
};

const translateProfile = (user, lang) => {
  if (lang !== 'ar') return user;
  const translate = {
    male: 'ذكر', female: 'أنثى', other: 'آخر',
    Egypt: 'مصر', USA: 'الولايات المتحدة', UK: 'بريطانيا', Canada: 'كندا'
  };
  return {
    ...user.toObject(),
    gender: translate[user.gender] || user.gender,
    country: translate[user.country] || user.country
  };
};

export const getProfile = async (req, res, next) => {
  const lang = req.query.lang === 'ar' ? 'ar' : 'en';
  try {
    const user = await User.findById(req.user._id).select('username DateOfBirth ethnicity email gender country phoneNumber profilePicture');
    if (!user) return res.status(404).json({ error: t("User not found", "المستخدم غير موجود", lang) });
    res.status(200).json({ success: true, data: translateProfile(user, lang) });
  } catch (error) {
    next(error);
  }
};

export const editProfile = async (req, res, next) => {
  const lang = req.query.lang === 'ar' ? 'ar' : 'en';
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: t("User not found", "المستخدم غير موجود", lang) });

    const { username, email, DateOfBirth, gender, ethnicity, phoneNumber, country } = req.body;

    if (username && username !== user.username) {
      if (username.length < 5) return res.status(400).json({ error: t("Username must be at least 5 characters", "اسم المستخدم يجب أن لا يقل عن 5 حروف", lang) });
      const usernameRegex = /^(?=.*[\d_])[a-zA-Z0-9._]+$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({ error: t("Invalid username format", "تنسيق اسم المستخدم غير صالح", lang) });
      }
      const existingUser = await User.findOne({ username });
      if (existingUser) return res.status(409).json({ error: t("Username already taken", "اسم المستخدم مستخدم بالفعل", lang) });
      user.username = username;
    }

    if (email && email !== user.email) {
      const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
      if (!emailRegex.test(email)) return res.status(400).json({ error: t("Invalid email format", "تنسيق البريد الإلكتروني غير صالح", lang) });
      const existingEmailUser = await User.findOne({ email });
      if (existingEmailUser) return res.status(409).json({ error: t("Email already in use", "البريد الإلكتروني مستخدم بالفعل", lang) });
      const oldEmail = user.email;
      user.email = email;
      try {
        await sendEmailChangeConfirmation(email, user.username);
      } catch (err) {
        user.email = oldEmail;
      }
    }

    if (phoneNumber) {
      const parsedPhone = parsePhoneNumberFromString(phoneNumber);
      if (!parsedPhone || !parsedPhone.isValid()) {
        return res.status(400).json({ error: t("Invalid phone number", "رقم الهاتف غير صالح", lang) });
      }
      if (user.phoneNumber !== phoneNumber) {
        const existingPhoneUser = await User.findOne({ phoneNumber });
        if (existingPhoneUser) return res.status(409).json({ error: t("Phone number already in use", "رقم الهاتف مستخدم بالفعل", lang) });
      }
      user.phoneNumber = phoneNumber;
    }

    if (DateOfBirth) {
      const dobDate = new Date(DateOfBirth);
      if (dobDate > new Date()) {
        return res.status(400).json({ error: t("Date of birth cannot be in the future", "تاريخ الميلاد لا يمكن أن يكون في المستقبل", lang) });
      }
      user.DateOfBirth = DateOfBirth;
    }

    if (gender) user.gender = gender;
    if (ethnicity) user.ethnicity = ethnicity;
    if (country) user.country = country;

    await user.save();
    res.status(200).json({
      success: true,
      message: t("Profile updated successfully", "تم تحديث الملف الشخصي بنجاح", lang),
      data: translateProfile(user, lang)
    });
  } catch (error) {
    next(error);
  }
};