import SymptomQuestion from '../models/symptomsQuestions.model.js';
import SymptomResponse from '../models/symptomsResponse.model.js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({path:`.env.${process.env.NODE_ENV || "development"}.local`});
const { AI_API_URL } = process.env;

export const getAllQuestions = async (req, res, next) => {
  try {
    const lang = req.query.lang === 'ar' ? 'ar' : 'en';
    const questions = await SymptomQuestion.find().sort({ questionNumber: 1 });

    const formatted = questions.map(q => ({
      _id: q._id,
      questionNumber: q.questionNumber,
      questionText: lang === 'ar' ? q.questionTextArabic : q.questionText,
      options: lang === 'ar' ? q.optionsArabic : q.options,
      explanation: lang === 'ar' ? q.explanationArabic : q.explanation,
      __v: q.__v,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt
    }));

    res.status(200).json({ success: true, questions: formatted });
  } catch (error) {
    next(error);
  }
};

export const getDetectionHistory = async (req, res, next) => {
  try {
    const lang = req.query.lang === 'ar' ? 'ar' : 'en';
    const userId = req.user._id;

    const history = await SymptomResponse.find({ user: userId }).sort({ submittedAt: -1 });

    const allQuestions = await SymptomQuestion.find();

    const formatted = history.map(entry => {
      const translatedResponses = entry.responses.map(r => {
        const matchingQuestion = allQuestions.find(q => q.questionNumber === r.questionNumber);
        return {
          question: lang === 'ar' ? matchingQuestion?.questionTextArabic : matchingQuestion?.questionText,
          answer: lang === 'ar'
            ? (matchingQuestion?.optionsArabic?.[matchingQuestion?.options?.indexOf(r.answer)] || r.answer)
            : r.answer
        };
      });

      return {
        id: entry._id,
        date: entry.submittedAt,
        result: entry.result,
        resultLabel: entry.result === 1
          ? (lang === 'ar' ? "تم رصد علامات تشير إلى الذئبة" : "Lupus signs detected")
          : (lang === 'ar' ? "لم يتم رصد علامات الذئبة" : "No lupus signs are detected"),
        responses: translatedResponses
      };
    });

    res.status(200).json({ success: true, history: formatted });
  } catch (error) {
    next(error);
  }
};

export const submitResponsesAndDiagnose = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const submitted = req.body.responses;
    const lang = req.query.lang === 'ar' ? 'ar' : 'en';
    const t = (en, ar) => lang === 'ar' ? ar : en;

    if (!Array.isArray(submitted) || submitted.length === 0) {
      return res.status(400).json({ error: t("No responses submitted.", "لم يتم إرسال أي إجابات.") });
    }

    const translateAnswer = (answer) => {
      const map = {
        "نعم": "Yes", "لا": "No", "إيجابي": "Positive", "سلبي": "Negative",
        "مرتفع": "High", "منخفض": "Low", "طبيعي": "Normal",
        "الفئة 2": "Class 2", "الفئة 3": "Class 3", "الفئة 4": "Class 4", "الفئة 5": "Class 5"
      };
      return map[answer] || answer;
    };

    const requiredQuestions = Array.from({ length: 27 }, (_, i) => i + 1).filter(q => q !== 20);
    const submittedMap = new Map(submitted.map(r => [r.questionNumber, translateAnswer(r.answer)]));

    for (const qNum of requiredQuestions) {
      if (!submittedMap.has(qNum)) {
        return res.status(400).json({ error: t(`Question ${qNum} is required.`, `يجب الإجابة على السؤال رقم ${qNum}.`) });
      }
    }

    const answer19 = submittedMap.get(19);
    const answer20 = submittedMap.get(20);

    if (answer19 === "Yes" && !answer20) {
      return res.status(400).json({
        error: t("Question 20 is required when question 19 is answered 'Yes'.", "يجب الإجابة على السؤال 20 إذا كانت الإجابة على السؤال 19 هي 'نعم'.")
      });
    }

    if (answer19 === "No" && answer20) {
      return res.status(400).json({
        error: t("Question 20 should not be answered when question 19 is 'No'.", "لا يجب الإجابة على فئة الخزعة إذا لم يتم إجراء خزعة.")
      });
    }

    const responses = [];
    const answerMap = {};

    for (const entry of submitted) {
      const translatedAnswer = translateAnswer(entry.answer);
      const q = await SymptomQuestion.findOne({ questionNumber: entry.questionNumber });

      if (!q) {
        return res.status(400).json({ error: t(`Unknown question number: ${entry.questionNumber}`, `رقم السؤال غير معروف: ${entry.questionNumber}`) });
      }

      if (!q.options.includes(translatedAnswer)) {
        return res.status(400).json({ error: t(`Invalid answer for question: ${q.questionText}`, `إجابة غير صالحة للسؤال: ${q.questionText}`) });
      }

      responses.push({
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        answer: translatedAnswer
      });

      answerMap[entry.questionNumber] = translatedAnswer;
    }

    const encode = (val, pos = "Yes", one = 1, zero = 0) => val === pos ? one : zero;

    const discoid = encode(answerMap[11]);
    const subacute = encode(answerMap[12]);
    const acute = encode(answerMap[13]);

    let skinLupusScore = 0;
    if (discoid && !subacute && !acute) skinLupusScore = 3;
    else if (!discoid && subacute && !acute) skinLupusScore = 1;
    else if (!discoid && !subacute && acute) skinLupusScore = 2;
    else if (discoid && subacute && !acute) skinLupusScore = 3;
    else if (discoid && !subacute && acute) skinLupusScore = 2;
    else if (discoid && subacute && acute) skinLupusScore = 2;
    else skinLupusScore = 0;

    let renalBiopsyScore = 0;
    if (answerMap[19] === "Yes") {
      const classScoreMap = {
        "Class 2": 2,
        "Class 3": 3,
        "Class 4": 4,
        "Class 5": 5
      };
      renalBiopsyScore = classScoreMap[answerMap[20]] || 0;
    }

    const payload = {
      Ana_test: encode(answerMap[1], "Positive"),
      Fever: encode(answerMap[2]),
      Leukopenia: encode(answerMap[3], "Low"),
      Thrombocytopenia: encode(answerMap[4], "Low"),
      Autoimmune_hemolysis: encode(answerMap[5], "Positive"),
      Delirium: encode(answerMap[6]),
      Psychosis: encode(answerMap[7]),
      Seizure: encode(answerMap[8]),
      Non_scarring_alopecia: encode(answerMap[9]),
      Oral_ulcers: encode(answerMap[10]),
      Cutaneous_lupus: skinLupusScore,
      Pleural_effusion: encode(answerMap[14]),
      Pericardial_effusion: encode(answerMap[15]),
      Acute_pericarditis: encode(answerMap[16]),
      Joint_involvement: encode(answerMap[17]),
      Proteinuria: encode(answerMap[18], "High"),
      Renal_biopsy: renalBiopsyScore,
      anti_cardiolipin_anitbody: encode(answerMap[21]),
      anti_b2gp1_antibody: encode(answerMap[22]),
      lupus_anticoagulant: encode(answerMap[23]),
      low_c3: encode(answerMap[24], "Low"),
      low_c4: encode(answerMap[25], "Low"),
      anti_dsDNA_antibody: encode(answerMap[26]),
      anti_smith_antibody: encode(answerMap[27])
    };

    console.log("Encoded Renal Biopsy Class:", renalBiopsyScore);
    console.log("Payload being sent to AI model:", JSON.stringify(payload, null, 2));

    let aiResponse;
    let attempts = 0;
    const maxRetries = 3;

    while (attempts < maxRetries) {
      try {
        aiResponse = await axios.post(`${AI_API_URL}/predict`, payload);
        break;
      } catch (err) {
        attempts++;
        if (attempts === maxRetries) {
          return res.status(503).json({ error: "AI diagnosis service unavailable. Please try again later." });
        }
      }
    }

    console.log("AI response received:", aiResponse.data);

    const diagnosisResult = aiResponse.data.prediction;

    await new SymptomResponse({
      user: userId,
      responses,
      result: diagnosisResult
    }).save();

    const message = diagnosisResult === 1
      ? (lang === 'ar' ? "تحليلنا يشير إلى احتمالية وجود الذئبة" : "Our analysis indicates a potential presence of lupus")
      : (lang === 'ar' ? "كل شيء على ما يرام! لم يتم الكشف عن علامات الذئبة" : "You're all clear! No signs of lupus are detected.");

    res.status(201).json({
      success: true,
      message: "Diagnosis completed and saved",
      data: {
        result: message,
        code: diagnosisResult
      }
    });

  } catch (error) {
    next(error);
  }
};


export const deleteAllDetectionHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const deleted = await SymptomResponse.deleteMany({ user: userId });

    if (deleted.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: req.query.lang === 'ar'
          ? "لا توجد نتائج للكشف لحذفها"
          : "No detection history to delete"
      });
    }

    res.status(200).json({
      success: true,
      message: req.query.lang === 'ar'
        ? "تم حذف جميع نتائج الكشف بنجاح"
        : "All detection history deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDetectionById = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const entry = await SymptomResponse.findOne({ _id: id, user: userId });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: req.query.lang === 'ar'
          ? "لم يتم العثور على نتيجة الكشف"
          : "Detection result not found"
      });
    }

    await SymptomResponse.deleteOne({ _id: id });

    res.status(200).json({
      success: true,
      message: req.query.lang === 'ar'
        ? "تم حذف النتيجة بنجاح"
        : "Detection result deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};
