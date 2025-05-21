import User from "../models/user.model.js";

export const verifyEmail = async (req, res) => {
  const token = req.query.token;
  const lang = req.query.lang === 'ar' ? 'ar' : 'en';

  if (!token) {
    return res.status(400).json({ error: lang === 'ar' ? "رمز التحقق مفقود." : "Verification token is missing." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: lang === 'ar' ? "المستخدم غير موجود." : "User not found." });
    }

    if (user.isVerified) {
      return res.status(200).json({ message: lang === 'ar' ? "تم التحقق من البريد الإلكتروني بالفعل." : "Email already verified." });
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: lang === 'ar' ? "تم التحقق من البريد الإلكتروني بنجاح!" : "Email verified successfully!"
    });
  } catch (err) {
    res.status(400).json({ error: lang === 'ar' ? "رمز التحقق غير صالح أو منتهي." : "Invalid or expired token." });
  }
};
