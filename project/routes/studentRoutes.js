const express = require('express');
const router = express.Router();
const { 
  getStudents, 
  getStudent, 
  createStudent, 
  updateStudent, 
  deleteStudent,
  bulkCreateStudents,
  upgradeStudentYear,
  bulkUpgradeStudentYear,
  resetOutingCount,
  resetLeaveCount
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Routes that need protection
router.use(protect);

// Routes for all authenticated users
router.route('/:id').get(getStudent);

// Routes only for admins
router.use(authorize('caretaker', 'chiefwarden', 'warden', 'adsw', 'dsw'));

router.route('/')
  .get(getStudents)
  .post(upload.single('image'), createStudent);

router.route('/bulk')
  .post(bulkCreateStudents);

router.route('/:id')
  .put(upload.single('image'), updateStudent)
  .delete(deleteStudent);

router.route('/:id/upgrade-year')
  .put(upgradeStudentYear);

router.route('/bulk-upgrade-year')
  .put(bulkUpgradeStudentYear);

router.route('/reset-outing-count')
  .put(resetOutingCount);

router.route('/reset-leave-count')
  .put(resetLeaveCount);

module.exports = router;