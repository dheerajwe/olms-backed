const mongoose = require('mongoose');

const LeaveHistorySchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  outDate: {
    type: Date,
    required: true
  },
  inDate: {
    type: Date,
    required: true
  },
  actualOutDate: {
    type: Date,
    required: true
  },
  actualInDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  remarks: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('LeaveHistory', LeaveHistorySchema);