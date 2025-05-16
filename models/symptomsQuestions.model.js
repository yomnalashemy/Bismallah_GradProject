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
  required: true
},
optionsArabic: {
  type: [String],
  required: true
},
explanationArabic: {
  type: String,
  required: true
},
explanation: {
  type: String,
  required: true
},
}, { timestamps: true }, {autoIndex: false});

const SymptomQuestion = mongoose.model('SymptomQuestion', symptomQuestionSchema);
export default SymptomQuestion;

