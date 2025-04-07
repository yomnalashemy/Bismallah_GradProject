import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SymptomQuestion from '../models/symptomsQuestions.model.js';

dotenv.config({path:`.env.${process.env.NODE_ENV || "development"}.local`});
const { DB_URI } = process.env;
await mongoose.connect(DB_URI); //كنت لازم احدد مسار الفايل عشان لوحدها بتجيب الجاهزة فسبب ايرور

/*
"Roof of the mouth"
يا ترى عاوزين السقف عادي ولا جبسون بورد
*/

const questions = [
    {text: "(ANA) What is the result of your ANA (anti-nuclear antibody) lab test?", options:["Positive", "Negative"] },
    {text: "(Fever) Have you experienced unexplained, recurrent fever above 38°C (100.4°F)?", options:["Yes", "No"] },
    {text: "(Leukopenia) Following the complete blood count (CBC), what is your white blood cell (WBC) count?", options:["Low", "Normal"] },
    {text: "(Thrombocytopenia) Following the complete blood count (CBC), What is your platelets result?", options:["Low", "Normal"] },
    {text: "(Autoimmune hemolysis) What is the result of Direct antiglobulin (Direct Coombs) test?", options:["Positive", "Negative"] },
    {text: "(Delirium) Have you experienced any periods of confusion, disorientation, or difficulty thinking clearly?", options:["Yes", "No"] },
    {text: "(Psychosis) Have you experienced situations where you were feeling unreal, dissociated or unusual thoughts?", options:["Yes", "No"] },
    {text: "(Seizure) Have you ever had a seizure or convulsion?", options:["Yes", "No"] },
    {text: "(Non-scarring Alopecia) Have you noticed unusual hair loss where the scalp appears normal?", options:["Yes", "No"] },
    {text: "(Oral  Ulcers) Have you had any painful sores in your mouth, particularly on your mouth palate", options:["Yes", "No"] },
    {text: "(Discoid Lupus) Have you developed any round, scaly patches on your skin that might leave scars?", options:["Yes", "No"] },
    {text: "(Acute Cutaneous Lupus) Have you noticed a rash on your cheeks and nose, sometimes called a butterfly rash?", options:["Yes", "No"] },
    {text: "(Pleural Effusion) Have you experienced chest pain that increases while breathing?", options:["Yes", "No"] },
    {text: "(Pericardial Effusion) Have you experienced chest pain and shortness of breath or has any doctor mentioned fluid around your heart? ", options:["Yes", "No"] },
    {text: "(Acute Pericarditis) Has any chest pain affected your daily activities, like walking or climbing stairs?", options:["Yes", "No"] },
    {text: "(Joint Involvement) Do you have joint pain or swelling that moves from one joint to another?", options:["Yes", "No"] },
    {text: "(Proteinuria) After doing the Urine test. What is the protein levels result?", options:["High", "Normal"] },
    {text: "(Renal Biopsy Lupus Nephritis) Has a kidney biopsy shown any mild to moderate changes or significant to any changes?", options:["Yes", "No"] },
    {text: "(Anti-cardiolipin Antibodies) Has any blood test shown positive for anticardiolipin antibodies?", options:["Yes", "No"] },
    {text: "(Anti-B2GP1 Antibodies) Has any blood test shown positive for anti-β2GP1 antibodies?", options:["Yes", "No"] },
    {text: "(Lupus Anticoagulant) Has any blood test shown positive for lupus anticoagulant?", options:["Yes", "No"] },
    {text: "(C3) Following the total Complement Blood (CH50) test, what is your C3 protein result?", options:["Low", "Normal"] },
    {text: "(C4) Following the total Complement Blood (CH50) test, What is your C4 protein result?", options:["Low", "Normal"] },
    {text: "(Anti-dsDNA Antibody) Has any blood test shown positive for anti-dsDNA antibodies?", options:["Yes", "No"] },
    {text: "(Anti-Smith Antibody) Has any blood test shown positive for anti-Smith antibodies?", options:["Yes", "No"] },
    
]

const formatted = questions.map((q, index) => ({
    questionNumber: index + 1,
    questionText : q.text, //كل سؤال يترقم صح ويتربط بسؤاله وده اسمهم في الريكويست
    options: q.options

}));

await SymptomQuestion.deleteMany({});
await SymptomQuestion.insertMany(formatted);

console.log("Detection questions seeded!");
process.exit();