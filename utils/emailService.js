import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false }
});

export const sendEmailVerificationLink = async (email, username, token) => {
  const verifyUrl = `https://lupira.onrender.com/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  const mailOptions = {
    from: `Lupira <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email - Lupira",
    html: `
      <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; line-height: 1.6;">
        <div style="background-color: #6A5ACD; color: #ffffff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">Verify Your Email</h1>
        </div>
        <div style="border: 1px solid #ddd; padding: 30px;">
          <p>Hello <strong>${username}</strong>,</p>
          <p>Thank you for signing up with <strong>Lupira</strong>! Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="padding: 12px 24px; background-color: #28a745; color: #ffffff; text-decoration: none; border-radius: 5px;">
              Verify Email
            </a>
          </div>
          <p>This link will expire in 1 hour. If you did not create an account, you can safely ignore this email.</p>
          <p style="margin-top: 30px;">Warm regards,<br><strong>The Lupira Team</strong></p>
        </div>
        <footer style="background-color: #f5f5f5; padding: 10px; text-align: center; color: #888; font-size: 12px;">
          © ${new Date().getFullYear()} Lupira. All rights reserved.
        </footer>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log("Verification email sent to:", email);
};

export const sendResetPasswordEmail = async (email, username, resetToken) => {
    const resetLink = `https://lupira.onrender.com/api/auth/deeplink?to=reset-password&token=${resetToken}`;

    const mailOptions = {
        from: `Lupira <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Reset Your Password",
        html: `
             <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; line-height: 1.6;">
        <div style="background-color: #6A5ACD; color: #ffffff; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1>Password Reset Request</h1>
        </div>
        <div style="border: 1px solid #ddd; padding: 20px;">
            <p style="color: #555;">Hello <strong>${username}</strong>,</p>
            <p style="color: #555;">We received a request to reset your password. Click the button below to reset it:</p>
            
            <a href="${resetLink}" style="display:inline-block; margin-top:15px; padding:10px 15px; background-color: #6A5ACD; color:#ffffff; text-decoration:none; border-radius:5px;">Reset Password</a>

            <p style="color: #555;">If you didn't request this, please ignore this email.</p>

            <p style="margin-top: 20px; color: #555;">Warm Regards,<br><strong>The Lupira Team</strong></p>
        </div>

        <footer style="background-color: #f5f5f5; padding: 10px; text-align: center; color: #888; font-size: 12px;">
            © ${new Date().getFullYear()} Lupira. All rights reserved.
        </footer>
    </div>
        `
    };

    await transporter.sendMail(mailOptions);
};

export const sendEmailChangeVerificationLink = async (email, username, token, lang = 'en') => {
  const verifyUrl = `https://lupira.onrender.com/api/auth/verify-email?token=${encodeURIComponent(token)}&lang=${lang}`;
  const t = (en, ar) => (lang === 'ar' ? ar : en);

  console.log('sendEmailChangeVerificationLink - Sending email to:', email, 'Language:', lang); // Debug log

  const mailOptions = {
    from: `Lupira <${process.env.EMAIL_USER}>`,
    to: email,
    subject: t('Confirm Your New Email - Lupira', 'تأكيد بريدك الإلكتروني الجديد - لوبيرا'),
    html: `
      <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; line-height: 1.6; direction: ${lang === 'ar' ? 'rtl' : 'ltr'};">
        <div style="background-color: #6A5ACD; color: #ffffff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">${t('Confirm Your New Email', 'تأكيد بريدك الإلكتروني الجديد')}</h1>
        </div>
        <div style="border: 1px solid #ddd; padding: 30px;">
          <p>${t('Hello', 'مرحبًا')} <strong>${username}</strong>,</p>
          <p>${t(
            'You recently requested to update your email address on <strong>Lupira</strong>. Please confirm your new email by clicking the button below:',
            'لقد طلبت مؤخرًا تحديث عنوان بريدك الإلكتروني على <strong>لوبيرا</strong>. يرجى تأكيد بريدك الإلكتروني الجديد بالنقر على الزر أدناه:'
          )}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="padding: 12px 24px; background-color: #28a745; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
              ${t('Verify New Email', 'تأكيد البريد الإلكتروني الجديد')}
            </a>
          </div>
          <p>${t(
            'This link will expire in 1 hour. If you did not make this request, you can safely ignore this email.',
            'ستنتهي صلاحية هذا الرابط خلال ساعة واحدة. إذا لم تقم بهذا الطلب، يمكنك تجاهل هذا البريد الإلكتروني بأمان.'
          )}</p>
          <p style="margin-top: 30px;">${t('Warm regards,', 'مع أطيب التحيات،')}<br><strong>${t('The Lupira Team', 'فريق لوبيرا')}</strong></p>
        </div>
        <footer style="background-color: #f5f5f5; padding: 10px; text-align: center; color: #888; font-size: 12px;">
          © ${new Date().getFullYear()} Lupira. ${t('All rights reserved.', 'جميع الحقوق محفوظة.')}
        </footer>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log('sendEmailChangeVerificationLink - Email sent to:', email);
};