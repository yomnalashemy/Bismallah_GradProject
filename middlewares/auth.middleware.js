// Example protect middleware
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { JWT_SECRET } from '../config/env.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = user; // 👈 this is the key
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

export default protect;