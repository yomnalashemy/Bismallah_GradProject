import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema({
  questionNumber: {
    type: Number,
    required: true
  },
  questionText:{
    type: String, // نسيت احطها فعملتلي ايرور ان الاسئلة ما بتظهرش
    required: true // This field is required to store the question text
  },
  answer: {
    type: String,
    required: true
  }
});

const symptomResponseSchema = new mongoose.Schema({
  user: {
    type: Number, //CUSTOM ID NOT OBJECT ID
    // كان سبب ايرور في التيست حسبي الله ونعم الوكيل
    ref: 'User',
    required: true
  },
  responses: {
    type: [responseSchema],
    required: true
  },

  result: {
    type: Number, // 0 or 1 or 2 or 3 or 4 or 5
    required: true
  },

  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const SymptomResponse = mongoose.model('SymptomResponse', symptomResponseSchema);
export default SymptomResponse;
