require("dotenv").config();

const express = require("express");
const cors = require("cors");

const {
    createProxyMiddleware,
    fixRequestBody
} = require("http-proxy-middleware");

const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const authenticateToken = require("./middleware/authMiddleware");
const authorizeRoles = require("./middleware/roleMiddleware");

const app = express();

const PORT = 3000;


// ========================================
// CORS
// ========================================

app.use(cors({
    origin: [
        "http://localhost:5500",
        "http://127.0.0.1:5500"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization"
    ]
}));

// ========================================
// JSON MIDDLEWARE
// ========================================

app.use(express.json());


// ========================================
// RATE LIMITER
// ========================================

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,

    message: {
        message: "Too many requests. Please try again later."
    },

    standardHeaders: true,
    legacyHeaders: false
});


// ========================================
// AUTHENTICATION ROUTES
// ========================================

app.use("/auth", authRoutes);


// ========================================
// GATEWAY HEALTH CHECK
// ========================================

app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "Secure NMS API Gateway is running"
    });

});


// ========================================
// ADMIN ONLY - CREATE DEVICE
// ========================================

app.post(
    "/api/devices",

    apiLimiter,

    authenticateToken,

    authorizeRoles("ADMIN"),

    createProxyMiddleware({
        target: "http://localhost:4000",

        changeOrigin: true,

        headers: {
            "x-api-key": process.env.INTERNAL_API_KEY
        },

        on: {
            proxyReq: fixRequestBody
        }
    })
);


// ========================================
// GENERAL API ROUTES
// ADMIN + OPERATOR
// ========================================

app.use(
    "/api",

    apiLimiter,

    authenticateToken,

    authorizeRoles("ADMIN", "OPERATOR"),

    createProxyMiddleware({

        target: "http://localhost:4000",

        changeOrigin: true,

        headers: {
            "x-api-key": process.env.INTERNAL_API_KEY
        },

        on: {
            proxyReq: fixRequestBody
        },

        pathRewrite: (path) => {

            return `/api${path}`;

        }

    })
);


// ========================================
// ERROR HANDLER
// ========================================

app.use((err, req, res, next) => {

    console.error("Gateway error:", err);

    res.status(500).json({
        message: "Internal Gateway Error"
    });

});


// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {

    console.log(
        `API Gateway running on http://localhost:${PORT}`
    );

});