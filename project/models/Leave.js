const mongoose = require('mongoose');
const constants = require('../config/constants');

const LeaveSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  outDate: {
    type: Date,
    required: [true, 'Please add out date']
  },
  inDate: {
    type: Date,
    required: [true, 'Please add in date']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please add a contact phone number'],
    match: [/^\d{10}$/, 'Please add a valid 10-digit phone number']
  },
  actualOutDate: {
    type: Date
  },
  actualInDate: {
    type: Date
  },
  status: {
    type: String,
    enum: [constants.STATUS.PENDING, constants.STATUS.ACCEPTED, constants.STATUS.REJECTED, constants.STATUS.FORWARDED],
    default: constants.STATUS.PENDING
  },
  remarks: {
    type: String
  },
  reason: {
    type: String,
    required: [true, 'Please add reason for leave']
  },
  destination: {
    type: String,
    required: [true, 'Please add destination']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Leave', LeaveSchema);