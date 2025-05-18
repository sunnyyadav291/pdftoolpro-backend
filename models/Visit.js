const mongoose = require('mongoose');

const VisitSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true
  },
  toolUsed: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Visit', VisitSchema);
