import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import {JWT_SECRET} from '../config/env.js';

export const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ error: "Unauthorized, no token provided." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = await User.findById(decoded.userId);
        next();
    } catch (error) {
        res.status(401).json({ error: "Not authorized, invalid or expired token." });
    }
};

export default protect;