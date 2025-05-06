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

  export const getDetectionHistory = async (req, res, next) => {
    try {
      const userId = req.user._id;
  
      const history = await SymptomResponse.find({ user: userId }).sort({ submittedAt: -1 });
  
      const formatted = history.map(entry => ({
        date: entry.submittedAt,
        result: entry.result, 
        resultLabel: entry.result === 1 ? "Likely Lupus" : "Not Likely Lupus", 
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
  

  
export const submitResponsesAndDiagnose = async (req, res, next) => {
    try {
      const userId = req.user._id;
      const submitted = req.body.responses; // [{ questionNumber, answer }]
  
      if (!Array.isArray(submitted) || submitted.length === 0) {
        return res.status(400).json({ error: "No responses submitted." });
      }
  
      // Check required questions
      const requiredQuestions = Array.from({ length: 27 }, (_, i) => i + 1).filter(q => q !== 20);
      const submittedMap = new Map(submitted.map(r => [r.questionNumber, r.answer]));
  
      for (const qNum of requiredQuestions) {
        if (!submittedMap.has(qNum)) {
          return res.status(400).json({ error: `Question ${qNum} is required.` });
        }
      }
  
      // Q20 required only if Q19 = "Yes"
      if (submittedMap.get(19) === "Yes" && !submittedMap.has(20)) {
        return res.status(400).json({ error: "Question 20 is required when question 19 is answered 'Yes'." });
      }
  
      const responses = [];
      const answerMap = {}; // { questionNumber: answer }
  
      for (const entry of submitted) {
        const q = await SymptomQuestion.findOne({ questionNumber: entry.questionNumber });
        if (!q) {
          return res.status(400).json({ error: `Unknown question number: ${entry.questionNumber}` });
        }
  
        if (!q.options.includes(entry.answer)) {
          return res.status(400).json({ error: `Invalid answer for question: ${q.questionText}` });
        }
  
        responses.push({
          questionNumber: q.questionNumber,
          questionText: q.questionText,
          answer: entry.answer
        });
  
        answerMap[entry.questionNumber] = entry.answer;
      }
  
      const encode = (val, pos = "Yes", one = 1, zero = 0) => val === pos ? one : zero;
  
      const discoid = encode(answerMap[11]);   // Q11
      const subacute = encode(answerMap[12]);  // Q12
      const acute = encode(answerMap[13]);     // Q13
  
      let skinLupusScore = 0;
      if (discoid === 1 && subacute === 0 && acute === 0) skinLupusScore = 3;
      else if (discoid === 0 && subacute === 1 && acute === 0) skinLupusScore = 1;
      else if (discoid === 0 && subacute === 0 && acute === 1) skinLupusScore = 2;
      else if (discoid === 1 && subacute === 1 && acute === 0) skinLupusScore = 3;
      else if (discoid === 1 && subacute === 0 && acute === 1) skinLupusScore = 2;
      else if (discoid === 1 && subacute === 1 && acute === 1) skinLupusScore = 2;
      else if (discoid === 0 && subacute === 0 && acute === 0) skinLupusScore = 0;
  
      const renalBiopsyClass = encode(answerMap[19]) === 1
        ? {
            "Class 2": 2,
            "Class 3": 3,
            "Class 4": 4,
            "Class 5": 5
          }[answerMap[20]] || 0
        : 0;
  
      const encodedInputs = [
        encode(answerMap[1], "Positive"),
        encode(answerMap[2]),
        encode(answerMap[3], "Low"),
        encode(answerMap[4], "Low"),
        encode(answerMap[5], "Positive"),
        encode(answerMap[6]),
        encode(answerMap[7]),
        encode(answerMap[8]),
        encode(answerMap[9]),
        encode(answerMap[10]),
        skinLupusScore,
        encode(answerMap[14]),
        encode(answerMap[15]),
        encode(answerMap[16]),
        encode(answerMap[17]),
        encode(answerMap[18], "High"),
        encode(answerMap[19]),
        renalBiopsyClass,
        encode(answerMap[21]),
        encode(answerMap[22]),
        encode(answerMap[23]),
        encode(answerMap[24], "Low"),
        encode(answerMap[25], "Low"),
        encode(answerMap[26]),
        encode(answerMap[27])
      ];
  
      const aiResponse = await axios.post("https://lupira-ai-dnmi.onrender.com/predict", {
        Ana_test: encodedInputs[0],
        Fever: encodedInputs[1],
        Leukopenia: encodedInputs[2],
        Thrombocytopenia: encodedInputs[3],
        Autoimmune_hemolysis: encodedInputs[4],
        Delirium: encodedInputs[5],
        Psychosis: encodedInputs[6],
        Seizure: encodedInputs[7],
        Non_scarring_alopecia: encodedInputs[8],
        Oral_ulcers: encodedInputs[9],
        Cutaneous_lupus: encodedInputs[10],
        Pleural_effusion: encodedInputs[11],
        Pericardial_effusion: encodedInputs[12],
        Acute_pericarditis: encodedInputs[13],
        Joint_involvement: encodedInputs[14],
        Proteinuria: encodedInputs[15],
        Renal_biopsy: encodedInputs[16],
        Renal_biopsy_class: encodedInputs[17],
        anti_cardiolipin_anitbody: encodedInputs[18],
        anti_b2gp1_antibody: encodedInputs[19],
        lupus_anticoagulant: encodedInputs[20],
        low_c3: encodedInputs[21],
        low_c4: encodedInputs[22],
        anti_dsDNA_antibody: encodedInputs[23],
        anti_smith_antibody: encodedInputs[24]
      });
  
      const diagnosisResult = aiResponse.data.prediction;
  
      const newSubmission = new SymptomResponse({
        user: userId,
        responses,
        result: diagnosisResult
      });
  
      await newSubmission.save();
  
      res.status(201).json({
        success: true,
        message: "Diagnosis completed and saved",
        data: {
          result: diagnosisResult === 1 ? "Our analysis indicates a potential presence of lupus" : "You're all clear! No signs of lupus are detected.",
          code: diagnosisResult
        }
      });
    } catch (error) {
      next(error);
    }
  };
  