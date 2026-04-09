const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Problem = require('../models/Problem');
const { suggestProblemMetadata } = require('../utils/ai');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretfallback';

// Middleware to verify token
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id: userId }
    next();
  } catch (e) {
    res.status(400).json({ message: 'Token is not valid' });
  }
};

// Get all problems for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const problems = await Problem.find({ user: req.user.id }).sort({ createdAt: -1 });
    const formatted = problems.map(p => {
      const obj = p.toObject();
      obj.id = obj._id.toString();
      return obj;
    });
    res.json(formatted);
  } catch (err) {
    console.error('Problem API Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Sanitize body: coerce any string-typed fields that accidentally came as arrays
function sanitizeBody(body) {
  const STRING_FIELDS = ['name', 'link', 'platform', 'difficulty', 'status', 'approach',
    'notes', 'solutionCode', 'timeComplexity', 'spaceComplexity',
    'dateSolved', 'revisionDate'];
  const cleaned = { ...body };
  for (const field of STRING_FIELDS) {
    if (Array.isArray(cleaned[field])) {
      cleaned[field] = cleaned[field].join('\n');
    }
  }
  return cleaned;
}

// Add a new problem
router.post('/', auth, async (req, res) => {
  try {
    const body = sanitizeBody(req.body);
    const problem = new Problem({ ...body, user: req.user.id });
    await problem.save();
    const obj = problem.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (err) {
    console.error('Add Problem Error:', err.name, err.message);
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a problem
router.put('/:id', auth, async (req, res) => {
  try {
    const body = sanitizeBody(req.body);
    const problem = await Problem.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: body },
      { new: true, runValidators: true }
    );
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    const obj = problem.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (err) {
    console.error('Update Problem Error:', err.name, err.message);
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a problem
router.delete('/:id', auth, async (req, res) => {
  try {
    const problem = await Problem.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    res.json({ message: 'Problem deleted', id: req.params.id });
  } catch (err) {
    console.error('Problem API Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Fetch Problem Statement from LeetCode or Codeforces ────────────────────────────────────
// @route  POST /api/problems/fetch-statement
// @desc   Fetch the problem statement text
// @access Private
router.post('/fetch-statement', auth, async (req, res) => {
  const { link } = req.body;
  if (!link) return res.status(400).json({ message: 'Link is required' });

  const lcMatch = link.match(/leetcode\.com\/problems\/([\w-]+)/i);
  const isCodeforces = /codeforces\.com\/(contest|problemset)\//i.test(link);

  if (!lcMatch && !isCodeforces) {
    return res.status(400).json({ message: 'Not a valid LeetCode or Codeforces URL' });
  }

  if (lcMatch) {
    const slug = lcMatch[1];
    const query = `
      query getQuestionDetail($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          title
          titleSlug
          difficulty
          content
          topicTags {
            name
          }
        }
      }
    `;

    try {
      console.log(`[LC Fetch] Fetching problem statement for: ${slug}`);
      // Use dynamic import for node-fetch if global fetch is not available, but 'fetch' is native in Node 18+
      const response = await fetch('https://leetcode.com/graphql/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Referer': 'https://leetcode.com',
          'User-Agent': 'Mozilla/5.0'
        },
        body: JSON.stringify({ query, variables: { titleSlug: slug } }),
      });

      if (!response.ok) throw new Error(`LeetCode API returned ${response.status}`);
      const data = await response.json();

      if (data.errors || !data.data?.question) {
        return res.status(404).json({ message: 'Problem not found on LeetCode' });
      }

      const q = data.data.question;
      const plainText = (q.content || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/\s{2,}/g, ' ').trim();

      return res.json({
        title: q.title,
        difficulty: q.difficulty,
        statement: plainText,
        topicTags: (q.topicTags || []).map(t => t.name)
      });
    } catch (err) {
      console.error('[LC Fetch] Error:', err.message);
      return res.status(500).json({ message: `Failed to fetch from LeetCode` });
    }
  } else if (isCodeforces) {
    try {
      console.log(`[CF Fetch] Fetching problem statement for: ${link}`);
      const response = await fetch(link, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (!response.ok) throw new Error(`Codeforces returned ${response.status}`);
      
      const html = await response.text();
      
      // Try to isolate the problem statement div to avoid sidebar noise
      const match = html.match(/<div[^>]*class="problem-statement"[^>]*>([\s\S]*?)<\/div>\s*<script/i) || 
                    html.match(/<div[^>]*class="problem-statement"[^>]*>([\s\S]*?)<div class="test-example-line/i) ||
                    html.match(/<div[^>]*class="problem-statement"[^>]*>([\s\S]*?)<\/div>(?:<br|<div)/i);
                    
      let bodyHtml = match ? match[1] : html;

      // Extract title if possible
      let title = "Codeforces Problem";
      const titleMatch = bodyHtml.match(/<div class="title">([^<]+)<\/div>/i);
      if (titleMatch) title = titleMatch[1].replace(/^[A-Z]\.\s*/, '').trim();

      const plainText = bodyHtml
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
        .replace(/\$\$\$([^\$]+)\$\$\$/g, '$1') // Simple mathjax unwrap
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/\s{2,}/g, ' ')
        .trim();

      console.log(`[CF Fetch] Got statement for "${title}" (${plainText.length} chars)`);

      return res.json({
        title: title,
        difficulty: 'Medium', // CF doesn't provide easy string difficulties directly
        statement: plainText.substring(0, 8000), // AI prompt limit safety
        topicTags: []
      });
    } catch (err) {
      console.error('[CF Fetch] Error:', err.message);
      return res.status(500).json({ message: `Failed to fetch from Codeforces` });
    }
  }
});

// ─── AI Metadata Suggestion ────────────────────────────────────────────────────
// @route  POST /api/problems/ai-suggest
// @desc   Use AI to suggest metadata from problem + solution
// @access Private
router.post('/ai-suggest', auth, async (req, res) => {
  try {
    const { name, link, solutionCode, problemStatement } = req.body;
    const input = link || name || 'Unknown Problem';

    if (!solutionCode && !name && !link) {
      return res.status(400).json({ message: 'Provide at least a problem name, link, or solution code.' });
    }

    console.log(`[AI Suggest] Problem: "${input}", Has statement: ${!!problemStatement}, Has code: ${!!solutionCode}`);

    const metadata = await suggestProblemMetadata(input, solutionCode, problemStatement);
    console.log('[AI Result]', JSON.stringify(metadata, null, 2));
    res.json(metadata);
  } catch (err) {
    console.error('[AI Error]', err.message);
    res.status(500).json({ message: err.message || 'AI extraction failed' });
  }
});

module.exports = router;
