import {Router} from 'express';
import { getAllQuestions, submitResponses, getDetectionHistory,  } from '../controllers/diagnosis.controller.js';
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
 * /api/diagnosis/responses:
 *   post:
 *     summary: Submit symptom responses
 *     description: Validates and stores the user's submitted symptom answers.
 *     tags:
 *       - Diagnosis
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               responses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionNumber:
 *                       type: number
 *                       example: 1
 *                     answer:
 *                       type: string
 *                       example: "Yes"
 *     responses:
 *       201:
 *         description: 
 *           success: true, Responses submitted successfully.
 *       400:
 *         description: |
 *           Possible errors:
 *             - "Unknown question number: {entry.questionNumber}"
 *             - "Invalid answer for question: {q.questionText}"
 *       500:
 *         description: Internal server error
 */

diagnosisRouter.post('/responses', protect, submitResponses);

/**
 * @swagger
 * /api/diagnosis/history:
 *   get:
 *     summary: Get detection history
 *     description: Retrieves the user's detection history sorted descendingly by submission date.
 *     tags:
 *       - Diagnosis
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 
 *          success: true, history returned with formatted questions and answers
 *       500:
 *         description: Internal server error
 */

diagnosisRouter.get('/history', protect, getDetectionHistory);

export default diagnosisRouter;