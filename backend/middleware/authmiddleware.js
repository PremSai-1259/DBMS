const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    console.log(`Auth check - Authorization header: ${authHeader ? 'present' : 'missing'}`);

    if (!token) {
      console.warn('No token provided in Authorization header');
      return res.status(401).json({ error: 'No token provided' });
    }

    console.log(`Token received, verifying with JWT_SECRET...`);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log(`Token verified for user: ${decoded.id}, role: ${decoded.role}`);
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    res.status(403).json({ error: 'Invalid or expired token', details: error.message });
  }
};

module.exports = authMiddleware;
