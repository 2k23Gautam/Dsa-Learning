const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const axios = require('axios');

// @route   GET /api/codeforces/stats/:handle
// @desc    Proxy fetch Codeforces user info
// @access  Private
router.get('/stats/:handle', auth, async (req, res) => {
  const { handle } = req.params;
  try {
    const response = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });

    if (response.data.status !== 'OK') {
      return res.status(404).json({ message: 'Codeforces user not found' });
    }

    res.json(response.data.result[0]);
  } catch (err) {
    if (err.response && err.response.status === 400) {
        return res.status(404).json({ message: 'Codeforces handle not found' });
    }
    console.error('Codeforces Info Fetch Error:', err.message);
    res.status(500).json({ message: 'Failed to fetch Codeforces stats' });
  }
});

// @route   GET /api/codeforces/recent/:handle
// @desc    Get recent AC submissions from Codeforces
// @access  Private
router.get('/recent/:handle', auth, async (req, res) => {
  const { handle } = req.params;
  try {
    const response = await axios.get(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=50`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });

    if (response.data.status !== 'OK') {
      return res.status(404).json({ message: 'Error fetching Codeforces submissions' });
    }

    // Process and filter for OK (AC) submissions
    const acSubmissions = response.data.result
      .filter(s => s.verdict === 'OK')
      .map(s => ({
        platform: 'Codeforces',
        title: s.problem.name,
        titleSlug: `${s.problem.contestId}-${s.problem.index}`,
        timestamp: s.creationTimeSeconds * 1000,
        difficulty: s.problem.rating
          ? s.problem.rating < 1400 ? 'Easy' : s.problem.rating < 2000 ? 'Medium' : 'Hard'
          : 'Medium',
      }));

    res.json(acSubmissions);
  } catch (err) {
    console.error('Codeforces Status Fetch Error:', err.message);
    res.status(500).json({ message: 'Failed to fetch Codeforces submissions' });
  }
});

// @route   POST /api/codeforces/sync
// @desc    Save/Sync Codeforces stats for current user
// @access  Private
router.post('/sync', auth, async (req, res) => {
  const { codeforcesHandle, stats } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (codeforcesHandle !== undefined) user.codeforcesHandle = codeforcesHandle;
    if (stats !== undefined) {
        user.codeforcesStats = stats;
        
        // Also update platformStats for unified dashboard
        if (!user.platformStats) user.platformStats = {};
        user.platformStats.codeforces = {
            rating: stats.rating || 0,
            rank: stats.rank || "Unrated",
            maxRating: stats.maxRating || 0,
            maxRank: stats.maxRank || "Unrated"
        };
    }
    
    await user.save();
    res.json({ message: 'Codeforces stats synced successfully', user });
  } catch (err) {
    console.error('Codeforces Sync Error:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
