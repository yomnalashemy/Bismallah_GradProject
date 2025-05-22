import {Router} from 'express';
import { getAllQuestions, getDetectionHistory, submitResponsesAndDiagnose, deleteDetectionById, deleteAllDetectionHistory } from '../controllers/diagnosis.controller.js';
import protect from '../middlewares/auth.middleware.js';
const diagnosisRouter = Router();

//path: /api/diagnosis

/**
 * @swagger
 * /api/diagnosis/questions:
 *   get:
 *     summary: Get all symptom questions
 *     description: Retrieves all symptom questions from the database, sorted ascendingly by question number.
 *     tags:
 *       - Diagnosis
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description:  
 *          success: true, questions
 *       500:
 *         description: Internal server error
 */
diagnosisRouter.get('/questions', protect, getAllQuestions);


/**
 * @swagger
 * /api/diagnosis/history:
 *   get:
 *     summary: Get user's diagnosis history
 *     description: Retrieves all past symptom submissions for the authenticated user, including their answers and diagnosis result.
 *     tags:
 *       - Symptom Diagnosis
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: History retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-04-21T19:45:32.000Z"
 *                       result:
 *                         type: integer
 *                         example: 1
 *                       resultLabel:
 *                         type: string
 *                         example: "Lupus signs detected"
 *                       responses:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             question:
 *                               type: string
 *                               example: "(ANA) What is the result of your ANA test?"
 *                             answer:
 *                               type: string
 *                               example: "Positive"
 *       500:
 *         description: An unexpected error occurred while retrieving the history.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */
diagnosisRouter.get('/history', protect, getDetectionHistory);

/**
 * @swagger
 * /api/diagnosis/detection:
 *   post:
 *     summary: Submit symptom responses and get a lupus diagnosis
 *     description: >
 *       Submits 27 user responses (all mandatory except Q20), encodes them, sends them to the AI diagnosis model, receives the result, and saves the submission.  
 *       - Q20 is required **only if** Q19 = "Yes".  
 *       - The AI model returns 0 or 1 (Not Likely / Likely Lupus).
 *     tags:
 *       - Symptom Detection
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - responses
 *             properties:
 *               responses:
 *                 type: array
 *                 description: Array of 27 responses (Q20 is conditional)
 *                 items:
 *                   type: object
 *                   required:
 *                     - questionNumber
 *                     - answer
 *                   properties:
 *                     questionNumber:
 *                       type: integer
 *                       example: 1
 *                     answer:
 *                       type: string
 *                       example: "Yes"
 *     responses:
 *       201:
 *         description: Diagnosis completed and saved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Diagnosis completed and saved
 *                 data:
 *                   type: object
 *                   properties:
 *                     result:
 *                       type: string
 *                       example: "You're all clear! No signs of lupus are detected."
 *                     code:
 *                       type: integer
 *                       example: 1
 *       400:
 *         description: >
 *           Bad request - Possible causes:  
 *           • Missing required question (Q1–Q27 except Q20)  
 *           • Q20 missing when Q19 = Yes  
 *           • Invalid answer for a question  
 *           • Unknown question number
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Question 5 is required.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 
 *                      Prediction error: Internal server error from AI model
 */
diagnosisRouter.post('/detection', protect, submitResponsesAndDiagnose);

/**
 * @swagger
 * /api/diagnosis/history/{id}:
 *   delete:
 *     summary: Delete a specific detection result
 *     description: Deletes one detection result for the authenticated user based on the entry ID.
 *     tags:
 *       - Detection History
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the detection entry (MongoDB ObjectId)
 *       - in: query
 *         name: lang
 *         required: false
 *         schema:
 *           type: string
 *           enum: [en, ar]
 *         description: Language for the response messages
 *     responses:
 *       200:
 *         description: Detection result deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Detection result not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

diagnosisRouter.delete('/history/:id', protect, deleteDetectionById);

/**
 * @swagger
 * /api/diagnosis/history:
 *   delete:
 *     summary: Delete all detection results for the current user
 *     description: Deletes all detection results submitted by the currently authenticated user.
 *     tags:
 *       - Detection History
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lang
 *         required: false
 *         schema:
 *           type: string
 *           enum: [en, ar]
 *         description: Language for the response messages
 *     responses:
 *       200:
 *         description: All detection results deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: No detection history to delete
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

diagnosisRouter.delete('/history', protect, deleteAllDetectionHistory);
export default diagnosisRouter;