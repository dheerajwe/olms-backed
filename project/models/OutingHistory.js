const mongoose = require('mongoose');

const OutingHistorySchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  outTime: {
    type: Date,
    required: true
  },
  inTime: {
    type: Date,
    required: true
  },
  actualOutTime: {
    type: Date,
    required: true
  },
  actualInTime: {
    type: Date,
    required: true
  },
  purpose: {
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

module.exports = mongoose.model('OutingHistory', OutingHistorySchema);