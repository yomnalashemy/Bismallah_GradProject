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
  options: { 
   type: [String], //CAPITAL LETTER S, RAKZEY B2A 3EEB  KEFAYA ERRORS
  required: true,
  category: String 
  
  },
}, { timestamps: true }, {autoIndex: false});

const SymptomQuestion = mongoose.model('SymptomQuestion', symptomQuestionSchema);
export default SymptomQuestion;

