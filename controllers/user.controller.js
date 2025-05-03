import bcrypt from 'bcryptjs'; //hashing
import User from '../models/user.model.js';
import { sendResetPasswordEmail } from '../utils/emailService.js';
import { sendEmailChangeConfirmation } from '../utils/emailService.js';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";

export const changePassword = async (req, res, next) => {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
        return res.status(400).json({ error: "Please provide old password, new password, and confirm the new password." });
    }

    if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ error: "New passwords do not match." });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({ error: "New password must include at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character." });
    }

    try {
        const user = await User.findById(req.user._id).select('+password +authProvider'); //log in with google

        if (!user) {
            return res.status(404).json({ error: "User not found!" });
        }

        if (user.authProvider === "google" || user.authProvider === "facebook") {
            return res.status(400).json({
                error: "You signed in with Google/Facebook. Use their password reset options instead.",
            });
        }

        const passwordMatches = await bcrypt.compare(oldPassword, user.password);

        if (!passwordMatches) {
            return res.status(401).json({ error: "Old password is incorrect." });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedNewPassword;
        await user.save();

        res.status(200).json({ success: true, message: "Password updated successfully." });

    } catch (error) {
        console.error("Password change failed:", error.message);
        next(error);
    }
};

export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User with this email does not exist." });
        }

        // Generate a unique reset token
        const resetToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });


        // Send reset email
        try {
            await sendResetPasswordEmail(user.email, user.username, resetToken);
        } catch (error) {
            return res.status(500).json({ error: "Failed to send reset email. Please try again." });
        }

        res.status(200).json({
            success: true,
            message: "Password reset email sent successfully. Please check your inbox.",
        });
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized, no token provided." });
       }

      const token = authHeader.split(' ')[1];
      const { newPassword, confirmNewPassword } = req.body;
  
      if (!token || !newPassword || !confirmNewPassword) {
        return res.status(400).json({ error: "Token and new passwords are required." });
      }
  
      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ error: "New passwords do not match." });
      }
  
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
          error: "Password must include at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character."
        });
      }
  
      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (error) {
        return res.status(400).json({ error: "Invalid or expired reset token." });
      }
  
      const user = await User.findById(decoded.userId);

      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000;
      await user.save();

  
      if (!user || user.resetPasswordToken !== token) {
        return res.status(400).json({ error: "Invalid or expired reset token." });
      }
  
      if (Date.now() > user.resetPasswordExpires) {
        return res.status(400).json({ error: "Reset token has expired." });
      }
  
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
  
      // Update user's password and clear reset token
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined; //clears reset token and expiry  from the database
      await user.save();
  
      res.status(200).json({
        success: true,
        message: "Password updated successfully. You can now log in with your new password.",
      });
    } catch (error) {
      next(error);
    }
  };
  
export const deleteAccount = async (req,res, next) => {
    try {
        const userId = req.user._id;

        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            const error = new Error("User not found or already deleted.");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            success: true,
            message: "Account deleted successfully.",
        });
    } catch (error) {
        next(error);
    }
};

export const getProfile = async (req, res, next) => {
    try {

        const userId = req.user._id;
        const user = await User.findById(userId).select('username DateOfBirth ethnicity email gender country phoneNumber');
        if (!user) {    
            res.status(404).json ({
                error: "User not found"
            })
        }
        res.status(200).json({
            success: true,
            data: user 
        });
    }
    catch (error) {
        next (error);
    }
};

export const editProfile = async (req, res, next) => {
    try {
    const userId = req.user._id; // From the JWT payload
    const {username, email, DateOfBirth, gender, ethnicity, phoneNumber} = req.body;
    const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
    
        if (username && username !== user.username) {
            if (username.length < 5) {
                return res.status(400).json({ error: 'Username must be at least 5 characters long.' });
            } 
            const usernameRegex = /^(?=.*[\d_])[a-zA-Z0-9._]+$/;
            if (!usernameRegex.test(username)) {
                return res.status(400).json({
                    error: 'Username can only contain letters, numbers, periods, and underscores.'
                });
            }

            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(409).json({ error: 'Username already taken.' });
            }

            user.username = username;
        }

        if (email && email !== user.email) {
            const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'Invalid email format.' });
            }

            const existingEmailUser = await User.findOne({ email });
            if (existingEmailUser) {
                return res.status(409).json({ error: 'Email is already in use.' });
            }

            const oldEmail = user.email;
            user.email = email;


            // Send confirmation email
            try {
                await sendEmailChangeConfirmation(email, user.username);
            } catch (err) {
                console.warn('Email confirmation failed:', err.message);
                user.email = oldEmail; // Revert email change
            }
        }

        if (phoneNumber) {
            const parsedPhone = parsePhoneNumberFromString(phoneNumber);
            if (!parsedPhone || !parsedPhone.isValid()) {
                return res.status(400).json({ error: 'Invalid phone number format.' });
            }
            user.phoneNumber = phoneNumber;
        }

        const existingUser = await User.findOne({ phoneNumber });
            if (existingUser) {
                return res.status(409).json({ error: 'Phone Number already exists.' });
            }

        // Other fields
        if (DateOfBirth) {
            const dobDate = new Date(DateOfBirth);
            const today = new Date();
        
            if (dobDate > today) {
                return res.status(400).json({ error: 'Date of birth cannot be in the future.' });
            }
        
            user.DateOfBirth = DateOfBirth;
        }
        
        if (gender) user.gender = gender;
        if (ethnicity) user.ethnicity = ethnicity;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully.',
            data: {
                username: user.username,
                email: user.email,
                DateOfBirth: user.DateOfBirth,
                gender: user.gender,
                ethnicity: user.ethnicity,
                phoneNumber: user.phoneNumber,
            }
        });
    } catch (error) {
        next(error);
    }
};


    

