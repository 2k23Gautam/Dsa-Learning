const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  id: { type: String },
  name: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
  status: { type: String, enum: ['Not Started', 'Attempted', 'Solved', 'Needs Revision', 'Revised'], default: 'Not Started' },
  topics: [{ type: String }],
  patterns: [{ type: String }],
  platform: { type: String },
  link: { type: String },
  approach: { type: String },
  timeComplexity: { type: String },
  spaceComplexity: { type: String },
  solutionCode: { type: String },
  revisionDate: { type: String },
  dateSolved: { type: String },
  revisionCount: { type: Number, default: 0 },
  isPOTD: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Problem', problemSchema);
