import mongoose from 'mongoose';

const symptomQuestionSchema = new mongoose.Schema({
  questionNumber: {
    type: Number,
    required: true,
    unique: true
  },
 questionTextArabic: {
  type: String,
  required: true
},
optionsArabic: {
  type: [String],
  required: true
},
explanationArabic: {
  type: String
}
}, { timestamps: true }, {autoIndex: false});

const SymptomQuestion = mongoose.model('SymptomQuestion', symptomQuestionSchema);
export default SymptomQuestion;

