import jwt from 'jsonwebtoken';

const checkToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Access token missing' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      const message = err.name === 'TokenExpiredError' 
        ? 'Token expired' 
        : 'Invalid token';
      
      return res.status(403).json({ 
        success: false,
        message 
      });
    }
    
    req.user = user;
    next();
  });
};

export default checkToken;
