import SymptomQuestion from '../models/symptomsQuestions.model.js';
import SymptomResponse from '../models/symptomsResponse.model.js';
import axios from 'axios';
import { AI_API_URL } from '../config/env.js';

export const getAllQuestions = async (req, res, next) => {
    try {
      const questions = await SymptomQuestion.find().sort({ questionNumber: 1 }); //Sorts AESCENDINGLY
      res.status(200).json({ success: true, questions });
    } catch (error) {
      next(error);
    }
  };

  export const getDetectionHistory = async (req, res, next) => {
    try {
      const userId = req.user._id;
  
      const history = await SymptomResponse.find({ user: userId }).sort({ submittedAt: -1 });
  
      const formatted = history.map(entry => ({
        date: entry.submittedAt,
        result: entry.result, 
        resultLabel: entry.result === 1 ? "Lupus signs detected" : "No lupus signs are detected",
        responses: entry.responses.map(r => ({
          question: r.questionText,
          answer: r.answer
        }))
      }));
  
      res.status(200).json({ success: true, history: formatted });
    } catch (error) {
      next(error);
    }

  throw lastError; // throw after all retries fail
}

