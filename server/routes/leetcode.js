const express = require('express');
console.log('Loading LeetCode routes...');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   GET /api/leetcode/stats/:username
// @desc    Proxy fetch LeetCode user stats from GraphQL
// @access  Private
router.get('/stats/:username', auth, async (req, res) => {
  const { username } = req.params;

  const query = `
    query getUserProfile($username: String!) {
      allQuestionsCount {
        difficulty
        count
      }
      matchedUser(username: $username) {
        submitStats {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
        }
      }
      userContestRanking(username: $username) {
        attendedContestsCount
        rating
        globalRanking
        totalParticipants
        topPercentage
        badge {
          name
        }
      }
    }
  `;

  try {
    const response = await fetch('https://leetcode.com/graphql/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
        'User-Agent': 'Mozilla/5.0',
      },
      body: JSON.stringify({
        query: query,
        variables: { username },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      return res.status(404).json({ message: 'LeetCode user not found' });
    }

    res.json(data.data);
  } catch (err) {
    console.error('LeetCode Fetch Error:', err);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/leetcode/recent/:username
// @desc    Get recent AC submissions
// @access  Private
router.get('/recent/:username', auth, async (req, res) => {
  const { username } = req.params;
  const query = `
    query recentAcSubmissions($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        title
        titleSlug
        timestamp
      }
    }
  `;

  try {
    const response = await fetch('https://leetcode.com/graphql/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
        'User-Agent': 'Mozilla/5.0',
      },
      body: JSON.stringify({
        query: query,
        variables: { username, limit: 50 },
      }),
    });

    const data = await response.json();
    if (data.errors) return res.status(404).json({ message: 'Error fetching recent submissions' });
    res.json(data.data.recentAcSubmissionList);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/leetcode/sync
// @desc    Save/Sync LeetCode stats for current user
// @access  Private
router.post('/sync', auth, async (req, res) => {
  console.log('POST /api/leetcode/sync hitting backend');
  const { leetcodeUsername, stats } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Only update if the fields are explicitly provided (don't use || so empty string can clear)
    if (leetcodeUsername !== undefined) user.leetcodeUsername = leetcodeUsername;
    if (stats !== undefined) user.leetcodeStats = stats;
    await user.save();

    res.json({ message: 'LeetCode stats synced successfully', user });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
