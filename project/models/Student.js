const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please add a phone number'],
    match: [/^\d{10}$/, 'Please add a valid 10-digit phone number']
  },
  year: {
    type: String,
    required: [true, 'Please add a year'],
    enum: ['E1', 'E2', 'E3', 'E4']
  },
  branch: {
    type: String,
    required: [true, 'Please add a branch'],
    trim: true
  },
  roomNo: {
    type: String,
    required: [true, 'Please add a room number'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Please add an address']
  },
  image: {
    type: String,
    default: 'default.jpg'
  },
  parentName: {
    type: String,
    required: [true, 'Please add parent name']
  },
  parentPhoneNumber: {
    type: String,
    required: [true, 'Please add parent phone number'],
    match: [/^\d{10}$/, 'Please add a valid 10-digit phone number']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  hostelBlock: {
    type: String,
    required: [true, 'Please add a hostel block']
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  remainingOutings: {
    type: Number,
    default: 4 // Default from constants
  },
  remainingLeaves: {
    type: Number,
    default: 10 // Default from constants
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to upgrade student year (E1 to E2, etc.)
StudentSchema.methods.upgradeYear = function() {
  const yearMap = {
    'E1': 'E2',
    'E2': 'E3',
    'E3': 'E4'
  };
  
  if (this.year in yearMap) {
    this.year = yearMap[this.year];
    return true;
  }
  return false;
};

// Reset outing count monthly
StudentSchema.methods.resetOutingCount = function() {
  const constants = require('../config/constants');
  this.remainingOutings = constants.MAX_OUTINGS_PER_MONTH;
};

// Reset leave count per semester
StudentSchema.methods.resetLeaveCount = function() {
  const constants = require('../config/constants');
  this.remainingLeaves = constants.MAX_LEAVES_PER_SEMESTER;
};

module.exports = mongoose.model('Student', StudentSchema);