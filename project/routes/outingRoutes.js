const express = require('express');
const router = express.Router();
const { 
  getOutings, 
  getOuting, 
  createOuting, 
  updateOuting, 
  deleteOuting,
  recordOutTime,
  recordInTime,
  getPendingOutings
} = require('../controllers/outingController');
const { protect, authorize } = require('../middleware/auth');

// Routes that need protection
router.use(protect);

// Routes for all authenticated users
router.route('/')
  .get(getOutings);

router.route('/:id')
  .get(getOuting);

// Routes for students only
router.route('/')
  .post(createOuting);

// Routes for all authenticated users
router.route('/:id')
  .put(updateOuting)
  .delete(deleteOuting);

// Routes only for admins
router.use('/admin', authorize('caretaker', 'chiefwarden', 'warden', 'adsw', 'dsw'));

router.route('/admin/pending')
  .get(getPendingOutings);

router.route('/admin/:id/out')
  .put(recordOutTime);

router.route('/admin/:id/in')
  .put(recordInTime);

module.exports = router;