const mongoose = require('mongoose');

const companyProblemSchema = new mongoose.Schema({
  company:    { type: String, required: true, index: true },
  name:       { type: String, required: true },
  link:       { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  topics:     [{ type: String }],
  // Frequency: how often this problem appears in interviews (1 = rare, 5 = very common)
  frequency:  { type: Number, default: 3, min: 1, max: 5 },
  addedAt:    { type: Date, default: Date.now },
  lastUpdated:{ type: Date, default: Date.now },
}, { timestamps: true });

// Unique per company+problem name so appends are idempotent
companyProblemSchema.index({ company: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('CompanyProblem', companyProblemSchema);
