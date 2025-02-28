const Leave = require('../models/Leave');
const Student = require('../models/Student');
const LeaveHistory = require('../models/LeaveHistory');
const constants = require('../config/constants');

// @desc    Get all leaves
// @route   GET /api/leaves
// @access  Private
exports.getLeaves = async (req, res) => {
  try {
    let query;
    
    // If student, only get their leaves
    if (req.userType === 'student') {
      query = Leave.find({ studentId: req.user.id });
    } 
    // If admin, get leaves based on their role and block
    else {
      // For caretaker, only get leaves from their block
      if (req.user.role === constants.ADMIN_ROLES.CARETAKER) {
        // Find students in this block
        const students = await Student.find({ hostelBlock: req.user.block });
        const studentIds = students.map(student => student._id);
        
        query = Leave.find({ studentId: { $in: studentIds } });
      } else {
        // For higher roles, get all leaves
        query = Leave.find();
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
    
    const leaves = await query;
    
    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single leave
// @route   GET /api/leaves/:id
// @access  Private
exports.getLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate({
        path: 'studentId',
        select: 'name phoneNumber year branch roomNo hostelBlock'
      })
      .populate({
        path: 'acceptedBy',
        select: 'name role'
      });

    if (!leave) {
      return res.status(404).json({
        success: false,
        error: 'Leave not found'
      });
    }

    // Check if student is accessing their own leave
    if (req.userType === 'student' && leave.studentId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this leave'
      });
    }

    // If caretaker, check if leave is from their block
    if (req.userType === 'admin' && req.user.role === constants.ADMIN_ROLES.CARETAKER) {
      if (leave.studentId.hostelBlock !== req.user.block) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this leave'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: leave
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Create new leave request
// @route   POST /api/leaves
// @access  Private (Student only)
exports.createLeave = async (req, res) => {
  try {
    // Only students can create leave requests
    if (req.userType !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can create leave requests'
      });
    }

    // Check if student has remaining leaves
    const student = await Student.findById(req.user.id);
    
    if (student.remainingLeaves <= 0) {
      return res.status(400).json({
        success: false,
        error: 'No remaining leaves for this semester'
      });
    }

    // Set studentId to current user
    req.body.studentId = req.user.id;
    
    // Create leave
    const leave = await Leave.create(req.body);

    // Decrement remaining leaves
    student.remainingLeaves -= 1;
    await student.save();

    res.status(201).json({
      success: true,
      data: leave
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update leave request
// @route   PUT /api/leaves/:id
// @access  Private
exports.updateLeave = async (req, res) => {
  try {
    let leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        error: 'Leave not found'
      });
    }

    // Check permissions
    if (req.userType === 'student') {
      // Students can only update their own pending leaves
      if (leave.studentId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to update this leave'
        });
      }

      if (leave.status !== constants.STATUS.PENDING) {
        return res.status(400).json({
          success: false,
          error: 'Cannot update leave that is not pending'
        });
      }

      // Students can only update certain fields
      const allowedFields = ['outDate', 'inDate', 'phoneNumber', 'reason', 'destination'];
      Object.keys(req.body).forEach(key => {
        if (!allowedFields.includes(key)) {
          delete req.body[key];
        }
      });
    } else if (req.userType === 'admin') {
      // Admins can update status and remarks
      // If caretaker, check if leave is from their block
      if (req.user.role === constants.ADMIN_ROLES.CARETAKER) {
        const student = await Student.findById(leave.studentId);
        if (student.hostelBlock !== req.user.block) {
          return res.status(403).json({
            success: false,
            error: 'Not authorized to update this leave'
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
          error: 'Remarks are required when rejecting a leave'
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

    leave = await Leave.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: leave
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Delete leave request
// @route   DELETE /api/leaves/:id
// @access  Private
exports.deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        error: 'Leave not found'
      });
    }

    // Check permissions
    if (req.userType === 'student') {
      // Students can only delete their own pending leaves
      if (leave.studentId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to delete this leave'
        });
      }

      if (leave.status !== constants.STATUS.PENDING) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete leave that is not pending'
        });
      }

      // Restore the leave count
      const student = await Student.findById(req.user.id);
      student.remainingLeaves += 1;
      await student.save();
    } else if (req.userType === 'admin') {
      // If caretaker, check if leave is from their block
      if (req.user.role === constants.ADMIN_ROLES.CARETAKER) {
        const student = await Student.findById(leave.studentId);
        if (student.hostelBlock !== req.user.block) {
          return res.status(403).json({
            success: false,
            error: 'Not authorized to delete this leave'
          });
        }
      }
    }

    await leave.remove();

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

// @desc    Record actual out date
// @route   PUT /api/leaves/:id/out
// @access  Private (Admin only)
exports.recordOutDate = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        error: 'Leave not found'
      });
    }

    // Only accepted leaves can be recorded
    if (leave.status !== constants.STATUS.ACCEPTED) {
      return res.status(400).json({
        success: false,
        error: 'Only accepted leaves can be recorded'
      });
    }

    // Set actual out date
    leave.actualOutDate = new Date();
    await leave.save();

    res.status(200).json({
      success: true,
      data: leave
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Record actual in date
// @route   PUT /api/leaves/:id/in
// @access  Private (Admin only)
exports.recordInDate = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        error: 'Leave not found'
      });
    }

    // Only leaves with recorded out date can have in date recorded
    if (!leave.actualOutDate) {
      return res.status(400).json({
        success: false,
        error: 'Out date must be recorded first'
      });
    }

    // Set actual in date
    leave.actualInDate = new Date();
    await leave.save();

    // Create leave history record
    await LeaveHistory.create({
      studentId: leave.studentId,
      outDate: leave.outDate,
      inDate: leave.inDate,
      actualOutDate: leave.actualOutDate,
      actualInDate: leave.actualInDate,
      reason: leave.reason,
      destination: leave.destination,
      remarks: leave.remarks
    });

    res.status(200).json({
      success: true,
      data: leave
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get pending leaves for admin
// @route   GET /api/leaves/pending
// @access  Private (Admin only)
exports.getPendingLeaves = async (req, res) => {
  try {
    let query;
    
    // For caretaker, only get leaves from their block
    if (req.user.role === constants.ADMIN_ROLES.CARETAKER) {
      // Find students in this block
      const students = await Student.find({ hostelBlock: req.user.block });
      const studentIds = students.map(student => student._id);
      
      query = Leave.find({ 
        studentId: { $in: studentIds },
        status: constants.STATUS.PENDING
      });
    } else {
      // For higher roles, get all pending leaves or forwarded to their level
      query = Leave.find({ 
        status: [constants.STATUS.PENDING, constants.STATUS.FORWARDED]
      });
    }
    
    // Populate student details
    query = query.populate({
      path: 'studentId',
      select: 'name phoneNumber year branch roomNo hostelBlock'
    });
    
    const leaves = await query;
    
    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};