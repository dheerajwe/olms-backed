const mongoose = require('mongoose');
const constants = require('../config/constants');

const OutingSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  outTime: {
    type: Date,
    required: [true, 'Please add out time']
  },
  inTime: {
    type: Date,
    required: [true, 'Please add in time']
  },
  date: {
    type: Date,
    required: [true, 'Please add date'],
    default: Date.now
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please add a contact phone number'],
    match: [/^\d{10}$/, 'Please add a valid 10-digit phone number']
  },
  actualOutTime: {
    type: Date
  },
  actualInTime: {
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
  purpose: {
    type: String,
    required: [true, 'Please add purpose of outing']
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

module.exports = mongoose.model('Outing', OutingSchema);