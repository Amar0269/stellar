// Placeholder middleware for IoT route authentication.
// Replace the body of this function with real JWT verification when ready.
const verifyToken = (req, res, next) => {
  // TODO: Add token validation logic here
  // Example:
  // const token = req.headers['authorization'];
  // if (!token) return res.status(403).json({ message: 'Token required' });
  // const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // req.user = decoded;
  next();
};

module.exports = verifyToken;
