const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set static folder
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/admins', require('./routes/adminRoutes'));
app.use('/api/outings', require('./routes/outingRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/outing-history', require('./routes/outingHistoryRoutes'));
app.use('/api/leave-history', require('./routes/leaveHistoryRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});