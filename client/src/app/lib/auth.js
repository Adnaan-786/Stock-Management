import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET_KEY || 'your_secret_key';
const ALGORITHM = process.env.JWT_ALGORITHM || 'HS256';

export const signToken = (payload, expiresIn = 3600) => {
  return jwt.sign(payload, SECRET_KEY, {
    algorithm: ALGORITHM,
    expiresIn: expiresIn
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY, { algorithms: [ALGORITHM] });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    throw new Error('You are not authenticated');
  }
};

export const extractUser = (req) => {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('You are not authenticated');
  }
  
  const token = authHeader.replace(/^Bearer\s+/, '');
  // TODO: Add blacklist check if needed
  
  return verifyToken(token);
};
