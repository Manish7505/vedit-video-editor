const { verifyToken } = require('@clerk/backend');

// Verify Clerk JWT token
const authenticateClerkToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Access token required',
        code: 'NO_TOKEN'
      });
    }

    // Verify the token with Clerk
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY
    });

    // Extract user information from Clerk token
    req.user = {
      id: payload.sub, // Clerk user ID
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      username: payload.preferred_username || payload.email?.split('@')[0],
      avatar: payload.picture,
      // Add any other Clerk claims you need
    };

    next();
  } catch (error) {
    console.error('Clerk auth middleware error:', error);
    
    if (error.name === 'ClerkJWTError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    res.status(500).json({ 
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalClerkAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY
      });

      req.user = {
        id: payload.sub,
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        username: payload.preferred_username || payload.email?.split('@')[0],
        avatar: payload.picture,
      };
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Check if user owns resource
const requireOwnership = (req, res, next) => {
  const resourceUserId = req.params.userId || req.body.userId;
  
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (req.user.id === resourceUserId) {
    return next();
  }

  return res.status(403).json({ 
    message: 'Access denied - insufficient permissions',
    code: 'INSUFFICIENT_PERMISSIONS'
  });
};

module.exports = {
  authenticateClerkToken,
  optionalClerkAuth,
  requireOwnership
};

