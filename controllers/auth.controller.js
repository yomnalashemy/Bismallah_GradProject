import mongoose from 'mongoose';
import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {sendWelcomeEmail} from '../utils/emailService.js';
import { parsePhoneNumberFromString } from 'libphonenumber-js'; // FOR VALID PHONE NUMBERS
import {JWT_SECRET, JWT_EXPIRES_IN} from '../config/env.js';

export const signUp = async (req, res, next) => {
    // يا كله يتنفذ يا كله ميتنفذش
    const session = await mongoose.startSession(); // Atomic DB Operations
    session.startTransaction();
    console.log(req.body);

    try{
        const {username, email, password, confirmPassword, phoneNumber, gender, country,
            DateOfBirth, ethnicity} = req.body; // Destructure the request body 
        
        // Check if user already exists, by email or phone number
        const existingUser = await User.findOne({$or:[{email}, {phoneNumber}]}); // Find the one document with that email
        if(existingUser){
            const error = new Error("User already exists");
            error.statusCode = 409;
            throw error;
        }
    

        if (!username || username.length < 5) {
            return res.status(400).json({ error: "Username must be at least 5 characters long!" });
        }

        const usernameRegex = /^(?=.*[\d_])[a-zA-Z0-9._]+$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({
                error: "Username can only contain letters, numbers, periods, and underscores!",
            });
        }

        const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Please enter a valid email address!" });
        }

       
        const parsedPhone = parsePhoneNumberFromString(phoneNumber);
        if (!parsedPhone || !parsedPhone.isValid()) {
            return res.status(400).json({ error: "Invalid phone number format!" });
        }



        //check if Passwords match
        if(password!==confirmPassword) {
           const error = new Error("Passwords don't match!");
           error.statusCode = 400;
           throw error;
        }

        if (!password || password.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters long!" });
        } //to atcually display the error هعيط
        
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                error: "Password must include at least one lowercase letter, one uppercase letter, one number, and one special character!",
            });
        }

        //hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        //creating new user
        //we didn't use newUsers.create() because it will
        //overwrite the custom ID logic and replace it with the default ID
        const newUser = new User ({
         username,
         email,
         country,
         phoneNumber,
         password: hashedPassword,
         DateOfBirth,
         ethnicity,
         gender,
         authProvider: "local"
        })

        newUser.confirmPassword = confirmPassword;

        await newUser.save({session}); //Here the id is auto-generated

        try {
            await sendWelcomeEmail(email, username);
        } catch (emailError) {
            await session.abortTransaction();
            session.endSession();

            // Email address doesn't exist or undeliverable
            if (emailError.message.includes("Invalid or undeliverable email address") || emailError.responseCode === 550) {
                return res.status(400).json({ error: "Email not found or undeliverable!" });
            }

            // Other email sending errors
            return res.status(500).json({ error: "Email not found or undeliverable!" });
        }


        
        await session.commitTransaction();
        session.endSession();

        const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });


        res.status(201).json({
            success:true,
            message:"User signed in successfully. A welcome email has been sent",
            data : {
             token,
             user:newUser
            }  
        })
    }
    catch(error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }

}

export const logIn = async (req, res, next) => {
    try{

        const {email, password} = req.body;
        const user = await User.findOne({email});

        if(!user){
            const error = new Error("User Not Found");
            error.statusCode = 401;
            throw error;
        }
        
        if (user.authProvider !== "local") {
            return res.status(400).json({ error: `Please log in with ${user.authProvider}.` });
        }


        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid) {
            const error = new Error('Invalid password');
            error.statusCode = 401;
            throw error;
          }
          const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        
        res.status(201).json({
            success: true,
            message: "User logged in successfully",
            data: {
                token,
                user
            }
        });
    }
    catch(error){
        next(error);
    }
}

// Logout for Normal Users (JWT-based Authentication)
export const logOut = async (req, res, next) => {
    try {
        // Invalidate token on frontend (since JWT is stateless)
        res.status(200).json({
            success: true,
            message: "User logged out successfully. Please clear token on client-side."
        });
    } catch (error) {
        next(error);
    }
};