const mongoose = require('mongoose');

const ToolUsageSchema = new mongoose.Schema({
  toolName: {
    type: String,
    required: true,
    unique: true
  },
  count: {
    type: Number,
    default: 1
  }
});

module.exports = mongoose.model('ToolUsage', ToolUsageSchema);
