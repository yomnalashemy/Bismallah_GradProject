import { t, translateProfileFields } from '../utils/translationHelper.js';       
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import { sendResetPasswordEmail } from '../utils/emailService.js';
import { JWT_SECRET } from '../config/env.js';
import { sendEmailChangeVerificationLink } from '../utils/emailService.js';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

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

export const getProfile = async (req, res, next) => {
  const lang = req.query.lang === 'ar' ? 'ar' : 'en';
  try {
    const user = await User.findById(req.user._id).select('username DateOfBirth ethnicity email gender country phoneNumber ');
    if (!user) return res.status(404).json({ error: t("User not found", "المستخدم غير موجود", lang) });

    res.status(200).json({
      success: true,
      data: translateProfileFields.toArabicIfNeeded(user, lang)
    });
  } catch (error) {
    next(error);
  }
};

export const editProfile = async (req, res, next) => {
  const lang = (req.query.lang || '').toLowerCase() === 'ar' ? 'ar' : 'en';
  console.log('editProfile - Received lang:', req.query.lang, 'Resolved lang:', lang); // Debug log
  const t = (en, ar) => (lang === 'ar' ? ar : en);

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      console.log('editProfile - User not found:', req.user._id);
      return res.status(404).json({ error: t('User not found', 'المستخدم غير موجود') });
    }

    const { username, email, DateOfBirth, gender, ethnicity, phoneNumber, country } = req.body;

    // Handle username update
    if (username && username !== user.username) {
      if (username.length < 5) {
        return res.status(400).json({ error: t('Username must be at least 5 characters', 'اسم المستخدم يجب أن لا يقل عن 5 حروف') });
      }
      if (username.length > 50) {
        return res.status(400).json({ error: t('Username must be at most 50 characters', 'اسم المستخدم يجب أن لا يزيد عن 50 حرفًا') });
      }
      const existing = await User.findOne({ username });
      if (existing) {
        return res.status(409).json({ error: t('Username already taken', 'اسم المستخدم مستخدم بالفعل') });
      }
      user.username = username;
    }

    // Handle email change
    if (email && email !== user.email) {
      console.log('editProfile - Attempting email change to:', email);
      const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: t('Invalid email format', 'تنسيق البريد الإلكتروني غير صالح') });
      }

      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(409).json({ error: t('Email already in use', 'البريد الإلكتروني مستخدم بالفعل') });
      }

      // Generate JWT token for email verification
      const token = jwt.sign(
        { changeEmail: true, userId: user._id, email },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Send verification email
      console.log('editProfile - Sending verification email to:', email, 'Language:', lang);
      await sendEmailChangeVerificationLink(email, user.username, token, lang);
      console.log('editProfile - Verification email sent, exiting');
      return res.status(200).json({
        success: true,
        message: t(
          'A verification link has been sent to your new email. Please confirm it.',
          'تم إرسال رابط التحقق إلى بريدك الجديد. يرجى تأكيده.'
        ),
      });
    }

    // Handle phone number update
    if (phoneNumber) {
      const parsedPhone = parsePhoneNumberFromString(phoneNumber);
      if (!parsedPhone || !parsedPhone.isValid()) {
        return res.status(400).json({ error: t('Invalid phone number', 'رقم الهاتف غير صالح') });
      }
      if (user.phoneNumber !== phoneNumber) {
        const exists = await User.findOne({ phoneNumber });
        if (exists) {
          return res.status(409).json({ error: t('Phone number already in use', 'رقم الهاتف مستخدم بالفعل') });
        }
      }
      user.phoneNumber = phoneNumber;
    }

    // Handle date of birth update
    if (DateOfBirth) {
      const dob = new Date(DateOfBirth);
      if (dob > new Date()) {
        return res.status(400).json({ error: t('Date of birth cannot be in the future', 'تاريخ الميلاد لا يمكن أن يكون في المستقبل') });
      }
      user.DateOfBirth = DateOfBirth;
    }

    // Handle other fields
    if (gender) user.gender = translateProfileFields.toEnglish(gender, 'gender');
    if (ethnicity) user.ethnicity = translateProfileFields.toEnglish(ethnicity, 'ethnicity');
    if (country) user.country = translateProfileFields.toEnglish(country, 'country');

    // Save updated user (excluding email, which is handled in verifyEmail)
    console.log('editProfile - Saving user with updates (excluding email):', user);
    await user.save();

    return res.status(200).json({
      success: true,
      message: t('Profile updated successfully', 'تم تحديث الملف الشخصي بنجاح'),
      data: translateProfileFields.toArabicIfNeeded(user, lang),
    });
  } catch (error) {
    console.error('editProfile - Error:', error);
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  const lang = req.query.lang === 'ar' ? 'ar' : 'en';

  try {
    const userId = req.user._id;
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({
        error: lang === 'ar'
          ? "المستخدم غير موجود أو تم حذفه بالفعل."
          : "User not found or already deleted."
      });
    }

    return res.status(200).json({
      success: true,
      message: lang === 'ar'
        ? "تم حذف الحساب بنجاح."
        : "Account deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
