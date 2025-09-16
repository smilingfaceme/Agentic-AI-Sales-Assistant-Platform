import jwt from 'jsonwebtoken';

const checkToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    // Check if token timestamp is older than 1 minute
    // Assume token payload has a 'timestamp' field (UNIX epoch in ms or s)
    next();
  });
};

export default checkToken;
