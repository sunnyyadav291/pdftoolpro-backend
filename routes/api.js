const express = require('express');
const router = express.Router();
const Visit = require('../models/Visit');
const ToolUsage = require('../models/ToolUsage');
const User = require('../models/User');

// POST /api/visit - Record a new visit
router.post('/visit', async (req, res) => {
  try {
    const { ip, toolUsed } = req.body;
    
    if (!ip || !toolUsed) {
      return res.status(400).json({ message: 'IP and tool used are required' });
    }
    
    const visit = new Visit({
      ip,
      toolUsed
    });
    
    await visit.save();
    
    res.status(201).json({ message: 'Visit recorded successfully' });
  } catch (error) {
    console.error('Error recording visit:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tool-usage - Increment tool usage count
router.post('/tool-usage', async (req, res) => {
  try {
    const { toolName } = req.body;
    
    if (!toolName) {
      return res.status(400).json({ message: 'Tool name is required' });
    }
    
    // Find and update or create if not exists
    const toolUsage = await ToolUsage.findOneAndUpdate(
      { toolName },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );
    
    res.status(200).json({ message: 'Tool usage recorded', toolUsage });
  } catch (error) {
    console.error('Error recording tool usage:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/register - Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const user = new User({
      name,
      email
    });
    
    await user.save();
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/tool-usage/stats - Get tool usage statistics
router.get('/tool-usage/stats', async (req, res) => {
  try {
    const stats = await ToolUsage.find().sort({ count: -1 });
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching tool usage stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
