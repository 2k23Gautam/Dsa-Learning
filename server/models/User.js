const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  leetcodeUsername: { type: String, default: "" },
  codeforcesHandle: { type: String, default: "" },
  profileImage: { type: String, default: "" },
  leetcodeStats: { type: Object, default: null },
  platformStats: { 
    type: Object, 
    default: {
      leetcode: null,
    }
  },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequests: [{
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }],
  dailyChallenge: {
    date: { type: String, default: "" },
    topic: { type: String, default: "" },
    isCompleted: { type: Boolean, default: false }
  },
  gdPoints: { type: Number, default: 0 },
  lastCompletedDate: { type: String, default: "" },
  gdPointHistory: [{
    date: { type: String },
    points: { type: Number }
  }],
  dismissedContests: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
