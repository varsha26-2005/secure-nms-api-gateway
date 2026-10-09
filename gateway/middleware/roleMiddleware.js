const authorizeRoles = (...allowedRoles) => {

    return (req, res, next) => {

        // Check if user exists
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized. Please login first."
            });
        }

        // Check user's role
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied. Insufficient permissions."
            });
        }

        // Role is allowed
        next();
    };
};

module.exports = authorizeRoles;