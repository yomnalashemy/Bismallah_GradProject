import mongoose from 'mongoose';

const symptomQuestionSchema = new mongoose.Schema({
  questionNumber: {
    type: Number,
    required: true,
    unique: true
  },
  questionText: {
    type: String,
    required: true
  },
 questionTextArabic: { 
    type: String, 
    required: true
  },
  options: { 
   type: [String], 
   required: true,
   category: String 
  },
  optionTextArabic: { 
    type: [String], 
    required: true
  },
  explanation: {
    type: String, 
    default: null
  },
  explanationArabic: {
    type: String, 
    default: null
  },
}, { timestamps: true }, {autoIndex: false});

const SymptomQuestion = mongoose.model('SymptomQuestion', symptomQuestionSchema);
export default SymptomQuestion;

