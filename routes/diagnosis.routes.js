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
diagnosisRouter.post('/detection', protect, submitResponsesAndDiagnose);
export default diagnosisRouter;