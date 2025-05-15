import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SymptomQuestion from '../models/symptomsQuestions.model.js';

dotenv.config({path:`.env.${process.env.NODE_ENV || "development"}.local`});
const { DB_URI } = process.env;
await mongoose.connect(DB_URI); //كنت لازم احدد مسار الفايل عشان لوحدها بتجيب الجاهزة فسبب ايرور

const questions = [
    {text: "What is the result of your ANA (anti-nuclear antibody) lab test?", 
     options: ["Positive", "Negative"], 
     explanation: "It’s a blood test that checks the antibodies in your blood if greater than 1:80 then its positive otherwise negative.",
     questionTextArabic: "ما هي نتيجة الفحص المخبري للأجسام المضادة للأجسام المضادة للنواة؟ما هي نتيجة الفحص المخبري للأجسام المضادة للأجسام المضادة للنواة (ANA)؟",
     optionsArabic: ["إيجابي" , "سلبي"],
     explanationArabic: "إنه اختبار دم يفحص الأجسام المضادة في دمك إذا كان أكبر من 1:80 فهو إيجابي وإلا فهو سلبي. "
    },

    {text: "Have you experienced unexplained, recurrent fever above 38°C (100.4°F)?", 
     options:["Yes", "No"],
     explanation: "Unexplained fevers that aren't due to obvious infection can be a sign that your immune system is overactive.",
     questionTextArabic: "هل عانيت من حمى متكررة غير مبررة ومتكررة أعلى من 38 درجة مئوية ( درجة فهرنهايت؟)",
     optionsArabic: ["نعم", "لأ"],    
     explanationArabic: "يمكن أن تكون الحمى غير المبررة التي لا ترجع إلى عدوى واضحة علامة على أن جهازك المناعي مفرط النشاط."
    },

    {text: "Following the complete blood count (CBC), what is your white blood cell (WBC) count?", 
     options: ["Low", "Normal"], 
     explanation: "Leukopenia means having a low number of white blood cells due to immune system attacks on cells.",
     questionTextArabic: "بعد تعداد الدم الكامل (CBC)، ما هو تعداد خلايا الدم البيضاء (WBC)؟",
     optionsArabic: ["منخفض", "طبيعي"],
     explanationArabic: "نقص الكريات البيض يعني انخفاض عدد خلايا الدم البيضاء بسبب هجمات الجهاز المناعي على الخلايا."
    },

    {text: "Following the complete blood count (CBC), What is your platelets result?", 
     options: ["Low", "Normal"],
     explanation: "Thrombocytopenia means having low platelets (blood cells that help with clotting), which can lead to bruising or bleeding. You must find this answer in your CBC lab test. (if platelet count < 100,000/mcL then its low).",
     questionTextArabic: "بعد تعداد الدم الكامل (CBC)، ما هي نتيجة الصفائح الدموية؟",
     optionsArabic: ["منخفض", "طبيعي"],
     explanationArabic: "نقص الصفيحات الدموية يعني انخفاض الصفائح الدموية (خلايا الدم التي تساعد في التجلط)، مما قد يؤدي إلى حدوث كدمات أو نزيف. يجب أن تجد هذه الإجابة في الفحص المخبري لتعداد الدم CBC. (إذا كان تعداد الصفائح الدموية أقل من 100,000/مكسل فهذا يعني انخفاضها)."
    },

    {text: "What is the result of Direct antiglobulin (Direct Coombs) test?",
     options:["Positive", "Negative"],
     explanation: "An effect due to immune system attacking red blood cells.",
     questionTextArabic: "ما هي نتيجة اختبار مضاد الغلوبولين المباشر (اختبار كومبس المباشر)؟",
     optionsArabic: ["إيجابي" , "سلبي"],
     explanationArabic: "تأثير ناتج عن مهاجمة الجهاز المناعي لخلايا الدم الحمراء."
    },

    {text: "Have you experienced any periods of confusion, disorientation, or difficulty thinking clearly?", 
     options:["Yes", "No"], 
     explanation: "Changes in mental state due to lupus effects like feeling (inattention, lethargy, confusion, unstable awareness, mood changes)",
     questionTextArabic: "هل مررت بأي فترات من الارتباك أو التوهان أو صعوبة في التفكير بوضوح؟",
     optionsArabic: ["نعم", "لأ"],
     explanationArabic: "تغيرات في الحالة العقلية بسبب تأثيرات الذئبة مثل الشعور (عدم الانتباه، والخمول، والارتباك، والوعي غير المستقر، وتغيرات المزاج)"
    },

    {text: "Have you experienced situations where you were feeling unreal, dissociated or unusual thoughts?", 
     options:["Yes", "No"], 
     explanation: "This appears due to lupus effects on the nervous system, effects like (Hallucinations, Delusions, Disorganized speech, repeating words or using made-up words, disorganized behavior, Confused thoughts).",
     questionTextArabic: "هل مررت بمواقف كنت تشعر فيها بأفكار غير واقعية أو منفصلة أو غير عادية؟",
     optionsArabic: ["نعم", "لأ"],
     explanationArabic: "يظهر هذا بسبب تأثيرات الذئبة على الجهاز العصبي، وهي تأثيرات مثل (الهلوسة، والأوهام، والكلام غير المنظم، وتكرار الكلمات أو استخدام كلمات مختلقة وسلوك غير منظم، والأفكار المشوشة)."
    },

    {text: "Have you ever had a seizure or convulsion?", 
     options:["Yes", "No"],
     explanation: "Seizures occur due to lupus effects on the brain or nervous system like feeling (involuntary movements, drooling, jaw clenching, loss of control, unconsciousness, and post-event confusion).",
     questionTextArabic: "هل أصبت بنوبة صرع أو تشنج من قبل؟",
     optionsArabic: ["نعم", "لأ"] ,
     explanationArabic: "تحدث النوبات بسبب تأثيرات مرض الذئبة على الدماغ أو الجهاز العصبي مثل الشعور (حركات لا إرادية، سيلان اللعاب، إطباق الفك، فقدان السيطرة، فقدان الوعي، الارتباك بعد الحدث)."
    },

    {text: "Have you noticed unusual hair loss where the scalp appears normal?", 
     options:["Yes", "No"],
     explanation: "This type of hair loss occurs when lupus affects the hair follicles, but the hair can often grow back.",
     questionTextArabic: "هل لاحظت تساقط الشعر بشكل غير عادي حيث تبدو فروة الرأس طبيعية؟",
     optionsArabic: ["نعم", "لأ"],
     explanationArabic: "ويحدث هذا النوع من تساقط الشعر عندما يؤثر مرض الذئبة على بصيلات الشعر، ولكن يمكن أن ينمو الشعر مرة أخرى في كثير من الأحيان."
    },

    {text: "Have you had any painful sores in your mouth, particularly on your mouth palate", 
     options:["Yes", "No"], 
     explanation: "These are painful sores that can appear in the mouth.",
     questionTextArabic: "هل عانيت من أي تقرحات مؤلمة في فمك، وخاصةً في حنك الفم",
     optionsArabic: ["نعم", "لأ"],
     explanationArabic: "وهي تقرحات مؤلمة يمكن أن تظهر في الفم."
    },

    {text: "Have you developed any round, scaly patches on your skin that might leave scars?",
     options:["Yes", "No"],
     explanation: "These are distinct circular rashes that can leave scarring and skin discoloration.",
     questionTextArabic: "هل ظهرت لديك أي بقع مستديرة متقشرة على جلدك قد تترك ندبات؟",
     optionsArabic: ["نعم", "لأ"],
     explanationArabic: "وهي عبارة عن طفح جلدي دائري مميز يمكن أن يترك ندوباً وتغيراً في لون الجلد."
    },

    {text: "Have you noticed any red, scaly, or ring-shaped rashes on your skin? These rashes usually don’t leave scars but might be sensitive to sunlight.",
     options:["Yes", "No"],
     explanation: "Flat, red or flaky patches on the skin that might sting in sunlight but don’t usually leave marks.",
     questionTextArabic: "هل لاحظت أي طفح جلدي أحمر أو متقشر أو على شكل حلقات على جلدك؟ لا تترك هذه الطفح الجلدي عادةً ندبات ولكنها قد تكون حساسة لأشعة الشمس.",
     optionsArabic: ["نعم", "لأ"],
     explanationArabic: "بقع مسطحة أو حمراء أو متقشرة على الجلد قد تلسع في ضوء الشمس ولكنها لا تترك عادةً علامات."
    },

    {text: "Have you noticed a rash on your cheeks and nose, sometimes called a butterfly rash?", 
     options:["Yes", "No"], 
     explanation: "This is a characteristic rash that appears across the cheeks and bridge of the nose in a butterfly pattern.",
     questionTextArabic: "هل لاحظت طفحًا جلديًا على خديك وأنفك، يسمى أحيانًا طفح الفراشة؟",
     optionsArabic: ["نعم", "لأ"],
     explanationArabic: "وهو طفح جلدي مميز يظهر على الخدين وجسر الأنف على شكل فراشة."
    },

    {text: "Have you experienced chest pain that increases while breathing?",
     options:["Yes", "No"], 
     explanation: "An inflammation of the lining around your lungs, which can cause pain when breathing. There might be expansion on one side of the chest, or better to make Chest X-ray or Ultrasound or Computed tomography (CT) to make sure that you have pleural effusion.",
     questionTextArabic: "هل عانيت من ألم في الصدر يزداد أثناء التنفس؟",
     optionsArabic: ["نعم", "لأ"],
     explanationArabic: "التهاب في البطانة المحيطة بالرئتين، والذي يمكن أن يسبب ألماً عند التنفس. قد يكون هناك توسع في جانب واحد من الصدر، أو من الأفضل إجراء تصوير الصدر بالأشعة السينية أو الموجات فوق الصوتية أو التصوير المقطعي المحوسب (CT) للتأكد من وجود انصباب جنبي."
    },

    {text: "Have you experienced chest pain and shortness of breath or has any doctor mentioned fluid around your heart?",
     options:["Yes", "No"], 
     explanation: "Symptoms like shortness of breath or difficulty breathing (dyspnea), Discomfort when breathing while lying down.",
     questionTextArabic: "هل عانيت من ألم في الصدر وضيق في التنفس أو هل ذكر لك أي طبيب وجود سوائل حول قلبك؟",
     optionsArabic: ["نعم", "لأ"],
     explanationArabic: "أعراض مثل ضيق التنفس أو صعوبة التنفس (عسر التنفس)، وعدم الراحة عند التنفس أثناء الاستلقاء."
    },

    {text: "Has any chest pain affected your daily activities, like walking or climbing stairs?", 
     options:["Yes", "No"],
     explanation: "Inflammation of the outer layer heart that causes chest pain like sharp stabbing chest pain and sometimes causes pain in one or both shoulders.",
     questionTextArabic: "هل أثر أي ألم في صدرك على أنشطتك اليومية، مثل المشي أو صعود السلالم؟",
     optionsArabic: ["نعم", "لأ"],
     explanationArabic: "التهاب الطبقة الخارجية للقلب الذي يسبب ألمًا في الصدر مثل ألم الصدر الحاد الطاعن وأحيانًا يسبب ألمًا في أحد الكتفين أو كليهما."
    },

    {text: "Do you have joint pain or swelling that moves from one joint to another?", 
     options:["Yes", "No"],
     explanation: "Lupus commonly causes pain and swelling in joints, often moving from one joint to another.",
     questionTextArabic: "هل تعاني من ألم في المفاصل أو تورم ينتقل من مفصل إلى آخر؟",
     optionsArabic: ["نعم", "لأ"],
     explanationArabic: "يسبب مرض الذئبة عادةً ألماً وتورماً في المفاصل، وغالباً ما ينتقل من مفصل إلى آخر."
    },

    {text: "After doing the Urine test, What is the protein levels result?", 
     options:["High", "Normal"],
     explanation: "This means protein is leaking into your urine, which can be a bad sign for the kidney.",
     questionTextArabic: "بعد إجراء اختبار البول، ما هي نتيجة مستويات البروتين؟",
     optionsArabic: ["مرتفع", "طبيعي"],
     explanationArabic: "هذا يعني أن البروتين يتسرب إلى البول، وهو قد يكون علامة سيئة للكلى."
    },

    {text: "Has a kidney biopsy shown any mild to moderate changes or significant to any changes?",
     options:["Yes", "No"],
     explanation: "A renal biopsy, also known as a kidney biopsy, is a medical procedure used to take a small sample of kidney tissue and examine it to know the kidney’s condition.",
     questionTextArabic: "هل أظهرت خزعة الكلى أي تغيرات طفيفة إلى متوسطة أو كبيرة إلى أي تغيرات؟",
     optionsArabic: ["نعم", "لأ"],
     explanationArabic: "الخزعة الكلوية، والمعروفة أيضًا باسم خزعة الكلى، هي إجراء طبي يُستخدم لأخذ عينة صغيرة من نسيج الكلى وفحصها لمعرفة حالة الكلية."
    },

  { text: "Which class your biopsy showed? (Select one)", 
    options:["Class 2", "Class 3", "Class 4", "Class 5"],
    explanation: "This is a follow-up question to specify the biopsy class in case of presence.",
    questionTextArabic: "ما الفئة التي أظهرتها الخزعة الخاصة بك؟ (اختر واحدة)",
    optionsArabic: ["الفئة 2", "الفئة 3", "الفئة 4", "الفئة 5"],
    explanationArabic: "هذا سؤال متابعة لتحديد فئة الخزعة في حالة وجودها."
  },

  {text: "Has any blood test shown positive for anticardiolipin antibodies?", 
   options:["Yes", "No"], 
   explanation: "These are specific antibodies that can increase risk of blood clots. The answer of this question must be found in your Solid-phase enzyme-linked immunosorbent assays (ELISA) test.",
   questionTextArabic: "هل أظهر أي اختبار دم إيجابي للأجسام المضادة للكارديوليبين؟",
   optionsArabic: ["نعم", "لأ"],
   explanationArabic: "هذه أجسام مضادة محددة يمكن أن تزيد من خطر الإصابة بجلطات الدم. يجب العثور على إجابة هذا السؤال في اختبار مقايسة الممتز المناعي الصلب المرتبط بالإنزيم (ELISA)."
 },

  {text: "Has any blood test shown positive for anti-β2GP1 antibodies?",
   options:["Yes", "No"],
   explanation: "These are antibodies that can also increase risk of blood clots. The answer of this question must be found in your Solid-phase enzyme-linked immunosorbent assays (ELISA) test.",
   questionTextArabic: "هل أظهر أي اختبار دم إيجابي للأجسام المضادة لـ β2GP1؟",
   optionsArabic: ["نعم", "لأ"],
   explanationArabic: "هذه أجسام مضادة يمكن أن تزيد أيضًا من خطر الإصابة بجلطات الدم. يجب العثور على إجابة هذا السؤال في اختبار مقايسة الممتز المناعي الصلب المرتبط بالإنزيم (ELISA)." 
  },

 {text: "Has any blood test shown positive for lupus anticoagulant?",
  options:["Yes", "No"], 
  explanation: "This is another type of antibody that can increase risk of blood clots. The answer of this question must be found in your PTT, LA-sensitive PTT or dilute Russell viper venom test (DRVVT).",
  questionTextArabic: "هل أظهر أي اختبار دم إيجابي لمضادات تخثر الذئبة؟",
  optionsArabic: ["نعم", "لأ"],
  explanationArabic: "هذا نوع آخر من الأجسام المضادة التي يمكن أن تزيد من خطر الإصابة بجلطات الدم. يجب العثور على إجابة هذا السؤال في اختبار PTT أو PTT الحساس لـ LA أو اختبار سم أفعى راسل المخفف (DRVVVT)."
  },

  {text: "Following the total Complement Blood (CH50) test, what is your C3 protein result?", 
   options:["Low", "Normal"],
   explanation: "C3 is part of your immune system that its low levels can indicate active lupus. The answer of this question must be found in your CH50 test (sometimes called CH100 or a total complement test).",
   questionTextArabic: "بعد اختبار الدم المكمل الكلي (CH50)، ما هي نتيجة بروتين C3؟",
   optionsArabic: ["منخفض", "طبيعي"],
   explanationArabic: "C3 هو جزء من جهازك المناعي الذي يمكن أن يشير انخفاض مستوياته إلى الإصابة بالذئبة النشطة. يجب العثور على إجابة هذا السؤال في اختبار CH50 (يُطلق عليه أحيانًا CH100 أو اختبار المكملات الكلية)."
  },

  {text: "Following the total Complement Blood (CH50) test, What is your C4 protein result?", 
   options:["Low", "Normal"],
   explanation: "Similar to C3, low C4 can indicate active lupus. The answer of this question must found in your CH50 test (sometimes called CH100 or a total complement test).",
   questionTextArabic: "بعد اختبار الدم المكمل الكلي (CH50)، ما هي نتيجة بروتين C4؟",
   optionsArabic: ["منخفض", "طبيعي"],
   explanationArabic: "على غرار C3، يمكن أن يشير انخفاض C4 إلى الإصابة بالذئبة النشطة. يجب العثور على إجابة هذا السؤال في اختبار CH50 (يُطلق عليه أحياناً CH100 أو اختبار المكملات الكلية)."
  },

 {text: "Has any blood test shown positive for anti-dsDNA antibodies?",
  options:["Yes", "No"],
  explanation: "These are specific antibodies that are very characteristic of lupus. The answer of this question must found in your anti-dsDNA ELISA test.",
  questionTextArabic: "هل أظهر أي اختبار دم إيجابي للأجسام المضادة للحمض النووي الريبي المنزوع الأكسجين؟",
  optionsArabic: ["نعم", "لأ"],
  explanationArabic: "هذه أجسام مضادة محددة مميزة جدًا لمرض الذئبة. يجب أن تكون إجابة هذا السؤال موجودة في اختبار مضادات الحمض النووي الريبي المنقوص الأكسجين (ELISA)."
 },

 {text: "Has any blood test shown positive for anti-Smith antibodies?", 
  options:["Yes", "No"],
  explanation: "These antibodies are highly specific for lupus if present. The answer of this question must found in your anti-Smith ELISA test.",
  questionTextArabic: "هل أظهر أي اختبار دم إيجابي للأجسام المضادة لسميث؟",
  optionsArabic: ["نعم", "لأ"],
  explanationArabic: "هذه الأجسام المضادة محددة للغاية لمرض الذئبة في حالة وجودها. يجب أن تكون إجابة هذا السؤال موجودة في اختبار ELISA المضاد للذئبة."
  },
    
]

const formatted = questions.map((q, index) => ({
  questionNumber: index + 1,
  questionText: q.text,
  questionTextArabic: q.questionTextArabic,
  options: q.options,
  optionsArabic: q.optionsArabic,
  explanation: q.explanation || null,
  explanationArabic: q.explanationArabic || null
}));

await SymptomQuestion.deleteMany({});
await SymptomQuestion.insertMany(formatted);

console.log("Detection questions seeded!");
process.exit();