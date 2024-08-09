function errorHandler(err, req, res, next) {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong' });
  }



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
  
  module.exports = verifyToken;
  // module.exports = errorHandler;