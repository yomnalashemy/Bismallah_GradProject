import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { JWT_SECRET } from '../config/env.js';

export const verifyEmail = async (req, res) => {
  const token = req.query.token;
  const lang = (req.query.lang || '').toLowerCase() === 'ar' ? 'ar' : 'en';
  console.log('verifyEmail - Language parameter:', req.query.lang, 'Resolved lang:', lang); // Debug log
  const t = (en, ar) => (lang === 'ar' ? ar.replace(/'/g, "\\'") : en.replace(/'/g, "\\'"));

  if (!token) {
    return res.status(400).send(t('Missing token', 'رمز التحقق مفقود'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    res.set('Content-Type', 'text/html; charset=UTF-8'); // Ensure UTF-8 encoding

    if (decoded.changeEmail) {
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).send(t('User not found', 'المستخدم غير موجود'));
      }

      const existingUser = await User.findOne({ email: decoded.email });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(409).send(t('Email already in use', 'البريد الإلكتروني مستخدم بالفعل'));
      }

      console.log('verifyEmail - Updating email for user:', user._id, 'to:', decoded.email);
      user.email = decoded.email;
      await user.save();

      return res.send(`
        <!DOCTYPE html>
        <html lang="${lang}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${t('Email Updated', 'تم تحديث البريد الإلكتروني')}</title>
          <script>
            window.location.href = "lupira://verify-email?token=${encodeURIComponent(token)}";
            setTimeout(() => {
              document.body.innerHTML = '<h2>${t(
                "If the app didn't open, please make sure it is installed.",
                'إذا لم يتم فتح التطبيق، يرجى التأكد من أنه مثبت.'
              )}</h2><p>${t(
                'Copy this link if needed: ',
                'انسخ هذا الرابط إذا لزم الأمر: '
              )}<code>lupira://verify-email?token=${encodeURIComponent(token)}</code></p>';
            }, 3000);
          </script>
        </head>
        <body>
          <h2>${t('Your email has been updated successfully!', 'تم تحديث بريدك الإلكتروني بنجاح!')}</h2>
          <p>${t('If nothing happens,', 'إذا لم يحدث شيء،')} <a href="lupira://verify-email?token=${encodeURIComponent(token)}">${t(
            'tap here',
            'اضغط هنا'
          )}</a>.</p>
        </body>
        </html>
      `);
    } else {
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
          authProvider: 'local',
          isVerified: true,
        });
      }

      return res.send(`
        <!DOCTYPE html>
        <html lang="${lang}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${t('Email Verified', 'تم التحقق من البريد الإلكتروني')}</title>
          <script>
            window.location.href = "lupira://verify-email?token=${encodeURIComponent(token)}";
            setTimeout(() => {
              document.body.innerHTML = '<h2>${t(
                "If the app didn't open, please make sure it is installed.",
                'إذا لم يتم فتح التطبيق، يرجى التأكد من أنه مثبت.'
              )}</h2><p>${t(
                'Copy this link if needed: ',
                'انسخ هذا الرابط إذا لزم الأمر: '
              )}<code>lupira://verify-email?token=${encodeURIComponent(token)}</code></p>';
            }, 3000);
          </script>
        </head>
        <body>
          <h2>${t('Your email has been verified!', 'تم التحقق من بريدك الإلكتروني!')}</h2>
          <p>${t('If nothing happens,', 'إذا لم يحدث شيء،')} <a href="lupira://verify-email?token=${encodeURIComponent(token)}">${t(
            'tap here',
            'اضغط هنا'
          )}</a>.</p>
        </body>
        </html>
      `);
    }
  } catch (err) {
    console.error('verifyEmail - Error:', err);
    return res.status(400).send(t('Invalid or expired verification token', 'رمز التحقق غير صالح أو منتهي الصلاحية'));
  }
};