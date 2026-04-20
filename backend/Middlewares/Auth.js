const jwt = require('jsonwebtoken');
const { ROLE_RANK } = require('../config/roles');

/**
 * Verifies the JWT and attaches decoded user (including role) to req.user.
 * Must be applied before authorizeRoles / authorizeMinRole.
 */
const ensureAuthenticated = (req, res, next) => {
    const auth = req.headers['authorization'];
    if (!auth) {
        return res.status(403)
            .json({ message: 'Unauthorized, JWT token is required' });
    }
    try {
        const decoded = jwt.verify(auth, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403)
            .json({ message: 'Unauthorized, JWT token wrong or expired' });
    }
};

/**
 * Role-based authorization middleware factory (exact role list).
 * Usage: authorizeRoles("supervisor", "warden")
 * Must be used AFTER ensureAuthenticated.
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
                success: false,
            });
        }
        next();
    };
};

/**
 * Hierarchy-based authorization middleware factory.
 * Allows any role whose rank is >= the specified minimum role's rank.
 * Usage: authorizeMinRole("supervisor")   →  allows supervisor, warden, chiefWarden, director, admin
 *
 * This is fully scalable — no role names need to be listed manually.
 */
const authorizeMinRole = (minRole) => {
    const minRank = ROLE_RANK[minRole];
    if (minRank === undefined) throw new Error(`authorizeMinRole: unknown role "${minRole}"`);

    return (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({ message: 'Unauthorized', success: false });
        }
        const userRank = ROLE_RANK[req.user.role] ?? -1;
        if (userRank < minRank) {
            return res.status(403).json({
                message: `Access denied. Minimum required role: ${minRole}`,
                success: false,
            });
        }
        next();
    };
};

module.exports = { ensureAuthenticated, authorizeRoles, authorizeMinRole };