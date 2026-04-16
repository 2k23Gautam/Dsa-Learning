const mongoose = require('mongoose');

const companyProgressSchema = new mongoose.Schema({
  user:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyProblemId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyProblem', required: true },
  // Denormalized for fast per-company queries without joining
  company:          { type: String, required: true, index: true },
  status:           { type: String, enum: ['Not Started', 'Attempted', 'Solved'], default: 'Not Started' },
  solvedAt:         { type: Date },
}, { timestamps: true });

// One progress record per user+problem — unique compound index
companyProgressSchema.index({ user: 1, companyProblemId: 1 }, { unique: true });

module.exports = mongoose.model('CompanyProgress', companyProgressSchema);
