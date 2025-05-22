import jwt from 'jsonwebtoken';
import User from '../models/user.model.js'; // adjust path as needed

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      req.user = user; // This is essential
      next();
    } else {
      return res.status(401).json({ error: 'Not authorized, no token' });
    }
  } catch (error) {
    return res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

export default protect;