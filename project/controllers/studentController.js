const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const constants = require('../config/constants');

// @desc    Get all students
// @route   GET /api/students
// @access  Private (Admin only)
exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find();
    
    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Check if admin or the student themselves is accessing
    if (req.userType === 'student' && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this student profile'
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Create new student
// @route   POST /api/students
// @access  Private (Admin only)
exports.createStudent = async (req, res) => {
  try {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
    
    // Set default values for remaining outings and leaves
    req.body.remainingOutings = constants.MAX_OUTINGS_PER_MONTH;
    req.body.remainingLeaves = constants.MAX_LEAVES_PER_SEMESTER;

    const student = await Student.create(req.body);

    res.status(201).json({
      success: true,
      data: student
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Bulk create students
// @route   POST /api/students/bulk
// @access  Private (Admin only)
exports.bulkCreateStudents = async (req, res) => {
  try {
    const { students } = req.body;
    
    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of students'
      });
    }

    // Hash passwords and set default values for all students
    const studentsWithHashedPasswords = await Promise.all(
      students.map(async (student) => {
        const salt = await bcrypt.genSalt(10);
        student.password = await bcrypt.hash(student.password, salt);
        student.remainingOutings = constants.MAX_OUTINGS_PER_MONTH;
        student.remainingLeaves = constants.MAX_LEAVES_PER_SEMESTER;
        return student;
      })
    );

    const createdStudents = await Student.insertMany(studentsWithHashedPasswords);

    res.status(201).json({
      success: true,
      count: createdStudents.length,
      data: createdStudents
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private (Admin or student themselves)
exports.updateStudent = async (req, res) => {
  try {
    let student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Check if admin or the student themselves is updating
    if (req.userType === 'student' && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this student profile'
      });
    }

    // Don't allow students to update certain fields
    if (req.userType === 'student') {
      const restrictedFields = ['year', 'remainingOutings', 'remainingLeaves'];
      for (const field of restrictedFields) {
        if (req.body[field] !== undefined) {
          delete req.body[field];
        }
      }
    }

    // If password is being updated, hash it
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }

    student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private (Admin only)
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    await student.remove();

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

// @desc    Upgrade student year (E1 to E2, etc.)
// @route   PUT /api/students/:id/upgrade-year
// @access  Private (Admin only)
exports.upgradeStudentYear = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    const upgraded = student.upgradeYear();
    
    if (!upgraded) {
      return res.status(400).json({
        success: false,
        error: 'Cannot upgrade year further'
      });
    }

    await student.save();

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Bulk upgrade student years
// @route   PUT /api/students/bulk-upgrade-year
// @access  Private (Admin only)
exports.bulkUpgradeStudentYear = async (req, res) => {
  try {
    const { year } = req.body;
    
    if (!year) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a year to upgrade'
      });
    }

    const yearMap = {
      'E1': 'E2',
      'E2': 'E3',
      'E3': 'E4'
    };

    if (!yearMap[year]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid year or cannot upgrade further'
      });
    }

    const result = await Student.updateMany(
      { year: year },
      { $set: { year: yearMap[year] } }
    );

    res.status(200).json({
      success: true,
      count: result.nModified,
      message: `Upgraded ${result.nModified} students from ${year} to ${yearMap[year]}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Reset monthly outing count for all students
// @route   PUT /api/students/reset-outing-count
// @access  Private (Admin only)
exports.resetOutingCount = async (req, res) => {
  try {
    const result = await Student.updateMany(
      {},
      { $set: { remainingOutings: constants.MAX_OUTINGS_PER_MONTH } }
    );

    res.status(200).json({
      success: true,
      count: result.nModified,
      message: `Reset outing count for ${result.nModified} students`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Reset semester leave count for all students
// @route   PUT /api/students/reset-leave-count
// @access  Private (Admin only)
exports.resetLeaveCount = async (req, res) => {
  try {
    const result = await Student.updateMany(
      {},
      { $set: { remainingLeaves: constants.MAX_LEAVES_PER_SEMESTER } }
    );

    res.status(200).json({
      success: true,
      count: result.nModified,
      message: `Reset leave count for ${result.nModified} students`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};