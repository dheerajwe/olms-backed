const LeaveHistory = require('../models/LeaveHistory');
const Student = require('../models/Student');

// @desc    Get all leave history
// @route   GET /api/leave-history
// @access  Private
exports.getLeaveHistory = async (req, res) => {
  try {
    let query;
    
    // If student, only get their leave history
    if (req.userType === 'student') {
      query = LeaveHistory.find({ studentId: req.user.id });
    } 
    // If admin, get leave history based on their role and block
    else {
      // For caretaker, only get leave history from their block
      if (req.user.role === 'caretaker') {
        // Find students in this block
        const students = await Student.find({ hostelBlock: req.user.block });
        const studentIds = students.map(student => student._id);
        
        query = LeaveHistory.find({ studentId: { $in: studentIds } });
      } else {
        // For higher roles, get all leave history
        query = LeaveHistory.find();
      }
    }
    
    // Populate student details
    query = query.populate({
      path: 'studentId',
      select: 'name phoneNumber year branch roomNo hostelBlock'
    });
    
    const leaveHistory = await query;
    
    res.status(200).json({
      success: true,
      count: leaveHistory.length,
      data: leaveHistory
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single leave history
// @route   GET /api/leave-history/:id
// @access  Private
exports.getLeaveHistoryById = async (req, res) => {
  try {
    const leaveHistory = await LeaveHistory.findById(req.params.id)
      .populate({
        path: 'studentId',
        select: 'name phoneNumber year branch roomNo hostelBlock'
      });

    if (!leaveHistory) {
      return res.status(404).json({
        success: false,
        error: 'Leave history not found'
      });
    }

    // Check if student is accessing their own leave history
    if (req.userType === 'student' && leaveHistory.studentId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this leave history'
      });
    }

    // If caretaker, check if leave history is from their block
    if (req.userType === 'admin' && req.user.role === 'caretaker') {
      const student = await Student.findById(leaveHistory.studentId);
      if (student.hostelBlock !== req.user.block) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this leave history'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: leaveHistory
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get leave history for a student
// @route   GET /api/leave-history/student/:studentId
// @access  Private (Admin or the student themselves)
exports.getStudentLeaveHistory = async (req, res) => {
  try {
    // Check if admin or the student themselves is accessing
    if (req.userType === 'student' && req.user.id !== req.params.studentId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this student leave history'
      });
    }

    // If caretaker, check if student is from their block
    if (req.userType === 'admin' && req.user.role === 'caretaker') {
      const student = await Student.findById(req.params.studentId);
      
      if (!student) {
        return res.status(404).json({
          success: false,
          error: 'Student not found'
        });
      }
      
      if (student.hostelBlock !== req.user.block) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this student leave history'
        });
      }
    }

    const leaveHistory = await LeaveHistory.find({ studentId: req.params.studentId })
      .populate({
        path: 'studentId',
        select: 'name phoneNumber year branch roomNo hostelBlock'
      });
    
    res.status(200).json({
      success: true,
      count: leaveHistory.length,
      data: leaveHistory
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};