import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { useAuth } from './AuthContext.jsx';
import { SEED_PROBLEMS } from './data.js';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'dsa_tracker_v1';
const THEME_KEY   = 'dsa_theme';
const DISMISSED_KEY = 'dsa_dismissed_slugs';

// Define the base API URL
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');

export function buildApiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export function buildAssetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

function genId() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

// ─── Context ────────────────────────────────────────────────────────────────
const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const { authUser, updateAuthUser, token } = useAuth();
  const [problems, setProblems] = useState([]);

  useEffect(() => {
    if (!token) {
      setProblems([]);
      return;
    }
    const fetchProblems = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/problems`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProblems(data);
        }
      } catch (err) {
        console.error('Failed to fetch problems', err);
      }
    };
    fetchProblems();
  }, [token]);

  const addProblem = useCallback(async (data) => {
    if (!token) return null;
    try {
      const p = { ...data, revisionCount: data.revisionCount ?? 0 };
      const res = await fetch(`${API_BASE_URL}/api/problems`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(p)
      });

      if (res.ok) {
        const saved = await res.json();
        setProblems(prev => [saved, ...prev]);
        toast.success('Problem added successfully!');
        return saved;
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to add problem');
        return null;
      }
    } catch (err) {
      toast.error('Connection error. Server may be down.');
      console.error(err);
    }
    return null;
  }, [token]);

  const updateProblem = useCallback(async (id, updates) => {
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/api/problems/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (res.ok) {
        const saved = await res.json();
        setProblems(prev => prev.map(p => p.id === id ? saved : p));
        toast.success('Problem updated!');
        return saved;
      } else {
        const error = await res.json();
        toast.error(error.message || 'Update failed');
        return null;
      }
    } catch (err) {
      toast.error('Connection error.');
      console.error(err);
    }
    return null;
  }, [token]);

  const deleteProblem = useCallback(async (id) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/problems/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setProblems(prev => prev.filter(p => p.id !== id));
        toast.success('Problem deleted');
      } else {
        toast.error('Failed to delete problem');
      }
    } catch (err) {
      toast.error('Connection error.');
      console.error(err);
    }
  }, [token]);

  // ── Filters & View State ──────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    difficulty: 'All',
    status: 'All',
    topic: 'All',
    pattern: 'All',
    potd: false,
    showPanel: false,
    dateRange: { start: null, end: null },
    sortBy: 'dateSolved',
    sortDesc: true,
  });

  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const togglePOTD = useCallback((arg) => {
    if (typeof arg === 'boolean') {
      setFilters(prev => ({ ...prev, potd: arg }));
    } else {
      updateProblem(arg, { isPOTD: !problems.find(p => p.id === arg)?.isPOTD });
    }
  }, [problems, updateProblem]);

  const setDateRange = useCallback((start, end) => {
    setFilters(prev => ({ ...prev, dateRange: { start, end } }));
  }, []);

  // ── Theme ─────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'dark');

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), []);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const stats = {
    total: problems.length,
    easy: problems.filter(p => p.difficulty === 'Easy').length,
    medium: problems.filter(p => p.difficulty === 'Medium').length,
    hard: problems.filter(p => p.difficulty === 'Hard').length,
    solved: problems.filter(p => p.status === 'Solved' || p.status === 'Revised').length,
    today: problems.filter(p => p.dateSolved && p.dateSolved.substring(0, 10) === todayStr).length,
    needsRevision: problems.filter(p => p.status === 'Needs Revision').length,
    streak: calcStreak(problems),
  };

  const activityData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const count = problems.filter(p => p.dateSolved && p.dateSolved.substring(0, 10) === dateStr).length;
      data.push({ date: format(d, 'MMM dd'), count });
    }
    return data;
  }, [problems]);

  // ── Global Activity Detection ───────────────────────────────────────────
  const [rawAllSubmissions, setRawAllSubmissions] = useState([]);
  const [dismissedSlugs, setDismissedSlugs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(DISMISSED_KEY)) || []; } catch { return []; }
  });
  const [lastSyncTime, setLastSyncTime] = useState(0);
  const isSyncingRef = useRef(false);
  const lastSyncAtRef = useRef(0); // hard throttle for syncAllPlatformStats
  // Use a ref so syncAllPlatformStats can read current values without being in its own deps
  const authUserRef = useRef(authUser);
  const tokenRef = useRef(token);
  useEffect(() => { authUserRef.current = authUser; }, [authUser]);
  useEffect(() => { tokenRef.current = token; }, [token]);

  useEffect(() => {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissedSlugs));
  }, [dismissedSlugs]);

  const checkGlobalSubmissions = useCallback(async (force = false) => {
    if (!token) return;
    
    const now = Date.now();
    if (!force && (now - lastSyncTime < 5 * 60 * 1000)) {
       return;
    }

    try {
      let combined = [];

      // 1. LeetCode
      if (authUser?.leetcodeUsername) {
        const res = await fetch(`${API_BASE_URL}/api/leetcode/recent/${authUser.leetcodeUsername}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const recent = await res.json();
          combined = [...combined, ...recent.map(s => ({ ...s, platform: 'LeetCode' }))];
        }
      }

      // 2. Codeforces - fetch recent AC submissions from their public API
      if (authUser?.codeforcesHandle) {
        try {
          const cfRes = await fetch(
            `https://codeforces.com/api/user.status?handle=${authUser.codeforcesHandle}&from=1&count=30`
          );
          if (cfRes.ok) {
            const cfJson = await cfRes.json();
            if (cfJson.status === 'OK') {
              const acSubmissions = cfJson.result
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
              combined = [...combined, ...acSubmissions];
            }
          }
        } catch (cfErr) {
          console.warn('CF submission fetch failed:', cfErr);
        }
      }

      setRawAllSubmissions(combined);
      setLastSyncTime(Date.now());
    } catch (err) {
      console.error('Detection error:', err);
    }
  }, [token, authUser, lastSyncTime]);

  const detectedSubmissions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    return rawAllSubmissions.filter(rs => {
      // Normalize timestamp to milliseconds
      // LeetCode returns epoch in seconds; CF already stored as ms (we multiplied ×1000 above)
      const rawTs = parseInt(rs.timestamp);
      const tsMs = rawTs > 1_000_000_000_000 ? rawTs : rawTs * 1000;

      if (tsMs < todayTimestamp) return false;
      if (dismissedSlugs.includes(rs.titleSlug)) return false;

      // Deduplicate against already-tracked problems
      const isAlreadyTracked = problems.some(p => {
        const nameMatch = p.name.trim().toLowerCase() === rs.title.trim().toLowerCase();
        let linkMatch = false;
        if (p.link) {
          try {
            const url = new URL(p.link);
            const paths = url.pathname.split('/').filter(Boolean);
            if (rs.platform === 'LeetCode') {
              const probIdx = paths.indexOf('problems');
              if (probIdx !== -1 && probIdx + 1 < paths.length) {
                linkMatch = paths[probIdx + 1].toLowerCase() === rs.titleSlug.toLowerCase();
              } else {
                linkMatch = paths.some(seg => seg.toLowerCase() === rs.titleSlug.toLowerCase());
              }
            } else if (rs.platform === 'Codeforces') {
              linkMatch = p.link.includes(`codeforces.com`) &&
                paths.some(seg => seg.toLowerCase() === rs.titleSlug.split('-')[1]?.toLowerCase());
            }
          } catch {
            linkMatch = p.link.toLowerCase().includes(rs.titleSlug.toLowerCase());
          }
        }
        return nameMatch || linkMatch;
      });

      return !isAlreadyTracked;
    });
  }, [rawAllSubmissions, problems, dismissedSlugs]);

  // ─── syncAllPlatformStats ─────────────────────────────────────────────────
  // IMPORTANT: uses refs for authUser/token to avoid being recreated when
  // updateAuthUser() is called — which was causing an infinite sync loop.
  const syncAllPlatformStats = useCallback(async () => {
    const tok = tokenRef.current;
    const user = authUserRef.current;
    if (!tok || isSyncingRef.current) return;

    // Hard throttle: only sync at most once every 5 minutes
    const now = Date.now();
    if (now - lastSyncAtRef.current < 5 * 60 * 1000) return;

    isSyncingRef.current = true;
    lastSyncAtRef.current = now;
    try {
      if (user?.leetcodeUsername) {
        const res = await fetch(`${API_BASE_URL}/api/leetcode/stats/${user.leetcodeUsername}`, {
          headers: { 'Authorization': `Bearer ${tok}` }
        });
        if (res.ok) {
          const stats = await res.json();
          const syncRes = await fetch(`${API_BASE_URL}/api/leetcode/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
            body: JSON.stringify({ leetcodeUsername: user.leetcodeUsername, stats })
          });
          if (syncRes.ok) {
            const data = await syncRes.json();
            if (data.user) updateAuthUser(data.user);
          }
        }
      }
    } catch (err) {
      console.error('Auto-sync error:', err);
    } finally {
      isSyncingRef.current = false;
    }
  }, [updateAuthUser]); // stable dep — updateAuthUser is useCallback with []

  useEffect(() => {
    if (token) {
      checkGlobalSubmissions(true);
      syncAllPlatformStats();
    }
    
    const interval = setInterval(() => {
      if (token) {
        checkGlobalSubmissions(true);
        syncAllPlatformStats();
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [token, authUser?.leetcodeUsername, authUser?.codeforcesHandle]);

  const dismissSubmission = (titleSlug) => {
    setDismissedSlugs(prev => [...prev, titleSlug]);
  };

  const value = {
    problems, addProblem, updateProblem, deleteProblem,
    theme, toggleTheme,
    stats, todayStr, activityData,
    filters, setFilter, togglePOTD, setDateRange, authUser,
    detectedSubmissions, dismissSubmission, checkGlobalSubmissions,
    syncAllPlatformStats, lastSyncTime
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function calcStreak(problems) {
  const solvedDates = [...new Set(
    problems.filter(p => p.dateSolved).map(p => p.dateSolved.substring(0, 10))
  )].sort().reverse();

  if (!solvedDates.length) return 0;

  const today = new Date().toISOString().slice(0, 10);
  let streak = 0;
  let check = today;

  for (const d of solvedDates) {
    if (d === check) {
      streak++;
      const dt = new Date(check);
      dt.setDate(dt.getDate() - 1);
      check = dt.toISOString().slice(0, 10);
    } else if (d < check) {
      break;
    }
  }
  return streak;
}
