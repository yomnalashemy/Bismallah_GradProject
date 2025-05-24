import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { JWT_SECRET } from '../config/env.js';
import { t } from '../utils/translationHelper.js'; // ensure it’s t(en, ar, lang)

const renderVerificationPage = (title, message, token, lang) => `
  <!DOCTYPE html>
  <html lang="${lang}">
  <head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f9f9f9;
        text-align: center;
        padding: 50px 20px;
        color: #333;
      }
      .card {
        background: #fff;
        padding: 30px;
        margin: auto;
        max-width: 500px;
        border-radius: 10px;
        box-shadow: 0 0 20px rgba(0,0,0,0.08);
      }
      h2 {
        color: #6A5ACD;
      }
      a.button {
        display: inline-block;
        margin-top: 20px;
        padding: 12px 24px;
        background-color: #6A5ACD;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        font-weight: bold;
      }
      p.note {
        margin-top: 30px;
        color: #777;
        font-size: 14px;
      }
    </style>
    <script>
      window.onload = function() {
        window.location.href = "lupira://verify-email?token=${token}";
        setTimeout(() => {
          document.getElementById('fallback').style.display = 'inline-block';
        }, 3000);
      }
    </script>
  </head>
  <body>
    <div class="card">
      <h2>${title}</h2>
      <p>${message}</p>
      <a id="fallback" href="lupira://verify-email?token=${token}" class="button" style="display:none;">
        ${lang === 'ar' ? 'اضغط لفتح التطبيق' : 'Tap to open app'}
      </a>
      <p class="note">
        ${lang === 'ar' ? 'إذا لم يتم فتح التطبيق تلقائيًا، يمكنك الضغط على الزر أعلاه.' : 'If the app doesn\'t open automatically, tap the button above.'}
      </p>
    </div>
  </body>
  </html>
`;

export const verifyEmail = async (req, res) => {
  const token = req.query.token;
  const lang = req.query.lang === 'ar' ? 'ar' : 'en';

  if (!token) {
    return res.status(400).send(t("Missing token", "رمز التحقق مفقود", lang));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // ✅ Email change flow
    if (decoded.changeEmail) {
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).send(t("User not found", "المستخدم غير موجود", lang));
      }

      user.email = decoded.email;
      await user.save();

      res.setHeader('Content-Type', 'text/html');
      return res.send(renderVerificationPage(
        t("Email Updated", "تم تحديث البريد الإلكتروني", lang),
        t("✅ Your email has been updated successfully!", "✅ تم تحديث بريدك الإلكتروني بنجاح!", lang),
        token,
        lang
      ));
    }

    // ✅ Signup verification flow
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

    res.setHeader('Content-Type', 'text/html');
    return res.send(renderVerificationPage(
      t("Email Verified", "تم التحقق من البريد الإلكتروني", lang),
      t("✅ Your email has been verified!", "✅ تم التحقق من بريدك الإلكتروني!", lang),
      token,
      lang
    ));

  } catch (err) {
    console.error("Email verification error:", err);
    return res.status(400).send(t("Invalid or expired verification token", "رمز التحقق غير صالح أو منتهي الصلاحية", lang));
  }
};
