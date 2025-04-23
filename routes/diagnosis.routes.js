import {Router} from 'express';
import { getAllQuestions, getDetectionHistory, submitResponsesAndDiagnose } from '../controllers/diagnosis.controller.js';
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
 *                         example: "Likely Lupus"
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
 *     summary: Submit 27 symptom responses and receive lupus diagnosis
 *     description: Accepts 27 user responses, validates, encodes them into 24 features, sends to AI model, receives diagnosis result (0 or 1), stores it with answers, and returns result.
 *     tags:
 *       - Symptom Diagnosis
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
 *                 description: List of 27 symptom answers
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
 *                       example: "Positive"
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
 *                       example: "Likely Lupus"
 *                     code:
 *                       type: integer
 *                       enum: [0, 1]
 *                       example: 1
 *       400:
 *         description: Bad request - invalid submission format or content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No responses submitted.
 *       500:
 *         description: Internal server error or AI API error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal Server Error
 */
diagnosisRouter.post('/detection', protect, submitResponsesAndDiagnose);
export default diagnosisRouter;