import SymptomQuestion from '../models/symptomsQuestions.model.js';
import SymptomResponse from '../models/symptomsResponse.model.js';
import axios from 'axios';
export const getAllQuestions = async (req, res, next) => {
    try {
      const questions = await SymptomQuestion.find().sort({ questionNumber: 1 }); //Sorts AESCENDINGLY
      res.status(200).json({ success: true, questions });
    } catch (error) {
      next(error);
    }
  };

  export const submitResponses = async (req, res, next) => {
    try {
      const userId = req.user._id;
      const submitted = req.body.responses; // [{ questionNumber, answer }]
  
      if (!Array.isArray(submitted) || submitted.length === 0) {
        return res.status(400).json({ error: "No responses submitted." });
      }
  
      const responses = []; //لغبطتني  في التيست بعد ما كتبت ال25 سؤال منها لله
  
      for (const entry of submitted) {
        const q = await SymptomQuestion.findOne({ questionNumber: entry.questionNumber });
        //غيرت ان الفرونت ياخد الرقم بس عشان اني اكتب السؤال بالكامل في التيست هياخد 200 سنه
        if (!q) {
          return res.status(400).json({ error: `Unknown question number: ${entry.questionNumber}` });
        }
  
        if (!q.options.includes(entry.answer)) {
          return res.status(400).json({ error: `Invalid answer for question: ${q.questionText}` });
        }
  
        responses.push({
          questionNumber: q.questionNumber,
          questionText: q.questionText,  //حفظ الاجابات في الداتا بيز
          answer: entry.answer
        });
      }
  
      const newSubmission = new SymptomResponse({
        user: userId,
        responses
      });
  
      await newSubmission.save();
  
      res.status(201).json({ success: true, message: "Responses submitted successfully." });
    } catch (error) {
      next(error);
    }
  };

  export const getDetectionHistory = async (req, res, next) => {
    try {
      const userId = req.user._id;
  
      const history = await SymptomResponse.find({ user: userId }).sort({ submittedAt: -1 }); //Sorts DESCENDINGLY
  
      const formatted = history.map(entry => ({
        date: entry.submittedAt,
        responses: entry.responses.map(r => ({
          question: r.questionText,
          answer: r.answer
        }))
      }));
  
      res.status(200).json({ success: true, history: formatted });
    } catch (error) {
      next(error);
    }
  };
  
export const diagnosis = async (req, res, next) => {

}