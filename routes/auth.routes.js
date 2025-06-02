import {Router} from 'express';
import {signUp, login, signUpWithGoogle, signUpWithFacebook, completeProfile, loginWithFacebook, loginWithGoogle, logOut} from '../controllers/auth.controller.js';
import {changePassword, forgotPassword, resetPassword, deleteAccount} from '../controllers/user.controller.js';
import protect from '../middlewares/auth.middleware.js';
import {verifyEmail} from '../controllers/verifyEmail.controller.js';
import { handleDeeplink } from '../controllers/handleDeeplink.js';
const authRouter = Router();

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Sign up a new user
 *     description: Create a new user account with the provided details.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - confirmPassword
 *               - gender
 *               - country
 *               - DateOfBirth
 *               - phoneNumber
 *               - ethnicity
 *             properties:
 *               username:
 *                 type: string
 *                 example: "Rojena_Mohamaden_1811"
 *               email:
 *                 type: string
 *                 example: "rojenamohamaden@gmail.com"
 *               password:
 *                 type: string
 *                 example: "rojena_AbdelKader11"
 *               confirmPassword:
 *                 type: string
 *                 example: "rojena_AbdelKader11"
 *               phoneNumber:
 *                 type: string
 *                 example: "+201145551358"
 *               gender:
 *                 type: string
 *                 example: "Female"
 *               country:
 *                 type: string
 *                 example: "Egypt"
 *               DateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "2003-11-18"
 *               ethnicity:
 *                 type: string
 *                 example: "Caucasian"
 *     responses:
 *       201:
 *         description: User signed in successfully. A welcome email has been sent
 *       409:
 *         description: User already exists
 *       400:
 *         description: >
 *           Bad request - Possible causes:
 *             - Username must be at least 5 characters long!
 *             - Username can only contain letters, numbers, periods, and underscores!
 *             - Please enter a valid email address!
 *             - Invalid phone number format!
 *             - Passwords don't match!
 *             - Password must be at least 8 characters long!
 *             - Password must include at least one lowercase letter, one uppercase letter, one number, and one special character!
 *             - Email not found or undeliverable
 *             - Date of birth cannot be in the future!
 */

//path: /api/auth
//  RESTful API Formatting
authRouter.post('/signup', signUp);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in an existing user
 *     description: Authenticate a user with their email and password.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "rojenamohamaden@gmail.com"
 *               password:
 *                 type: string
 *                 example: "rojena_AbdelKader11"
 *     responses:
 *       201:
 *         description: User logged in successfully
 *       401:
 *         description: > 
 *           Bad request - Possible causes:  
 *              - User Not Found 
 *              - Invalid Password
 */

authRouter.post('/login', login);

authRouter.post('/logout', protect, logOut);

/**
 * @swagger
 * /api/auth/password:
 *   patch:
 *     summary: Change Password
 *     description: Change the password of the authenticated user.
 *     tags:
 *       - User Account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *               - confirmNewPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: "rojena_AbdelKader11"
 *               newPassword:
 *                 type: string
 *                 example: "11AbdelKader_rojena"
 *               confirmNewPassword:
 *                 type: string
 *                 example: "11AbdelKader_rojena"
 *     responses:
 *       401:
 *         description: Old password is incorrect
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: > 
 *           Bad request - Possible causes:
 *             - Please provide old password, new password, and confirm the new password.
 *             - New passwords do not match
 *             - New password must include at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.
 */
authRouter.patch('/password', protect, changePassword); //Part of resource

/**
 * @swagger
 * /api/auth/password/forgot:
 *   post:
 *     summary: Forgot Password
 *     description: User enters their email, requesting a password reset.
 *     tags:
 *       - User Account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email 
 *             properties:
 *               email:
 *                 type: string
 *                 example: "rojenamohamaden@gmail.com"
 *     responses:
 *       200:
 *         description: Password reset email sent successfully. Please check your inbox.
 *       404:
 *         description: User with this email does not exist.
 *       500:
 *         description: Failed to send reset email. Please try again.
 *       400:
 *         description: "Bad request - Possible causes:
 *           - Email is required."
 */
authRouter.post('/password/forgot', forgotPassword);

/**
 * @swagger
 * /api/auth/password/reset:
 *   post:
 *     summary: Reset Password
 *     description: Reset the password of the authenticated user.
 *     tags:
 *       - User Account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *               - confirmNewPassword
 *               - token
 *             properties:
 *               newPassword:
 *                 type: string
 *                 example: "11AbdelKader_rojena"
 *               confirmNewPassword:
 *                 type: string 
 *                 example: "11AbdelKader_rojena"
 *               token:
 *                 type: string
 *                 description: Token extracted from the password reset link sent to the user's email.
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE1MjAsImlhdCI6MTc0MzYxMDI3OSwiZXhwIjoxNzQzNjEzODc5fQ.ClYC8qtYuUc1QOsWbzgW0NDLTU0awTt5XjyvldqpLjk"
 *     responses:
 *       200:
 *         description: Password reset successfully. You can now log in with your new password.
 *       400:
 *         description: >
 *           Bad request - Possible causes:
 *             - New Password is required
 *             - New Passwords do not match
 *             - Password must include at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.
 *             - Invalid or expired reset token.
 *             - Reset token has expired.
 */

authRouter.post('/password/reset', resetPassword);

/**
 * @swagger
 * /api/auth/delete:
 *   delete:
 *     summary: Delete user account
 *     description: Permanently deletes the currently authenticated user's account.
 *     tags:
 *       - User Account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully.
 *       404:
 *         description: User not found or already deleted.
 */
authRouter.delete('/delete', protect, deleteAccount );

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: Verify Email
 *     description: Verify the user's email address using a token.
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         description: Token for email verification.
 *         schema:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE1MjAsImlhdCI6MTc0MzYxMDI3OSwiZXhwIjoxNzQzNjEzODc5fQ.ClYC8qtYuUc1QOsWbzgW0NDLTU0awTt5XjyvldqpLjk"
 *     responses:
 *       200:
 *         description: Email verified successfully.
 *       400:
 *         description: Invalid or expired verification token.
 * 
 */
authRouter.get('/verify-email', verifyEmail);

authRouter.get('/deeplink', handleDeeplink); 
// This handles ?to=reset-password&token=abc

/**
 * @swagger
 * /auth/google/signup:
 *   post:
 *     summary: Sign up with Google
 *     description: Verifies the Google ID token and issues a temporary token to complete the user profile.
 *     tags:
 *       - Social Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Google ID token retrieved from frontend
 *     responses:
 *       200:
 *         description: Temporary token issued for profile completion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Token missing or user already exists
 *       500:
 *         description: Server error
 */
authRouter.post('/google/signup', signUpWithGoogle);

/**
 * @swagger
 * /auth/facebook/signup:
 *   post:
 *     summary: Sign up with Facebook
 *     description: Verifies the Facebook access token and issues a temporary token to complete the user profile.
 *     tags:
 *       - Social Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accessToken
 *             properties:
 *               accessToken:
 *                 type: string
 *                 description: Facebook access token retrieved from frontend
 *     responses:
 *       200:
 *         description: Temporary token issued for profile completion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Token missing or user already exists
 *       500:
 *         description: Server error
 */
authRouter.post('/facebook/signup', signUpWithFacebook);

/**
 * @swagger
 * /auth/google/login:
 *   post:
 *     summary: Log in with Google
 *     description: Authenticates an existing user via Google and returns a JWT.
 *     tags:
 *       - Social Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Google ID token from frontend
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
authRouter.post('/google/login', loginWithGoogle);
/**
 * @swagger
 * /auth/facebook/login:
 *   post:
 *     summary: Log in with Facebook
 *     description: Authenticates an existing user via Facebook and returns a JWT.
 *     tags:
 *       - Social Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accessToken
 *             properties:
 *               accessToken:
 *                 type: string
 *                 description: Facebook access token from frontend
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
authRouter.post('/facebook/login', loginWithFacebook);

/**
 * @swagger
 * /auth/complete-profile:
 *   post:
 *     summary: Complete user profile after social signup
 *     description: Finalizes the account by saving additional user information after social signup (Google or Facebook).
 *     tags:
 *       - Social Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - phoneNumber
 *               - gender
 *               - country
 *               - DateOfBirth
 *               - ethnicity
 *             properties:
 *               username:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               gender:
 *                 type: string
 *               country:
 *                 type: string
 *               DateOfBirth:
 *                 type: string
 *                 format: date
 *               ethnicity:
 *                 type: string
 *     responses:
 *       201:
 *         description: User profile completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Missing or invalid data, or user already exists
 *       401:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */

authRouter.post('/complete-profile', completeProfile);
export default authRouter;