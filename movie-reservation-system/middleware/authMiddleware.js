const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // 1. Look for the token in the HTTP Headers
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access Denied. No valid token provided.' });
  }

  // 2. Extract the actual token (remove the word "Bearer ")
  const token = authHeader.split(' ')[1];

  try {
    // 3. Cryptographically verify the token using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Attach the user's ID to the request so the controller can use it
    req.user = decoded; 
    
    // 5. Let them pass!
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = verifyToken;