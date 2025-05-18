const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// MongoDB Schema Models
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const VisitSchema = new mongoose.Schema({
  page: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  userAgent: String,
  ip: String
});

const ToolUsageSchema = new mongoose.Schema({
  toolName: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const User = mongoose.model('User', UserSchema);
const Visit = mongoose.model('Visit', VisitSchema);
const ToolUsage = mongoose.model('ToolUsage', ToolUsageSchema);

// MongoDB Connection
const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
      socketTimeoutMS: 45000,
      family: 4  // Force IPv4
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Don't exit the process, let the app continue without DB
    console.log('Running without MongoDB connection. Some features may be limited.');
  }
};

// Connect to MongoDB
connectDB();

// API Routes
app.use('/api', express.Router()
  // User Authentication
  .post('/register', async (req, res) => {
    try {
      const { name, email, password } = req.body;
      
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Create new user
      const user = new User({
        name,
        email,
        password: hashedPassword
      });
      
      console.log('Attempting to save user:', user.email);
      await user.save();
      console.log('User saved successfully:', user.email, 'ID:', user._id);
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET || 'pdftoolpro_jwt_secret', // In production, use environment variable
        { expiresIn: '1d' }
      );
      
      res.status(201).json({
        token,
        id: user._id,
        name: user.name,
        email: user.email
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  })
  
  .post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      // Validate password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET || 'pdftoolpro_jwt_secret', // In production, use environment variable
        { expiresIn: '1d' }
      );
      
      res.json({
        token,
        id: user._id,
        name: user.name,
        email: user.email
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  })
  
  // Visit tracking
  .post('/visit', async (req, res) => {
    try {
      const { page } = req.body;
      
      const visit = new Visit({
        page,
        userAgent: req.headers['user-agent'],
        ip: req.ip
      });
      
      await visit.save();
      
      res.status(201).json({ message: 'Visit recorded successfully' });
    } catch (error) {
      console.error('Visit tracking error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  })
  
  // Tool usage tracking
  .post('/tool-usage', async (req, res) => {
    try {
      const { toolName } = req.body;
      
      // Extract user ID from token if available
      let userId = null;
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pdftoolpro_jwt_secret');
          userId = decoded.id;
        } catch (error) {
          // Invalid token, but we'll still record the tool usage
          console.error('Token verification error:', error);
        }
      }
      
      const toolUsage = new ToolUsage({
        toolName,
        userId
      });
      
      await toolUsage.save();
      
      res.status(200).json({ message: 'Tool usage recorded', toolUsage: req.body });
    } catch (error) {
      console.error('Tool usage tracking error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  })
  
  // Tool usage statistics
  .get('/tool-usage/stats', async (req, res) => {
    try {
      const stats = await ToolUsage.aggregate([
        { $group: { _id: '$toolName', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, toolName: '$_id', count: 1 } }
      ]);
      
      res.status(200).json(stats);
    } catch (error) {
      console.error('Tool usage stats error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  })
);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Define port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
