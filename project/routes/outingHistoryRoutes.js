const express = require('express');
const router = express.Router();
const { 
  getOutingHistory, 
  getOutingHistoryById,
  getStudentOutingHistory
} = require('../controllers/outingHistoryController');
const { protect, authorize } = require('../middleware/auth');

// Routes that need protection
router.use(protect);

// Routes for all authenticated users
router.route('/')
  .get(getOutingHistory);

router.route('/:id')
  .get(getOutingHistoryById);

router.route('/student/:studentId')
  .get(getStudentOutingHistory);

module.exports = router;