const OutingHistory = require('../models/OutingHistory');
const Student = require('../models/Student');

// @desc    Get all outing history
// @route   GET /api/outing-history
// @access  Private
exports.getOutingHistory = async (req, res) => {
  try {
    let query;
    
    // If student, only get their outing history
    if (req.userType === 'student') {
      query = OutingHistory.find({ studentId: req.user.id });
    } 
    // If admin, get outing history based on their role and block
    else {
      // For caretaker, only get outing history from their block
      if (req.user.role === 'caretaker') {
        // Find students in this block
        const students = await Student.find({ hostelBlock: req.user.block });
        const studentIds = students.map(student => student._id);
        
        query = OutingHistory.find({ studentId: { $in: studentIds } });
      } else {
        // For higher roles, get all outing history
        query = OutingHistory.find();
      }
    }
    
    // Populate student details
    query = query.populate({
      path: 'studentId',
      select: 'name phoneNumber year branch roomNo hostelBlock'
    });
    
    const outingHistory = await query;
    
    res.status(200).json({
      success: true,
      count: outingHistory.length,
      data: outingHistory
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single outing history
// @route   GET /api/outing-history/:id
// @access  Private
exports.getOutingHistoryById = async (req, res) => {
  try {
    const outingHistory = await OutingHistory.findById(req.params.id)
      .populate({
        path: 'studentId',
        select: 'name phoneNumber year branch roomNo hostelBlock'
      });

    if (!outingHistory) {
      return res.status(404).json({
        success: false,
        error: 'Outing history not found'
      });
    }

    // Check if student is accessing their own outing history
    if (req.userType === 'student' && outingHistory.studentId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this outing history'
      });
    }

    // If caretaker, check if outing history is from their block
    if (req.userType === 'admin' && req.user.role === 'caretaker') {
      const student = await Student.findById(outingHistory.studentId);
      if (student.hostelBlock !== req.user.block) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this outing history'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: outingHistory
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get outing history for a student
// @route   GET /api/outing-history/student/:studentId
// @access  Private (Admin or the student themselves)
exports.getStudentOutingHistory = async (req, res) => {
  try {
    // Check if admin or the student themselves is accessing
    if (req.userType === 'student' && req.user.id !== req.params.studentId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this student outing history'
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
          error: 'Not authorized to access this student outing history'
        });
      }
    }

    const outingHistory = await OutingHistory.find({ studentId: req.params.studentId })
      .populate({
        path: 'studentId',
        select: 'name phoneNumber year branch roomNo hostelBlock'
      });
    
    res.status(200).json({
      success: true,
      count: outingHistory.length,
      data: outingHistory
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};