import {Router} from 'express';
import { getAllQuestions, submitResponses, getDetectionHistory,  } from '../controllers/diagnosis.controller.js';
import protect from '../middlewares/auth.middleware.js';
const diagnosisRouter = Router();

//path: /api/diagnosis
diagnosisRouter.get('/questions', protect, getAllQuestions);
diagnosisRouter.post('/responses', protect, submitResponses);
diagnosisRouter.get('/history', protect, getDetectionHistory);

export default diagnosisRouter;