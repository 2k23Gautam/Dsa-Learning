const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Problem = require('../models/Problem');
const User = require('../models/User');
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
    const problems = await Problem.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
    const formatted = problems.map(obj => {
      obj.id = obj._id.toString();
      return obj;
    });
    res.json(formatted);
  } catch (err) {
    console.error('Problem API Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

function cleanProblemStatement(text) {
  if (!text) return '';
  let cleaned = text;
  // Strip Leetcode titles and header boilerplates
  cleaned = cleaned.replace(/^\s*(?:\d+\.\s+)?[\s\S]+?\b(?:Solved|Easy|Medium|Hard)\b[\s,]*\b(?:Topics|Companies|Hint|premium\s+lock\s+icon)\b[\s\S]*?\b(?:Companies|Hint(?:\s+\d+)?|premium\s+lock\s+icon)\b\s*/i, '');
  cleaned = cleaned.replace(/^\s*(?:Solved|Easy|Medium|Hard|Topics|Companies|Hint(?:\s+\d+)?|premium\s+lock\s+icon|\s)+/i, '');
  cleaned = cleaned.replace(/\bpremium\s+lock\s+icon\b/gi, '');
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
  return cleaned;
}

function htmlToMarkdown(html) {
  if (!html) return '';
  
  let text = html;
  
  // Replace block elements and lists with appropriate line breaks/markdown
  text = text.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (match, code) => {
    const cleanCode = code.replace(/<[^>]+>/g, '');
    return `\n\`\`\`\n${cleanCode.trim()}\n\`\`\`\n`;
  });
  
  text = text.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (match, code) => {
    return ` \`${code.replace(/<[^>]+>/g, '')}\` `;
  });

  text = text.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  text = text.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
  text = text.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
  text = text.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');
  
  text = text.replace(/<li[^>]*>/gi, '\n- ');
  text = text.replace(/<\/li>/gi, '');
  text = text.replace(/<ul[^>]*>/gi, '\n');
  text = text.replace(/<\/ul>/gi, '\n');
  text = text.replace(/<ol[^>]*>/gi, '\n');
  text = text.replace(/<\/ol>/gi, '\n');
  
  text = text.replace(/<p[^>]*>/gi, '\n\n');
  text = text.replace(/<\/p>/gi, '\n');
  
  text = text.replace(/<div[^>]*>/gi, '\n');
  text = text.replace(/<\/div>/gi, '\n');
  
  text = text.replace(/<br\s*\/?>/gi, '\n');
  
  // Remove all other HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&amp;/g, '&')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'");
             
  // Clean up excessive empty lines
  text = text.replace(/\n{3,}/g, '\n\n');
  
  return text.trim();
}

// Sanitize body: coerce any string-typed fields that accidentally came as arrays
function sanitizeBody(body) {
  const STRING_FIELDS = ['name', 'link', 'platform', 'difficulty', 'status', 'approach',
    'notes', 'solutionCode', 'problemStatement', 'timeComplexity', 'spaceComplexity',
    'dateSolved', 'revisionDate'];
  const cleaned = { ...body };
  for (const field of STRING_FIELDS) {
    if (Array.isArray(cleaned[field])) {
      cleaned[field] = cleaned[field].join('\n');
    }
  }
  if (cleaned.problemStatement) {
    cleaned.problemStatement = cleanProblemStatement(cleaned.problemStatement);
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

// ─── Fetch Problem Statement from LeetCode, Codeforces or GFG ───────────────────────────────
// @route  POST /api/problems/fetch-statement
// @desc   Fetch the problem statement text
// @access Private
router.post('/fetch-statement', auth, async (req, res) => {
  const { link } = req.body;
  if (!link) return res.status(400).json({ message: 'Link is required' });

  const lcMatch = link.match(/leetcode\.(?:com|cn)\/problems\/([\w-]+)/i);
  const isCodeforces = /codeforces\.com\/(contest|problemset)\//i.test(link);
  const gfgMatch = link.match(/geeksforgeeks\.org\/problems\/([\w-]+)/i);

  if (!lcMatch && !isCodeforces && !gfgMatch) {
    return res.status(400).json({ message: 'Not a valid LeetCode, Codeforces, or GeeksforGeeks URL' });
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
      const domain = link.includes('.cn') ? 'leetcode.cn' : 'leetcode.com';
      const response = await fetch(`https://${domain}/graphql/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Referer': `https://${domain}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Origin': `https://${domain}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ query, variables: { titleSlug: slug } }),
      });

      if (!response.ok) throw new Error(`LeetCode API returned ${response.status}`);
      const data = await response.json();

      if (data.errors || !data.data?.question) {
        return res.status(404).json({ message: 'Problem not found on LeetCode' });
      }

      const q = data.data.question;
      const formattedStatement = htmlToMarkdown(q.content || '');

      return res.json({
        title: q.title,
        difficulty: q.difficulty,
        statement: cleanProblemStatement(formattedStatement),
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
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!response.ok) throw new Error(`Codeforces returned ${response.status}`);
      
      const html = await response.text();
      
      const match = html.match(/<div[^>]*class="problem-statement"[^>]*>([\s\S]*?)<\/div>\s*<script/i) || 
                    html.match(/<div[^>]*class="problem-statement"[^>]*>([\s\S]*?)<div class="test-example-line/i) ||
                    html.match(/<div[^>]*class="problem-statement"[^>]*>([\s\S]*?)<\/div>(?:<br|<div)/i);
                    
      let bodyHtml = match ? match[1] : html;

      let title = "Codeforces Problem";
      const titleMatch = bodyHtml.match(/<div class="title">([^<]+)<\/div>/i);
      if (titleMatch) title = titleMatch[1].replace(/^[A-Z]\.\s*/, '').trim();

      const plainText = bodyHtml
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
        .replace(/\$\$\$([^\$]+)\$\$\$/g, '$1')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/\s{2,}/g, ' ')
        .trim();

      console.log(`[CF Fetch] Got statement for "${title}" (${plainText.length} chars)`);

      return res.json({
        title: title,
        difficulty: 'Medium',
        statement: cleanProblemStatement(plainText).substring(0, 8000),
        topicTags: []
      });
    } catch (err) {
      console.error('[CF Fetch] Error:', err.message);
      return res.status(500).json({ message: `Failed to fetch from Codeforces` });
    }
  } else if (gfgMatch) {
    try {
      console.log(`[GFG Fetch] Fetching problem statement for: ${link}`);
      const response = await fetch(link, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!response.ok) throw new Error(`GeeksforGeeks returned ${response.status}`);
      
      const html = await response.text();
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      
      let title = "GFG Problem";
      let difficulty = "Medium";
      let statement = "";
      
      if (nextDataMatch) {
        const nextDataJson = JSON.parse(nextDataMatch[1]);
        const allData = nextDataJson.props?.pageProps?.initialState?.problemData?.allData;
        if (allData && allData.probData) {
          const pd = allData.probData;
          title = pd.problem_name || pd.title || title;
          difficulty = pd.difficulty || difficulty;
          const rawDesc = pd.problem_description || pd.description || pd.summary || "";
          statement = htmlToMarkdown(rawDesc);
        }
      }
      
      if (!statement) {
        // Strip other scripts/styles first, then parse to markdown
        const bodyOnly = html
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ');
        statement = htmlToMarkdown(bodyOnly);
      }

      console.log(`[GFG Fetch] Got statement for "${title}" (${statement.length} chars)`);

      return res.json({
        title: title,
        difficulty: difficulty,
        statement: cleanProblemStatement(statement).substring(0, 8000),
        topicTags: []
      });
    } catch (err) {
      console.error('[GFG Fetch] Error:', err.message);
      return res.status(500).json({ message: `Failed to fetch from GeeksforGeeks` });
    }
  }
});

// ─── AI Metadata Suggestion ────────────────────────────────────────────────────
// @route  POST /api/problems/ai-suggest
// @desc   Use AI to suggest metadata from problem + solution
// @access Private
router.post('/ai-suggest', auth, async (req, res) => {
  try {
    const { name, link, solutionCode, problemStatement, instructions } = req.body;
    const input = link || name || 'Unknown Problem';

    if (!solutionCode && !name && !link) {
      return res.status(400).json({ message: 'Provide at least a problem name, link, or solution code.' });
    }

    console.log(`[AI Suggest] Problem: "${input}", Has statement: ${!!problemStatement}, Has code: ${!!solutionCode}, Has instructions: ${!!instructions}`);

    // Fetch distinct topics and patterns for the user to help deduplicate
    const [existingTopics, existingPatterns, user] = await Promise.all([
      Problem.distinct('topics', { user: req.user.id }),
      Problem.distinct('patterns', { user: req.user.id }),
      User.findById(req.user.id)
    ]);

    const userApiKey = user?.geminiApiKey || null;
    const groqApiKey = user?.groqApiKey || null;
    const openRouterApiKey = user?.openRouterApiKey || null;
    const preferredModel = user?.preferredAiModel || null;
    const metadata = await suggestProblemMetadata(input, solutionCode, problemStatement, existingTopics, existingPatterns, userApiKey, groqApiKey, preferredModel, openRouterApiKey, instructions);
    console.log('[AI Result]', JSON.stringify(metadata, null, 2));
    res.json(metadata);
  } catch (err) {
    console.error('[AI Error]', err.message);
    res.status(500).json({ message: err.message || 'AI extraction failed' });
  }
});

module.exports = router;
