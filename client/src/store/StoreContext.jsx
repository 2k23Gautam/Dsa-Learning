import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { useAuth } from './AuthContext.jsx';
import { SEED_PROBLEMS } from './data.js';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'dsa_tracker_v1';
const THEME_KEY   = 'dsa_theme';
const DISMISSED_KEY = 'dsa_dismissed_slugs';
const PROBLEMS_CACHE_PREFIX = 'dsa_problems_cache_v1';

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

function getUserCacheKey(authUser) {
  const userId = authUser?._id || authUser?.id || authUser?.email;
  return userId ? `${PROBLEMS_CACHE_PREFIX}:${userId}` : null;
}

function readProblemsCache(authUser) {
  const key = getUserCacheKey(authUser);
  if (!key) return null;

  try {
    const cached = JSON.parse(localStorage.getItem(key));
    return Array.isArray(cached?.problems) ? cached.problems : null;
  } catch {
    return null;
  }
}

function writeProblemsCache(cacheKey, problems) {
  if (!cacheKey) return;

  try {
    localStorage.setItem(cacheKey, JSON.stringify({ problems, updatedAt: Date.now() }));
  } catch {
    // A full or unavailable localStorage should never block the app.
  }
}

// ─── Context ────────────────────────────────────────────────────────────────
const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const { authUser, updateAuthUser, token } = useAuth();
  const currentUserCacheKey = getUserCacheKey(authUser);
  const initialCachedProblemsRef = useRef();
  if (initialCachedProblemsRef.current === undefined) {
    initialCachedProblemsRef.current = readProblemsCache(authUser);
  }
  const initialCachedProblems = initialCachedProblemsRef.current;
  const [problems, setProblems] = useState(initialCachedProblems || []);
  const [loadedProblemsUserKey, setLoadedProblemsUserKey] = useState(
    token && initialCachedProblems !== null ? currentUserCacheKey : null
  );
  const [problemsRefreshing, setProblemsRefreshing] = useState(false);
  const problemsLoading = Boolean(token) && (!currentUserCacheKey || loadedProblemsUserKey !== currentUserCacheKey);

  useEffect(() => {
    if (!token) {
      setProblems([]);
      setLoadedProblemsUserKey(null);
      setProblemsRefreshing(false);
      return;
    }

    const cachedProblems = readProblemsCache(authUser);
    setProblems(cachedProblems || []);
    setLoadedProblemsUserKey(cachedProblems !== null ? currentUserCacheKey : null);

    const controller = new AbortController();
    const fetchProblems = async () => {
      setProblemsRefreshing(cachedProblems !== null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/problems`, {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: controller.signal
        });
        if (res.ok) {
          const data = await res.json();
          setProblems(data);
          writeProblemsCache(currentUserCacheKey, data);
        }
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Failed to fetch problems', err);
      } finally {
        if (!controller.signal.aborted) {
          setLoadedProblemsUserKey(currentUserCacheKey);
          setProblemsRefreshing(false);
        }
      }
    };
    fetchProblems();
    return () => controller.abort();
  }, [token, currentUserCacheKey]);

  useEffect(() => {
    if (token && loadedProblemsUserKey === currentUserCacheKey) {
      writeProblemsCache(currentUserCacheKey, problems);
    }
  }, [currentUserCacheKey, loadedProblemsUserKey, problems, token]);

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

  const stats = useMemo(() => ({
    total: problems.length,
    easy: problems.filter(p => p.difficulty === 'Easy').length,
    medium: problems.filter(p => p.difficulty === 'Medium').length,
    hard: problems.filter(p => p.difficulty === 'Hard').length,
    solved: problems.filter(p => p.status === 'Solved' || p.status === 'Revised').length,
    today: problems.filter(p => p.dateSolved && p.dateSolved.substring(0, 10) === todayStr).length,
    needsRevision: problems.filter(p => p.status === 'Needs Revision').length,
    streak: calcStreak(problems),
  }), [problems, todayStr]);

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
  const [submissionSyncError, setSubmissionSyncError] = useState(null);
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

    setSubmissionSyncError(null);
    let combined = [];
    let hasError = false;

    // 1. LeetCode
    if (authUser?.leetcodeUsername) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/leetcode/recent/${authUser.leetcodeUsername}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const recent = await res.json();
          if (Array.isArray(recent)) {
            combined = [...combined, ...recent.map(s => ({ ...s, platform: 'LeetCode' }))];
            console.log(`[Tracker] LeetCode: fetched ${recent.length} recent AC submissions`);
          } else {
            console.warn('[Tracker] LeetCode recent returned non-array:', recent);
          }
        } else {
          const errText = await res.text();
          console.warn(`[Tracker] LeetCode recent fetch failed (${res.status}):`, errText);
          hasError = true;
        }
      } catch (lcErr) {
        console.warn('[Tracker] LeetCode fetch error:', lcErr.message);
        hasError = true;
      }
    }

    // 2. Codeforces - fetch recent AC submissions from backend proxy
    if (authUser?.codeforcesHandle) {
      try {
        const cfRes = await fetch(`${API_BASE_URL}/api/codeforces/recent/${authUser.codeforcesHandle}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (cfRes.ok) {
          const acSubmissions = await cfRes.json();
          if (Array.isArray(acSubmissions)) {
            combined = [...combined, ...acSubmissions];
            console.log(`[Tracker] Codeforces: fetched ${acSubmissions.length} recent AC submissions`);
          } else {
            console.warn('[Tracker] Codeforces recent returned non-array:', acSubmissions);
          }
        } else {
          console.warn(`[Tracker] Codeforces fetch failed (${cfRes.status})`);
          hasError = true;
        }
      } catch (cfErr) {
        console.warn('[Tracker] CF submission fetch error:', cfErr.message);
        hasError = true;
      }
    }

    console.log(`[Tracker] Total raw submissions: ${combined.length}, dismissed: ${dismissedSlugs.length}`);
    setRawAllSubmissions(combined);
    setLastSyncTime(Date.now());
    if (hasError && combined.length === 0) {
      setSubmissionSyncError('Could not reach LeetCode/Codeforces API. Check server logs.');
    }
  }, [token, authUser, lastSyncTime, dismissedSlugs]);

  const detectedSubmissions = useMemo(() => {
    const detectionRangeLimit = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    const rangeStartTime = Date.now() - detectionRangeLimit;

    return rawAllSubmissions.filter(rs => {
      // Normalize timestamp to milliseconds
      const rawTs = parseInt(rs.timestamp);
      const tsMs = rawTs > 1_000_000_000_000 ? rawTs : rawTs * 1000;

      if (tsMs < rangeStartTime) return false;
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
              const slugParts = rs.titleSlug.split('-'); // [contestId, index]
              linkMatch = p.link.includes(`codeforces.com`) &&
                paths.includes(slugParts[0]) &&
                paths.includes(slugParts[1]);
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

      if (user?.codeforcesHandle) {
        const res = await fetch(`${API_BASE_URL}/api/codeforces/stats/${user.codeforcesHandle}`, {
          headers: { 'Authorization': `Bearer ${tok}` }
        });
        if (res.ok) {
          const stats = await res.json();
          const syncRes = await fetch(`${API_BASE_URL}/api/codeforces/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
            body: JSON.stringify({ codeforcesHandle: user.codeforcesHandle, stats })
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
    if (token && !problemsLoading && !problemsRefreshing) {
      const initialSync = setTimeout(() => {
        checkGlobalSubmissions(true);
        syncAllPlatformStats();
      }, 1500);

      const interval = setInterval(() => {
        checkGlobalSubmissions(true);
        syncAllPlatformStats();
      }, 5 * 60 * 1000);

      return () => {
        clearTimeout(initialSync);
        clearInterval(interval);
      };
    }
  }, [token, authUser?.leetcodeUsername, authUser?.codeforcesHandle, problemsLoading, problemsRefreshing]);

  const dismissSubmission = (titleSlug) => {
    setDismissedSlugs(prev => [...prev, titleSlug]);
  };

  const clearDismissedSubmissions = () => {
    setDismissedSlugs([]);
    localStorage.removeItem(DISMISSED_KEY);
    console.log('[Tracker] Cleared all dismissed slugs');
  };

  const value = useMemo(() => ({
    problems, addProblem, updateProblem, deleteProblem, problemsLoading, problemsRefreshing,
    theme, toggleTheme,
    stats, todayStr, activityData,
    filters, setFilter, togglePOTD, setDateRange, authUser,
    detectedSubmissions, dismissSubmission, checkGlobalSubmissions,
    clearDismissedSubmissions, submissionSyncError,
    syncAllPlatformStats, lastSyncTime
  }), [
    problems, addProblem, updateProblem, deleteProblem, problemsLoading, problemsRefreshing,
    theme, toggleTheme,
    stats, todayStr, activityData,
    filters, setFilter, togglePOTD, setDateRange, authUser,
    detectedSubmissions, dismissSubmission, checkGlobalSubmissions,
    clearDismissedSubmissions, submissionSyncError,
    syncAllPlatformStats, lastSyncTime
  ]);

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
