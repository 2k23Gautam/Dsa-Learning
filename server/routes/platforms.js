const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   GET /api/platforms/stats/:platform/:handle
router.get('/stats/:platform/:handle', auth, async (req, res) => {
  const { platform, handle } = req.params;
  try {
    let stats = null;
    if (platform === 'leetcode') {
       const user = await User.findById(req.user.id);
       if (user) {
         user.leetcodeUsername = handle;
         await user.save();
         stats = { handle, platform: 'leetcode' };
       }
    }
    if (!stats) return res.status(404).json({ message: 'Platform not supported' });
    return res.json(stats);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to sync platform' });
  }
});

// @route   POST /api/platforms/sync-all
router.post('/sync-all', auth, async (req, res) => {
  const { leetcode, codeforces } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (leetcode !== undefined) user.leetcodeUsername = leetcode;
    if (codeforces !== undefined) user.codeforcesHandle = codeforces;
    await user.save();
    return res.json({ message: 'Handles updated successfully', user });
  } catch (err) {
    return res.status(500).send('Server Error');
  }
});


// ── Helper: fetch upcoming LeetCode contests via GraphQL ───────────────────
async function fetchLeetCodeContests() {
  try {
    const query = `{ topTwoContests { title titleSlug startTime duration } }`;
    const { data } = await axios.post(
      'https://leetcode.com/graphql',
      { query },
      {
        timeout: 8000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://leetcode.com'
        }
      }
    );
    const contests = data?.data?.topTwoContests || [];
    console.log(`[LeetCode] returned ${contests.length} contests`);
    return contests.map(c => {
      const startTime = c.startTime * 1000; // LeetCode uses Unix seconds
      const duration = c.duration * 1000;   // seconds → ms
      return {
        id: `leetcode|${c.titleSlug}`,
        platform: 'LeetCode',
        name: c.title,
        startTime,
        endTime: startTime + duration,
        duration: c.duration,
        link: `https://leetcode.com/contest/${c.titleSlug}`
      };
    });
  } catch (e) {
    console.error('[LeetCode] fetch failed:', e.message);
    return [];
  }
}

// ── Helper: fetch Codeforces upcoming contests ─────────────────────────────
async function fetchCodeforcesContests() {
  try {
    const { data } = await axios.get('https://codeforces.com/api/contest.list?gym=false', {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (data.status !== 'OK' || !Array.isArray(data.result)) return [];
    const upcoming = data.result.filter(c => c.phase === 'BEFORE');
    console.log(`[Codeforces] returned ${upcoming.length} upcoming contests`);
    return upcoming.map(c => {
      const startTime = c.startTimeSeconds * 1000;
      const duration = c.durationSeconds * 1000;
      return {
        id: `codeforces|${c.id}`,
        platform: 'Codeforces',
        name: c.name,
        startTime,
        endTime: startTime + duration,
        duration: c.durationSeconds,
        link: `https://codeforces.com/contest/${c.id}`
      };
    });
  } catch (e) {
    console.error('[Codeforces] fetch failed:', e.message);
    return [];
  }
}

// ── Helper: fetch upcoming CodeChef contests ──────────────────────────────
async function fetchCodeChefContests() {
  try {
    const { data } = await axios.get('https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all', {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    });

    const upcoming = [
      ...(data?.future_contests || []),
      ...(data?.present_contests || []),
    ];

    console.log(`[CodeChef] returned ${upcoming.length} contests`);
    return upcoming.map(c => {
      const startTime = new Date(c.contest_start_date_iso || c.contest_start_date).getTime();
      const endTime   = new Date(c.contest_end_date_iso   || c.contest_end_date).getTime();
      return {
        id: `codechef|${c.contest_code}`,
        platform: 'CodeChef',
        name: c.contest_name,
        startTime,
        endTime,
        duration: Math.round((endTime - startTime) / 1000),
        link: `https://www.codechef.com/${c.contest_code}`
      };
    }).filter(c => !isNaN(c.startTime));
  } catch (e) {
    console.error('[CodeChef] fetch failed:', e.message);
    return [];
  }
}

// @route   GET /api/platforms/contests
router.get('/contests', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('dismissedContests');
    const dismissed = user?.dismissedContests || [];

    const now = new Date();
    const nowTime = now.getTime();
    // Show contests starting within the next 48 hours
    const windowEndTime = nowTime + (48 * 60 * 60 * 1000);

    // Fetch from LeetCode, Codeforces, and CodeChef in parallel
    const [leetcode, codeforces, codechef] = await Promise.all([
      fetchLeetCodeContests(),
      fetchCodeforcesContests(),
      fetchCodeChefContests()
    ]);

    // Merge and deduplicate by platform+name
    const seen = new Set();
    const merged = [];
    for (const c of [...leetcode, ...codeforces, ...codechef]) {
      const dedupKey = `${c.platform}|${c.name}`;
      if (!seen.has(dedupKey)) {
        seen.add(dedupKey);
        merged.push(c);
      }
    }

    const filtered = merged.filter(c => {
      const isUpcoming = c.startTime > nowTime && c.startTime <= windowEndTime;
      const isDismissed = dismissed.includes(c.id);
      return isUpcoming && !isDismissed;
    });

    console.log(`Returning ${filtered.length} contests (LC=${leetcode.length}, CF=${codeforces.length}, CC=${codechef.length})`);
    return res.json(filtered.sort((a, b) => a.startTime - b.startTime));
  } catch (err) {
    console.error('Contest route error:', err);
    return res.json([]);
  }
});


// @route   POST /api/platforms/contests/dismiss
router.post('/contests/dismiss', auth, async (req, res) => {
  const { contestId } = req.body;
  if (!contestId) return res.status(400).json({ message: 'Contest ID required' });
  try {
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { dismissedContests: contestId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to dismiss contest' });
  }
});

module.exports = router;
