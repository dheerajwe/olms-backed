const express = require('express');
const router = express.Router();
const { 
  getLeaveHistory, 
  getLeaveHistoryById,
  getStudentLeaveHistory
} = require('../controllers/leaveHistoryController');
const { protect, authorize } = require('../middleware/auth');

// Routes that need protection
router.use(protect);

// Routes for all authenticated users
router.route('/')
  .get(getLeaveHistory);

router.route('/:id')
  .get(getLeaveHistoryById);

router.route('/student/:studentId')
  .get(getStudentLeaveHistory);

module.exports = router;