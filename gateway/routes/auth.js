require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const router = express.Router();


// Secret key for signing JWT tokens
const JWT_SECRET = process.env.JWT_SECRET;


// Temporary users
// We will move these to the database later.
const users = [
    {
        id: 1,
        username: "admin",
        password: bcrypt.hashSync("admin123", 10),
        role: "ADMIN"
    },
    {
        id: 2,
        username: "operator",
        password: bcrypt.hashSync("operator123", 10),
        role: "OPERATOR"
    },
    {
        id: 3,
        username: "viewer",
        password: bcrypt.hashSync("viewer123", 10),
        role: "VIEWER"
    }
];


// ========================================
// LOGIN
// ========================================

router.post("/login", async (req, res) => {

    const { username, password } = req.body;

    // Check whether credentials were provided
    if (!username || !password) {
        return res.status(400).json({
            message: "Username and password are required"
        });
    }

    // Find user
    const user = users.find(
        (user) => user.username === username
    );

    // User doesn't exist
    if (!user) {
        return res.status(401).json({
            message: "Invalid username or password"
        });
    }

    // Compare password with stored hash
    const passwordMatch = await bcrypt.compare(
        password,
        user.password
    );

    // Password is incorrect
    if (!passwordMatch) {
        return res.status(401).json({
            message: "Invalid username or password"
        });
    }

    // Create JWT token
    const token = jwt.sign(
        {
            id: user.id,
            username: user.username,
            role: user.role
        },
        JWT_SECRET,
        {
            expiresIn: "1h"
        }
    );

    // Send token to client
    res.json({
        message: "Login successful",
        token: token,
        user: {
            username: user.username,
            role: user.role
        }
    });
});


module.exports = router;