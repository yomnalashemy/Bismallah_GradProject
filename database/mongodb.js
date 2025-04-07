import mongoose from 'mongoose';
import {DB_URI, NODE_ENV} from '../config/env.js';

if(!DB_URI) {
    throw new Error('Please define the DB_URI inside the .env.<development/production>.local');
}

const connectToDatabase = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log(`Database connected in ${NODE_ENV} mode`);
    }
    catch (error) {
        console.log("Error connecting to  the database: ", error);
    }
}

export default connectToDatabase;