const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const constants = require('../config/constants');

// @desc    Get all admins
// @route   GET /api/admins
// @access  Private (Admin only)
exports.getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().populate('reportsTo', 'name role');
    
    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single admin
// @route   GET /api/admins/:id
// @access  Private (Admin only)
exports.getAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).populate('reportsTo', 'name role');

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Create new admin
// @route   POST /api/admins
// @access  Private (Admin with higher role only)
exports.createAdmin = async (req, res) => {
  try {
    // Check if creating admin has higher role than the one being created
    const roleHierarchy = constants.ROLE_HIERARCHY;
    const creatingAdminRoleLevel = roleHierarchy[req.user.role];
    const newAdminRoleLevel = roleHierarchy[req.body.role];
    
    if (creatingAdminRoleLevel <= newAdminRoleLevel) {
      return res.status(403).json({
        success: false,
        error: 'You can only create admins with lower role levels than yours'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
    
    const admin = await Admin.create(req.body);

    res.status(201).json({
      success: true,
      data: admin
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update admin
// @route   PUT /api/admins/:id
// @access  Private (Admin with higher role or self)
exports.updateAdmin = async (req, res) => {
  try {
    let admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    // Check if updating self or has higher role
    const roleHierarchy = constants.ROLE_HIERARCHY;
    const updatingAdminRoleLevel = roleHierarchy[req.user.role];
    const targetAdminRoleLevel = roleHierarchy[admin.role];
    
    if (req.user.id !== req.params.id && updatingAdminRoleLevel <= targetAdminRoleLevel) {
      return res.status(403).json({
        success: false,
        error: 'You can only update admins with lower role levels than yours'
      });
    }

    // If updating role, check if has permission
    if (req.body.role && req.body.role !== admin.role) {
      const newRoleLevel = roleHierarchy[req.body.role];
      
      if (updatingAdminRoleLevel <= newRoleLevel) {
        return res.status(403).json({
          success: false,
          error: 'You cannot assign a role equal to or higher than your own'
        });
      }
    }

    // If password is being updated, hash it
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }

    admin = await Admin.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Delete admin
// @route   DELETE /api/admins/:id
// @access  Private (Admin with higher role only)
exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    // Check if has higher role
    const roleHierarchy = constants.ROLE_HIERARCHY;
    const deletingAdminRoleLevel = roleHierarchy[req.user.role];
    const targetAdminRoleLevel = roleHierarchy[admin.role];
    
    if (deletingAdminRoleLevel <= targetAdminRoleLevel) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete admins with lower role levels than yours'
      });
    }

    await admin.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get subordinates (admins that report to this admin)
// @route   GET /api/admins/:id/subordinates
// @access  Private (Admin only)
exports.getSubordinates = async (req, res) => {
  try {
    const subordinates = await Admin.find({ reportsTo: req.params.id });
    
    res.status(200).json({
      success: true,
      count: subordinates.length,
      data: subordinates
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};