const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const constants = require('../config/constants');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === 'student') {
      req.user = await Student.findById(decoded.id);
      req.userType = 'student';
    } else if (decoded.role === 'admin') {
      req.user = await Admin.findById(decoded.id);
      req.userType = 'admin';
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (req.userType !== 'admin' || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if admin has higher or equal role than specified
exports.hasMinRole = (minRole) => {
  return (req, res, next) => {
    if (req.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can access this route'
      });
    }

    const roleHierarchy = constants.ROLE_HIERARCHY;
    const userRoleLevel = roleHierarchy[req.user.role];
    const minRoleLevel = roleHierarchy[minRole];

    if (!userRoleLevel || !minRoleLevel || userRoleLevel < minRoleLevel) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} does not have sufficient privileges`
      });
    }

    next();
  };
};