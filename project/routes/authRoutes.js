const express = require('express');
const router = express.Router();
const { 
  login, 
  getMe, 
  changePassword 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/login', login);

// Protected routes
router.use(protect);
router.get('/me', getMe);
router.put('/change-password', changePassword);

module.exports = router;