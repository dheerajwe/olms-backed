const express = require('express');
const router = express.Router();
const { 
  getLeaves, 
  getLeave, 
  createLeave, 
  updateLeave, 
  deleteLeave,
  recordOutDate,
  recordInDate,
  getPendingLeaves
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');

// Routes that need protection
router.use(protect);

// Routes for all authenticated users
router.route('/')
  .get(getLeaves);

router.route('/:id')
  .get(getLeave);

// Routes for students only
router.route('/')
  .post(createLeave);

// Routes for all authenticated users
router.route('/:id')
  .put(updateLeave)
  .delete(deleteLeave);

// Routes only for admins
router.use('/admin', authorize('caretaker', 'chiefwarden', 'warden', 'adsw', 'dsw'));

router.route('/admin/pending')
  .get(getPendingLeaves);

router.route('/admin/:id/out')
  .put(recordOutDate);

router.route('/admin/:id/in')
  .put(recordInDate);

module.exports = router;