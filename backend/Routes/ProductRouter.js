const { ensureAuthenticated, authorizeRoles } = require('../Middlewares/Auth');

const router = require('express').Router();

// Existing product route — unchanged behaviour
router.get('/', ensureAuthenticated, (req, res) => {
    res.status(200).json([
        { name: "mobile", price: 100000 },
        { name: "tv", price: 200000 },
    ]);
});

// ── Example RBAC route ──────────────────────────────────────────────────────
// Only supervisors and wardens (and above) may access this.
// To protect any route: stack ensureAuthenticated then authorizeRoles(...roles)
router.get(
    '/test-supervisor',
    ensureAuthenticated,
    authorizeRoles('supervisor', 'warden', 'chiefWarden', 'director'),
    (req, res) => {
        res.status(200).json({
            message: `Welcome, ${req.user.role}! You have supervisor-level access.`,
            success: true,
        });
    }
);

module.exports = router;