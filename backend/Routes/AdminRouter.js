const { getPendingUsers, approveUser, rejectUser } = require('../Controllers/AdminController');
const { ensureAuthenticated, authorizeRoles } = require('../Middlewares/Auth');

const router = require('express').Router();

// All admin routes require authentication + admin role
router.use(ensureAuthenticated, authorizeRoles('admin'));

/** GET /api/admin/users — list all unapproved users */
router.get('/users', getPendingUsers);

/** PATCH /api/admin/approve/:id — approve a pending user */
router.patch('/approve/:id', approveUser);

/** PATCH /api/admin/reject/:id — reject (delete) a pending user */
router.patch('/reject/:id', rejectUser);

module.exports = router;
