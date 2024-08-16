


function errorHandler(err, req, res, next) {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong' });
  }

  
  const verifyToken = async (req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '');
  
    if (!token) {
      return res.status(401).json({ message: 'Access Denied: No token provided' });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id); // Assuming you store user ID in token
      console.log('Decoded user:', req.user); // Debugging line
  
      if (!req.user) {
        return res.status(401).json({ message: 'Access Denied: User not found' });
      }
  
      next();
    } catch (err) {
      res.status(400).json({ message: 'Invalid token' });
    }
  };
  
  module.exports = verifyToken;
  
  // function verifyToken(req, res, next) {
  //   const authHeader = req.headers['authorization']; // Note: 'Authorization' should be lowercase 'authorization' in headers
  //   const token = authHeader && authHeader.split(' ')[1];
  
  //   if (!token) return res.status(401).json({ error: 'Access denied' });
  
  //   try {
  //     const decoded = jwt.verify(token, config.jwtSecret);
  //     req.user = decoded;
  //     next();
  //   } catch (error) {
  //     res.status(403).json({ error: 'Invalid or expired token' });
  //   }
  // }
  
  // module.exports = errorHandler;