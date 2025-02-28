const express = require('express');
const router = express.Router();
const { 
  getAdmins, 
  getAdmin, 
  createAdmin, 
  updateAdmin, 
  deleteAdmin,
  getSubordinates
} = require('../controllers/adminController');
const { protect, authorize, hasMinRole } = require('../middleware/auth');

// Routes that need protection
router.use(protect);

// Routes only for admins
router.use(authorize('caretaker', 'chiefwarden', 'warden', 'adsw', 'dsw'));

router.route('/')
  .get(getAdmins);

router.route('/:id')
  .get(getAdmin);

router.route('/:id/subordinates')
  .get(getSubordinates);

// Routes for admins with minimum role of warden
router.route('/')
  .post(hasMinRole('warden'), createAdmin);

router.route('/:id')
  .put(updateAdmin)
  .delete(hasMinRole('warden'), deleteAdmin);

module.exports = router;