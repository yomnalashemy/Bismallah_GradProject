import {Router} from 'express';
import {editProfile, getProfile} from '../controllers/user.controller.js';
import protect from '../middlewares/auth.middleware.js';
const userRouter = Router();

//path: /api/users/
/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Edit user profile
 *     description: Allows the authenticated user to update their username, email, date of birth, gender, ethnicity, or phone number.
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
 *             properties:
 *               username:
 *                 type: string
 *                 example: "Rojena_2025"
 *               email:
 *                 type: string
 *                 example: "newrojenamohamaden@gmail.com"
 *               DateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "2003-11-18"
 *               gender:
 *                 type: string
 *                 example: "Female"
 *               ethnicity:
 *                 type: string
 *                 example: "Caucasian"
 *               phoneNumber:
 *                 type: string
 *                 example: "+201145551358"
 *       
 *     responses:
 *       200:
 *         description: Profile updated successfully.
 *       400:
 *         description: >
 *           Bad request - Possible causes:
 *             - Username must be at least 5 characters long.
 *             - Username can only contain letters, numbers, periods, and underscores.
 *             - Invalid email format.
 *             - Invalid phone number format.
 *             - Date of birth cannot be in the future.
 *       404:
 *         description: User not found.
 *       409:
 *         description: >
 *           Bad request - Possible causes:
 *            - Email already in use.
 *            - Username already taken.
 */

userRouter.put('/profile', protect, editProfile); //entire resource

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Display user profile
 *     description: |
 *       Allows the authenticated user to view their profile
 *       - User Account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile Fetched Successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                   example: "Rojena_2025"
 *                 email:
 *                   type: string
 *                   example: "newrojenamohamaden@gmail.com"
 *                 DateOfBirth:
 *                   type: string
 *                   format: date
 *                   example: "2003-11-18"
 *                 gender:
 *                   type: string
 *                   example: "Female"
 *                 ethnicity:
 *                   type: string
 *                   example: "Caucasian"
 *                 phoneNumber:
 *                   type: string
 *                   example: "+201145551358"
 *       404:
 *         description: User not found.
 */


userRouter.get('/profile', protect, getProfile);

export default userRouter;