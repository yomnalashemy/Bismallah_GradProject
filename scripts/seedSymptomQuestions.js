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
      explanation: "Leukopenia means having a low number of white blood cells due to immune system attacks on cells."},
    {text: "Following the complete blood count (CBC), What is your platelets result?", options:["Low", "Normal"],
      explanation: "Thrombocytopenia means having low platelets (blood cells that help with clotting), which can lead to bruising or bleeding. You must find this answer in your CBC lab test. (if platelet count < 100,000/mcL then its low)."},
    {text: "What is the result of Direct antiglobulin (Direct Coombs) test?", options:["Positive", "Negative"],
      explanation: "An effect due to immune system attacking red blood cells."},
    {text: "Have you experienced any periods of confusion, disorientation, or difficulty thinking clearly?", options:["Yes", "No"], 
      explanation: "Changes in mental state due to lupus effects like feeling (inattention, lethargy, confusion, unstable awareness, mood changes)"},
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
      explanation: "Flat, red or flaky patches on the skin that might sting in sunlight but don’t usually leave marks."},
    {text: "Have you noticed a rash on your cheeks and nose, sometimes called a butterfly rash?", options:["Yes", "No"], 
      explanation: "This is a characteristic rash that appears across the cheeks and bridge of the nose in a butterfly pattern."},
    {text: "Have you experienced chest pain that increases while breathing?", options:["Yes", "No"], 
      explanation: "An inflammation of the lining around your lungs, which can cause pain when breathing. There might be expansion on one side of the chest, or better to make Chest X-ray or Ultrasound or Computed tomography (CT) to make sure that you have pleural effusion."},
    {text: "Have you experienced chest pain and shortness of breath or has any doctor mentioned fluid around your heart? ", options:["Yes", "No"], 
      explanation: "Symptoms like shortness of breath or difficulty breathing (dyspnea), Discomfort when breathing while lying down."},
    {text: "Has any chest pain affected your daily activities, like walking or climbing stairs?", options:["Yes", "No"],
      explanation: "Inflammation of the outer layer heart that causes chest pain like sharp stabbing chest pain and sometimes causes pain in one or both shoulders."},
    {text: "Do you have joint pain or swelling that moves from one joint to another?", options:["Yes", "No"],
      explanation: "Lupus commonly causes pain and swelling in joints, often moving from one joint to another."},
    {text: "After doing the Urine test. What is the protein levels result?", options:["High", "Normal"],
      explanation: " This means protein is leaking into your urine, which can be a bad sign for the kidney."},
    {text: "Has a kidney biopsy shown any mild to moderate changes or significant to any changes?", options:["Yes", "No"],
      explanation: "A renal biopsy, also known as a kidney biopsy, is a medical procedure used to take a small sample of kidney tissue and examine it to know the kidney’s condition."},
    {text: "Which class your biopsy showed? (Select one)", 
        options:["Class 2", "Class 3", "Class 4", "Class 5"],
        explanation: "This is a follow-up questions to specify the biopsy class in case of presence." },
    {text: "Has any blood test shown positive for anticardiolipin antibodies?", options:["Yes", "No"], 
      explanation: "These are specific antibodies that can increase risk of blood clots. The answer of this question must be found in your Solid-phase enzyme-linked immunosorbent assays (ELISA) test."},
    {text: "Has any blood test shown positive for anti-β2GP1 antibodies?", options:["Yes", "No"],
      explanation: "These are antibodies that can also increase risk of blood clots. The answer of this question must be found in your Solid-phase enzyme-linked immunosorbent assays (ELISA) test."},
    {text: "Has any blood test shown positive for lupus anticoagulant?", options:["Yes", "No"], 
      explanation: "This is another type of antibody that can increase risk of blood clots. The answer of this question must be found in your PTT, LA-sensitive PTT or dilute Russell viper venom test (DRVVT)."},
    {text: "Following the total Complement Blood (CH50) test, what is your C3 protein result?", options:["Low", "Normal"],
      explanation: "C3 is part of your immune system that its low levels can indicate active lupus. The answer of this question must be found in your CH50 test (sometimes called CH100 or a total complement test)."},
    {text: "Following the total Complement Blood (CH50) test, What is your C4 protein result?", options:["Low", "Normal"],
      explanation: "Similar to C3, low C4 can indicate active lupus. The answer of this question must found in your CH50 test (sometimes called CH100 or a total complement test)."},
    {text: "Has any blood test shown positive for anti-dsDNA antibodies?", options:["Yes", "No"],
      explanation: "These are specific antibodies that are very characteristic of lupus. The answer of this question must found in your anti-dsDNA ELISA test. "},
    {text: "Has any blood test shown positive for anti-Smith antibodies?", options:["Yes", "No"],
      explanation: "These antibodies are highly specific for lupus if present. The answer of this question must found in your anti-Smith ELISA test."},
    
]

const formatted = questions.map((q, index) => ({
    questionNumber: index + 1,
    questionText : q.text, //كل سؤال يترقم صح ويتربط بسؤاله وده اسمهم في الريكويست
    options: q.options,
    explanation: q.explanation || null
}));

await SymptomQuestion.deleteMany({});
await SymptomQuestion.insertMany(formatted);

console.log("Detection questions seeded!");
process.exit();