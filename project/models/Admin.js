const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  position: {
    type: String,
    required: [true, 'Please add a position']
  },
  role: {
    type: String,
    required: [true, 'Please add a role'],
    enum: ['caretaker', 'chiefwarden', 'warden', 'adsw', 'dsw']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please add a phone number'],
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
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  reportsTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  block: {
    type: String,
    required: [true, 'Please add a block']
  },
  gender: {
    type: String,
    required: [true, 'Please add gender'],
    enum: ['male', 'female', 'other']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Admin', AdminSchema);