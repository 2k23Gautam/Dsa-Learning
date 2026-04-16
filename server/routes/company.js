const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const CompanyProblem = require('../models/CompanyProblem');
const CompanyProgress = require('../models/CompanyProgress');
const { getProblemsForCompany, getAllCompanies } = require('../utils/companySeed');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretfallback';
const THREE_WEEKS_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

// ── Auth Middleware ─────────────────────────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(400).json({ message: 'Token invalid' });
  }
};

// ── Seed / Append helper ───────────────────────────────────────────────────
/**
 * Ensures the DB has all problems from the seed for `company`.
 * Only inserts NEW entries (matched by company+name). Never mutates existing ones.
 * Returns after the upsert so callers can await it.
 */
async function ensureSeedProblems(company) {
  const seedProblems = getProblemsForCompany(company);
  if (!seedProblems.length) return;

  const ops = seedProblems.map(p => ({
    updateOne: {
      filter: { company, name: p.name },
      update: {
        $setOnInsert: {
          company,
          name: p.name,
          link: p.link,
          difficulty: p.difficulty,
          topics: p.topics || [],
          frequency: p.frequency || 3,
          addedAt: new Date(),
          lastUpdated: new Date(),
        },
      },
      upsert: true,
    },
  }));

  await CompanyProblem.bulkWrite(ops, { ordered: false });
}

/**
 * Checks if any problems for `company` are older than 3 weeks.
 * If so, runs ensureSeedProblems to append any new problems (non-destructive).
 * Runs async — does NOT block the response.
 */
async function maybeRefresh(company) {
  try {
    const oldest = await CompanyProblem.findOne({ company }).sort({ lastUpdated: 1 }).lean();
    if (!oldest || Date.now() - new Date(oldest.lastUpdated).getTime() > THREE_WEEKS_MS) {
      console.log(`[Company Refresh] Running for ${company}…`);
      await ensureSeedProblems(company);
      // Stamp all records as freshly checked
      await CompanyProblem.updateMany({ company }, { $set: { lastUpdated: new Date() } });
      console.log(`[Company Refresh] Done for ${company}`);
    }
  } catch (err) {
    console.error('[Company Refresh Error]', err.message);
  }
}

// ── GET /api/company/list ───────────────────────────────────────────────────
// Returns all companies with total problem count and user's solved count
router.get('/list', auth, async (req, res) => {
  try {
    const companies = getAllCompanies();

    // Seed any company that has 0 docs (first boot)
    for (const co of companies) {
      const count = await CompanyProblem.countDocuments({ company: co });
      if (count === 0) await ensureSeedProblems(co);
    }

    // Build stats per company
    const result = await Promise.all(companies.map(async (company) => {
      const total = await CompanyProblem.countDocuments({ company });

      // Get all problem IDs for this company
      const problemIds = (await CompanyProblem.find({ company }, '_id').lean()).map(p => p._id);

      const solved = await CompanyProgress.countDocuments({
        user: req.user.id,
        company,
        companyProblemId: { $in: problemIds },
        status: 'Solved',
      });

      const attempted = await CompanyProgress.countDocuments({
        user: req.user.id,
        company,
        companyProblemId: { $in: problemIds },
        status: 'Attempted',
      });

      return { company, total, solved, attempted };
    }));

    res.json(result);
  } catch (err) {
    console.error('[Company List Error]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/company/:company/problems ─────────────────────────────────────
// Returns all problems for a company merged with the user's progress
router.get('/:company/problems', auth, async (req, res) => {
  try {
    const { company } = req.params;

    // Async 3-week refresh check (non-blocking)
    maybeRefresh(company).catch(console.error);

    // Ensure at least the seed problems exist (blocking on first visit)
    const count = await CompanyProblem.countDocuments({ company });
    if (count === 0) await ensureSeedProblems(company);

    const problems = await CompanyProblem.find({ company }).sort({ frequency: -1, difficulty: 1 }).lean();

    if (!problems.length) {
      return res.json([]);
    }

    const problemIds = problems.map(p => p._id);
    const progressRecords = await CompanyProgress.find({
      user: req.user.id,
      companyProblemId: { $in: problemIds },
    }).lean();

    // Build a fast lookup map
    const progressMap = {};
    progressRecords.forEach(pr => {
      progressMap[pr.companyProblemId.toString()] = pr;
    });

    const merged = problems.map(p => ({
      ...p,
      id: p._id.toString(),
      status: progressMap[p._id.toString()]?.status || 'Not Started',
      solvedAt: progressMap[p._id.toString()]?.solvedAt || null,
    }));

    res.json(merged);
  } catch (err) {
    console.error('[Company Problems Error]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /api/company/:company/progress ────────────────────────────────────
// Upsert user's progress on a specific problem (cycle or set status)
router.post('/:company/progress', auth, async (req, res) => {
  try {
    const { company } = req.params;
    const { problemId, status } = req.body;

    if (!problemId || !status) {
      return res.status(400).json({ message: 'problemId and status are required' });
    }

    const validStatuses = ['Not Started', 'Attempted', 'Solved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Verify problem exists
    const problem = await CompanyProblem.findById(problemId);
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    const update = {
      user: req.user.id,
      companyProblemId: problemId,
      company,
      status,
      ...(status === 'Solved' ? { solvedAt: new Date() } : { solvedAt: null }),
    };

    const record = await CompanyProgress.findOneAndUpdate(
      { user: req.user.id, companyProblemId: problemId },
      { $set: update },
      { upsert: true, new: true }
    );

    res.json(record);
  } catch (err) {
    console.error('[Company Progress Error]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/company/:company/stats ────────────────────────────────────────
// Returns per-company breakdown: solved/attempted/not-started by difficulty
router.get('/:company/stats', auth, async (req, res) => {
  try {
    const { company } = req.params;

    const problems = await CompanyProblem.find({ company }).lean();
    const problemIds = problems.map(p => p._id);

    const progressRecords = await CompanyProgress.find({
      user: req.user.id,
      companyProblemId: { $in: problemIds },
    }).lean();

    const progressMap = {};
    progressRecords.forEach(pr => {
      progressMap[pr.companyProblemId.toString()] = pr.status;
    });

    const stats = {
      total: problems.length,
      solved: 0, attempted: 0, notStarted: 0,
      easy: { total: 0, solved: 0 },
      medium: { total: 0, solved: 0 },
      hard: { total: 0, solved: 0 },
      solvedByDate: {}, // 'yyyy-MM-dd': count
    };

    problems.forEach(p => {
      const status = progressMap[p._id.toString()] || 'Not Started';
      const diff = (p.difficulty || 'Medium').toLowerCase();

      if (diff === 'easy') stats.easy.total++;
      else if (diff === 'medium') stats.medium.total++;
      else if (diff === 'hard') stats.hard.total++;

      if (status === 'Solved') {
        stats.solved++;
        if (diff === 'easy') stats.easy.solved++;
        else if (diff === 'medium') stats.medium.solved++;
        else if (diff === 'hard') stats.hard.solved++;
      } else if (status === 'Attempted') {
        stats.attempted++;
      } else {
        stats.notStarted++;
      }
    });

    // Also compute solved-by-date from CompanyProgress
    progressRecords
      .filter(pr => pr.status === 'Solved' && pr.solvedAt)
      .forEach(pr => {
        const d = new Date(pr.solvedAt).toISOString().slice(0, 10);
        stats.solvedByDate[d] = (stats.solvedByDate[d] || 0) + 1;
      });

    res.json(stats);
  } catch (err) {
    console.error('[Company Stats Error]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
