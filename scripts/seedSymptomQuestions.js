import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SymptomQuestion from '../models/symptomsQuestions.model.js';

dotenv.config({path:`.env.${process.env.NODE_ENV || "development"}.local`});
const { DB_URI } = process.env;
await mongoose.connect(DB_URI); //كنت لازم احدد مسار الفايل عشان لوحدها بتجيب الجاهزة فسبب ايرور

const questions = [
    {text: "What is the result of your ANA (anti-nuclear antibody) lab test?", options:["Positive", "Negative"], 
      explanation: "It’s a blood test that checks the antibodies in your blood if greater than 1:80 then its positive otherwise negative."},
    {text: "Have you experienced unexplained, recurrent fever above 38°C (100.4°F)?", options:["Yes", "No"],
      explanation: "Unexplained fevers that aren't due to obvious infection can be a sign that your immune system is overactive."},
    {text: "Following the complete blood count (CBC), what is your white blood cell (WBC) count?", options:["Low", "Normal"], 
      explanation: " Leukopenia means having a low number of white blood cells due to immune system attacks on cells."},
    {text: "Following the complete blood count (CBC), What is your platelets result?", options:["Low", "Normal"],
      explanation: "Thrombocytopenia means having low platelets (blood cells that help with clotting), which can lead to bruising or bleeding. You must find this answer in your CBC lab test. (if platelet count < 100,000/mcL then its low)."},
    {text: "What is the result of Direct antiglobulin (Direct Coombs) test?", options:["Positive", "Negative"],
      explanation: "An effect due to immune system attacking red blood cells."},
    {text: "Have you experienced any periods of confusion, disorientation, or difficulty thinking clearly?", options:["Yes", "No"], 
      explanation: " changes in mental state due to lupus effects like feeling (inattention, lethargy, confusion, unstable awareness, mood changes)"},
    {text: "Have you experienced situations where you were feeling unreal, dissociated or unusual thoughts?", options:["Yes", "No"], 
      explanation: "This appears due to lupus effects on the nervous system, effects like (Hallucinations, Delusions, Disorganized speech, repeating words or using made-up words, disorganized behavior, Confused thoughts)."},
    {text: "Have you ever had a seizure or convulsion?", options:["Yes", "No"],
      explanation: "Seizures occur due to lupus effects on the brain or nervous system like feeling (involuntary movements, drooling, jaw clenching, loss of control, unconsciousness, and post-event confusion)."},
    {text: "Have you noticed unusual hair loss where the scalp appears normal?", options:["Yes", "No"],
      explanation: "This type of hair loss occurs when lupus affects the hair follicles, but the hair can often grow back."},
    {text: "Have you had any painful sores in your mouth, particularly on your mouth palate", options:["Yes", "No"], 
      explanation: "These are painful sores that can appear in the mouth."},
    {text: "Have you developed any round, scaly patches on your skin that might leave scars?", options:["Yes", "No"],
      explanation: "These are distinct circular rashes that can leave scarring and skin discoloration." },
    {text: "Have you noticed any red, scaly, or ring-shaped rashes on your skin? These rashes usually don’t leave scars but might be sensitive to sunlight.", options:["Yes", "No"],
      explanation: "Flat, red or flaky patches on the skin that might sting in sunlight but don’t usually leave marks."
     },
    {text: "Have you noticed a rash on your cheeks and nose, sometimes called a butterfly rash?", options:["Yes", "No"] },
    {text: "Have you experienced chest pain that increases while breathing?", options:["Yes", "No"] },
    {text: "Have you experienced chest pain and shortness of breath or has any doctor mentioned fluid around your heart? ", options:["Yes", "No"] },
    {text: "Has any chest pain affected your daily activities, like walking or climbing stairs?", options:["Yes", "No"] },
    {text: "Do you have joint pain or swelling that moves from one joint to another?", options:["Yes", "No"] },
    {text: "After doing the Urine test. What is the protein levels result?", options:["High", "Normal"] },
    {text: "Has a kidney biopsy shown any mild to moderate changes or significant to any changes?", options:["Yes", "No"] },
    {text: "Do you know which class your biopsy showed? (Select one)", 
        options:["Class 2", "Class 3", "Class 4", "Class 5"] },
    {text: "Has any blood test shown positive for anticardiolipin antibodies?", options:["Yes", "No"] },
    {text: "Has any blood test shown positive for anti-β2GP1 antibodies?", options:["Yes", "No"] },
    {text: "Has any blood test shown positive for lupus anticoagulant?", options:["Yes", "No"] },
    {text: "Following the total Complement Blood (CH50) test, what is your C3 protein result?", options:["Low", "Normal"] },
    {text: "Following the total Complement Blood (CH50) test, What is your C4 protein result?", options:["Low", "Normal"] },
    {text: "Has any blood test shown positive for anti-dsDNA antibodies?", options:["Yes", "No"] },
    {text: "Has any blood test shown positive for anti-Smith antibodies?", options:["Yes", "No"] },
    
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