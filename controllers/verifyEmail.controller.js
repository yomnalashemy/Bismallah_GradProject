import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { JWT_SECRET } from '../config/env.js';

export const verifyEmail = async (req, res) => {
  const token = req.query.token;
  const lang = req.query.lang === 'ar' ? 'ar' : 'en';
  const t = (en, ar) => lang === 'ar' ? ar : en;

  if (!token) return res.status(400).send(t("Missing token", "رمز التحقق مفقود"));

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.changeEmail) {
   const user = await User.findById(decoded.userId);
   if (!user) return res.status(404).send(t("User not found", "المستخدم غير موجود"));

  user.email = decoded.email;
  await user.save();

  return res.send(`
    <!DOCTYPE html>
    <html lang="${lang}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t("Email Updated", "تم تحديث البريد الإلكتروني")}</title>
      <script>
        window.location.href = "lupira://verify-email?token=${token}";
        setTimeout(() => {
          document.body.innerHTML = '<h2>${t("If the app didn\\'t open, please make sure it is installed.", "إذا لم يتم فتح التطبيق، يرجى التأكد من أنه مثبت.")}</h2>';
        }, 3000);
      </script>
    </head>
    <body>
      <h2>${t("Your email has been updated successfully!", "تم تحديث بريدك الإلكتروني بنجاح!")}</h2>
      <p>${t("If nothing happens,", "إذا لم يحدث شيء،")} <a href="lupira://verify-email?token=${token}">${t("tap here", "اضغط هنا")}</a>.</p>
    </body>
    </html>
  `);
}


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
        authProvider: "local",
        isVerified: true
      });
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="${lang}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t("Email Verified", "تم التحقق من البريد الإلكتروني")}</title>
        <script>
          window.location.href = "lupira://verify-email?token=${token}";
          setTimeout(() => {
            document.body.innerHTML = '<h2>${t("If the app didn\\'t open, please make sure it is installed.", "إذا لم يتم فتح التطبيق، يرجى التأكد من أنه مثبت.")}</h2>';
          }, 3000);
        </script>
      </head>
      <body>
        <h2>${t("Your email has been verified!", "تم التحقق من بريدك الإلكتروني!")}</h2>
        <p>${t("If nothing happens,", "إذا لم يحدث شيء،")} <a href="lupira://verify-email?token=${token}">${t("tap here", "اضغط هنا")}</a>.</p>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("Email verification error:", err);
    return res.status(400).send(t("Invalid or expired verification token", "رمز التحقق غير صالح أو منتهي الصلاحية"));
  }
};
