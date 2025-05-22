import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { JWT_SECRET } from '../config/env.js';

export const verifyEmail = async (req, res) => {
  const token = req.query.token;
  const lang = req.query.lang === 'ar' ? 'ar' : 'en';
  const t = (en, ar) => lang === 'ar' ? ar : en;

  if (!token) return res.status(400).send("Missing token");

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // ✅ Email change flow
    if (decoded.changeEmail) {
      const user = await User.findById(decoded.userId);
      if (!user) return res.status(404).send("User not found");

      user.email = decoded.email;
      await user.save();

      // ✅ Redirect to deep link into app
     return res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>Opening Lupira...</title>
    <script>
      window.location.href = "lupira://verify-email?token=${token}";
      setTimeout(() => {
        document.body.innerHTML = "<p>If the app did not open, please make sure it is installed and try again.</p>";
      }, 3000);
    </script>
  </head>
  <body>
    <h2>Redirecting to Lupira App...</h2>
    <p>If nothing happens, <a href="lupira://verify-email?token=${token}">tap here</a>.</p>
  </body>
  </html>
`);
;
    }

    // ✅ Regular signup flow
    const existingUser = await User.findOne({ email: decoded.email });

    if (existingUser) {
      return res.redirect(`lupira://verify-email?token=${token}`);
    }

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

    return res.redirect(`lupira://verify-email?token=${token}`);

  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(400).send("Invalid or expired verification token");
  }
};
