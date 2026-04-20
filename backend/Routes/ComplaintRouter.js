const { createComplaint, getComplaints, updateComplaintStatus } = require('../Controllers/ComplaintController');
const { ensureAuthenticated } = require('../Middlewares/Auth');

const router = require('express').Router();

/** POST /api/complaint — file a new complaint */
router.post('/complaint', ensureAuthenticated, createComplaint);

/** GET /api/complaint — fetch complaints (role-filtered) */
router.get('/complaint', ensureAuthenticated, getComplaints);

/** PATCH /api/complaint/:id — update complaint status */
router.patch('/complaint/:id', ensureAuthenticated, updateComplaintStatus);

module.exports = router;
