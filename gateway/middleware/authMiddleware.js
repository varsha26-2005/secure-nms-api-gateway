require("dotenv").config();
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;


const authenticateToken = (req, res, next) => {

    // Get Authorization header
    const authHeader = req.headers["authorization"];

    // Expected format:
    // Authorization: Bearer <token>

    if (!authHeader) {
        return res.status(401).json({
            message: "Access denied. No token provided."
        });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Access denied. Invalid authorization format."
        });
    }

    // Verify token
    jwt.verify(token, JWT_SECRET, (err, user) => {

        if (err) {
            console.log("JWT ERROR:", err.message);
            return res.status(403).json({
                message: "Invalid or expired token."
            });
        }

        // Store decoded user information
        req.user = user;

        // Continue to next middleware
        next();
    });
};


module.exports = authenticateToken;