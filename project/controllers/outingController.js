const Outing = require('../models/Outing');
const Student = require('../models/Student');
const OutingHistory = require('../models/OutingHistory');
const constants = require('../config/constants');

// @desc    Get all outings
// @route   GET /api/outings
// @access  Private (Admin only)
exports.getOutings = async (req, res) => {
  try {
    let query;
    
    // If student, only get their outings
    if (req.userType === 'student') {
      query = Outing.find({ studentId: req.user.id });
    } 
    // If admin, get outings based on their role and block
    else {
      // For caretaker, only get outings from their block
      if (req.user.role === constants.ADMIN_ROLES.CARETAKER) {
        // Find students in this block
        const students = await Student.find({ hostelBlock: req.user.block });
        const studentIds = students.map(student => student._id);
        
        query = Outing.find({ studentId: { $in: studentIds } });
      } else {
        // For higher roles, get all outings
        query = Outing.find();
      }
    }
    
    // Populate student details
    query = query.populate({
      path: 'studentId',
      select: 'name phoneNumber year branch roomNo hostelBlock'
    }).populate({
      path: 'acceptedBy',
      select: 'name role'
    });
    
    const outings = await query;
    
    res.status(200).json({
      success: true,
      count: outings.length,
      data: outings
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single outing
// @route   GET /api/outings/:id
// @access  Private
exports.getOuting = async (req, res) => {
  try {
    const outing = await Outing.findById(req.params.id)
      .populate({
        path: 'studentId',
        select: 'name phoneNumber year branch roomNo hostelBlock'
      })
      .populate({
        path: 'acceptedBy',
        select: 'name role'
      });

    if (!outing) {
      return res.status(404).json({
        success: false,
        error: 'Outing not found'
      });
    }

    // Check if student is accessing their own outing
    if (req.userType === 'student' && outing.studentId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this outing'
      });
    }

    // If caretaker, check if outing is from their block
    if (req.userType === 'admin' && req.user.role === constants.ADMIN_ROLES.CARETAKER) {
      if (outing.studentId.hostelBlock !== req.user.block) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this outing'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: outing
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Create new outing request
// @route   POST /api/outings
// @access  Private (Student only)
exports.createOuting = async (req, res) => {
  try {
    // Only students can create outing requests
    if (req.userType !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can create outing requests'
      });
    }

    // Check if student has remaining outings
    const student = await Student.findById(req.user.id);
    
    if (student.remainingOutings <= 0) {
      return res.status(400).json({
        success: false,
        error: 'No remaining outings for this month'
      });
    }

    // Set studentId to current user
    req.body.studentId = req.user.id;
    
    // Create outing
    const outing = await Outing.create(req.body);

    // Decrement remaining outings
    student.remainingOutings -= 1;
    await student.save();

    res.status(201).json({
      success: true,
      data: outing
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update outing request
// @route   PUT /api/outings/:id
// @access  Private
exports.updateOuting = async (req, res) => {
  try {
    let outing = await Outing.findById(req.params.id);

    if (!outing) {
      return res.status(404).json({
        success: false,
        error: 'Outing not found'
      });
    }

    // Check permissions
    if (req.userType === 'student') {
      // Students can only update their own pending outings
      if (outing.studentId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to update this outing'
        });
      }

      if (outing.status !== constants.STATUS.PENDING) {
        return res.status(400).json({
          success: false,
          error: 'Cannot update outing that is not pending'
        });
      }

      // Students can only update certain fields
      const allowedFields = ['outTime', 'inTime', 'phoneNumber', 'purpose', 'destination'];
      Object.keys(req.body).forEach(key => {
        if (!allowedFields.includes(key)) {
          delete req.body[key];
        }
      });
    } else if (req.userType === 'admin') {
      // Admins can update status and remarks
      // If caretaker, check if outing is from their block
      if (req.user.role === constants.ADMIN_ROLES.CARETAKER) {
        const student = await Student.findById(outing.studentId);
        if (student.hostelBlock !== req.user.block) {
          return res.status(403).json({
            success: false,
            error: 'Not authorized to update this outing'
          });
        }
      }

      // If status is being changed to accepted, set acceptedBy
      if (req.body.status === constants.STATUS.ACCEPTED) {
        req.body.acceptedBy = req.user.id;
      }

      // If status is being changed to rejected, ensure remarks are provided
      if (req.body.status === constants.STATUS.REJECTED && !req.body.remarks) {
        return res.status(400).json({
          success: false,
          error: 'Remarks are required when rejecting an outing'
        });
      }

      // If status is being changed to forwarded, ensure it's not already at highest level
      if (req.body.status === constants.STATUS.FORWARDED && req.user.role === constants.ADMIN_ROLES.DSW) {
        return res.status(400).json({
          success: false,
          error: 'Cannot forward from highest authority level'
        });
      }
    }

    outing = await Outing.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: outing
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Delete outing request
// @route   DELETE /api/outings/:id
// @access  Private
exports.deleteOuting = async (req, res) => {
  try {
    const outing = await Outing.findById(req.params.id);

    if (!outing) {
      return res.status(404).json({
        success: false,
        error: 'Outing not found'
      });
    }

    // Check permissions
    if (req.userType === 'student') {
      // Students can only delete their own pending outings
      if (outing.studentId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to delete this outing'
        });
      }

      if (outing.status !== constants.STATUS.PENDING) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete outing that is not pending'
        });
      }

      // Restore the outing count
      const student = await Student.findById(req.user.id);
      student.remainingOutings += 1;
      await student.save();
    } else if (req.userType === 'admin') {
      // If caretaker, check if outing is from their block
      if (req.user.role === constants.ADMIN_ROLES.CARETAKER) {
        const student = await Student.findById(outing.studentId);
        if (student.hostelBlock !== req.user.block) {
          return res.status(403).json({
            success: false,
            error: 'Not authorized to delete this outing'
          });
        }
      }
    }

    await outing.remove();

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

// @desc    Record actual out time
// @route   PUT /api/outings/:id/out
// @access  Private (Admin only)
exports.recordOutTime = async (req, res) => {
  try {
    const outing = await Outing.findById(req.params.id);

    if (!outing) {
      return res.status(404).json({
        success: false,
        error: 'Outing not found'
      });
    }

    // Only accepted outings can be recorded
    if (outing.status !== constants.STATUS.ACCEPTED) {
      return res.status(400).json({
        success: false,
        error: 'Only accepted outings can be recorded'
      });
    }

    // Set actual out time
    outing.actualOutTime = new Date();
    await outing.save();

    res.status(200).json({
      success: true,
      data: outing
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Record actual in time
// @route   PUT /api/outings/:id/in
// @access  Private (Admin only)
exports.recordInTime = async (req, res) => {
  try {
    const outing = await Outing.findById(req.params.id);

    if (!outing) {
      return res.status(404).json({
        success: false,
        error: 'Outing not found'
      });
    }

    // Only outings with recorded out time can have in time recorded
    if (!outing.actualOutTime) {
      return res.status(400).json({
        success: false,
        error: 'Out time must be recorded first'
      });
    }

    // Set actual in time
    outing.actualInTime = new Date();
    await outing.save();

    // Create outing history record
    await OutingHistory.create({
      studentId: outing.studentId,
      outTime: outing.outTime,
      inTime: outing.inTime,
      actualOutTime: outing.actualOutTime,
      actualInTime: outing.actualInTime,
      purpose: outing.purpose,
      destination: outing.destination,
      remarks: outing.remarks
    });

    res.status(200).json({
      success: true,
      data: outing
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get pending outings for admin
// @route   GET /api/outings/pending
// @access  Private (Admin only)
exports.getPendingOutings = async (req, res) => {
  try {
    let query;
    
    // For caretaker, only get outings from their block
    if (req.user.role === constants.ADMIN_ROLES.CARETAKER) {
      // Find students in this block
      const students = await Student.find({ hostelBlock: req.user.block });
      const studentIds = students.map(student => student._id);
      
      query = Outing.find({ 
        studentId: { $in: studentIds },
        status: constants.STATUS.PENDING
      });
    } else {
      // For higher roles, get all pending outings or forwarded to their level
      query = Outing.find({ 
        status: [constants.STATUS.PENDING, constants.STATUS.FORWARDED]
      });
    }
    
    // Populate student details
    query = query.populate({
      path: 'studentId',
      select: 'name phoneNumber year branch roomNo hostelBlock'
    });
    
    const outings = await query;
    
    res.status(200).json({
      success: true,
      count: outings.length,
      data: outings
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};