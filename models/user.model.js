import mongoose from 'mongoose';
import Counter from './counter.model.js'; // Import the Counter model
import m2s from 'mongoose-to-swagger'; // FOR SWAGGER DOCS     وحسبي الله ونعم الوكيل ديه معروفة
import { parsePhoneNumberFromString } from 'libphonenumber-js'; 

// اهلا بيك في النسخة العربية من المبرمج الالي
//  اسمي الزنجباري
// سأقوم بعمل باك خالي من المشاكل ان شاء الله    

const userSchema = new mongoose.Schema({
    _id: Number, //  User ID, separated from others
    
    username: {
        type: String,
        trim: true,
        unique: [true, "Username is already taken"],
        required: [true, "Username is required"],
        minLength: [5, "Username must be at least 5 characters long"],
        maxLength: [50, "Username must be at most 50 characters long"], 
        validate: {
          validator: function (value) {
            return /^(?=.*[\d_])[a-zA-Z0-9._]+$/.test(value);
          },
          message: "Username can only contain letters, numbers, periods, and underscores",
        }
    },

    email: {
        type: String,
        trim: true,
        match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, "Please enter a valid email address"],
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        minLength: 5,
        maxLength: 320
    },

    gender: {
        type: String,
        required: [true, "This field is required"],
        options:[String]
    },

    password: {
        type: String,
        required: [true, "Password is required"],
        minLength:8,
        validate: {
            validator: function (value) {
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(value);
            },
            message: "Password must be at least 8 characters long, include at least one lowercase letter, one uppercase letter, one number, and one special character"
        }
    },

    country: {
        type: String,
        required: [true, "Country is required"],
        options:[String]
        
    },

    DateOfBirth: {
        type: Date,
        required: [true, "Date of Birth is required"],
        validate: {
            validator: function (value) {
                const today = new Date();
                return value <= today; // Ensures date is not in the future
            },
            message: "Date of Birth cannot be in the future.",
        },
    },

    phoneNumber: {
        type: String,  // Use String to prevent issues with leading zeros
        unique: true,
        trim: true,
        required: [true, "Phone number is required"],
        validate: {
            validator: function (value) {
                const PhoneNumber = parsePhoneNumberFromString(value);
                return PhoneNumber && PhoneNumber.isValid();
            },
            message: "Invalid Phone Number",
        },
    },

    ethnicity: {  
        type: String,
        required: [true, "This field is required"],
        options:[String],
        trim: true,
    },
    googleId: String,
    facebookId: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    authProvider: { 
        type: String, enum: ["local", "google", "facebook"], required: true, default: "local" }
}, { timestamps: true }, {autoIndex: false}); //avoiding indexes duplication


// Confirm password field (virtual aka isn't stored in the DB)
userSchema.virtual('confirmPassword')
  .set(function (value) {
    this._confirmPassword = value;
  })
  .get(function () {
    return this._confirmPassword;
  });
 
let countryCallingCode; // Retrieved from dropdown selection
let localPhoneNumber; // User-entered local phone number

// Concatenate to form the full international phone number
const fullPhoneNumber = `${countryCallingCode}${localPhoneNumber}`;
// code to extract country code
  const getCountryCode = (fullPhoneNumber) => {
    const parsedNumber = parsePhoneNumberFromString(fullPhoneNumber);
    return parsedNumber ? parsedNumber.countryCallingCode : "00"; 
};
// Auto-generate _id
userSchema.pre("save", async function (next) {
    if (!this._id) {
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => { //3ashan el counter may3desh we howa el user mat3mlesh 3eeb b2a dah mesh sho8el counters
                //8eyrtaha badel "startTransaction" to "withTransaction"
                const countryCode = getCountryCode(this.phoneNumber);

                // Increment the counter inside the transaction
                const counter = await Counter.findOneAndUpdate(
                    { _id: "counter" },
                    { $inc: { sequence_value: 1 } },
                    { new: true, upsert: true, session }
                );

                if (!counter) throw new Error("Failed to retrieve counter");

                this._id = parseInt(`${counter.sequence_value}${countryCode}`);

                //Mongoose will handle saving inside the transaction
            });

            session.endSession();
            next();
        } catch(error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
    } else {
        next();
    }
});

const User = mongoose.model('User', userSchema);
const swaggerSchema = m2s(User)
export default User; 
export { swaggerSchema }; // Export the swagger schema for documentation purposes