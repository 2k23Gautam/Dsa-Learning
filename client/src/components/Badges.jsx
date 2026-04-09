export function DifficultyBadge({ difficulty }) {
  let [color, bg, border, dot] = ['', '', '', ''];
  if (difficulty === 'Easy') {
    color = 'text-emerald-700 dark:text-emerald-400';
    bg = 'bg-emerald-50 dark:bg-emerald-500/10';
    border = 'border-emerald-200 dark:border-emerald-500/20';
    dot = 'bg-emerald-500';
  } else if (difficulty === 'Medium') {
    color = 'text-amber-700 dark:text-amber-400';
    bg = 'bg-amber-50 dark:bg-amber-500/10';
    border = 'border-amber-200 dark:border-amber-500/20';
    dot = 'bg-amber-500';
  } else {
    color = 'text-rose-700 dark:text-rose-400';
    bg = 'bg-rose-50 dark:bg-rose-500/10';
    border = 'border-rose-200 dark:border-rose-500/20';
    dot = 'bg-rose-500';
  }

  return (
    <span className={`badge ${bg} ${color} border ${border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} opacity-80`} />
      {difficulty}
    </span>
  );
}

export function PlatformBadge({ platform = '' }) {
  let [color, bg, border] = ['', '', ''];
  const p = platform.toLowerCase();
  
  if (p === 'leetcode') {
    color = 'text-orange-700 dark:text-orange-400';
    bg = 'bg-orange-50 dark:bg-orange-500/10';
    border = 'border-orange-200 dark:border-orange-500/20';
  } else if (p === 'geeksforgeeks' || p === 'gfg') {
    color = 'text-green-700 dark:text-green-400';
    bg = 'bg-green-50 dark:bg-green-500/10';
    border = 'border-green-200 dark:border-green-500/20';
  } else if (p === 'codeforces') {
    color = 'text-brand-700 dark:text-brand-400';
    bg = 'bg-brand-50 dark:bg-brand-500/10';
    border = 'border-brand-200 dark:border-brand-500/20';
  } else if (p === 'codechef') {
    color = 'text-amber-800 dark:text-amber-500';
    bg = 'bg-amber-50 dark:bg-amber-500/10';
    border = 'border-amber-200 dark:border-amber-500/20';
  } else if (p === 'coding ninja') {
    color = 'text-red-700 dark:text-red-400';
    bg = 'bg-red-50 dark:bg-red-500/10';
    border = 'border-red-200 dark:border-red-500/20';
  } else if (p === 'cses sheet') {
    color = 'text-cyan-700 dark:text-cyan-400';
    bg = 'bg-cyan-50 dark:bg-cyan-500/10';
    border = 'border-cyan-200 dark:border-cyan-500/20';
  } else {
    color = 'text-slate-700 dark:text-slate-300';
    bg = 'bg-slate-100 dark:bg-slate-800';
    border = 'border-slate-200 dark:border-slate-700';
  }

  return (
    <span className={`badge ${bg} ${color} border ${border} text-[10px]`}>
      {platform}
    </span>
  );
}

export function TopicBadge({ topic }) {
  return (
    <span className="badge bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300
                     border border-slate-200 dark:border-white/[0.08] text-[10px]">
      {topic}
    </span>
  );
}

export function PatternBadge({ pattern }) {
  return (
    <span className="badge bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400
                     border border-indigo-200 dark:border-indigo-500/20 text-[10px]">
      {pattern}
    </span>
  );
}

export function StatusBadge({ status }) {
  let [color, bg, border] = ['', '', ''];
  if (status === 'Solved' || status === 'Revised') {
    color = 'text-emerald-700 dark:text-emerald-400';
    bg = 'bg-emerald-50 dark:bg-emerald-500/10';
    border = 'border-emerald-200 dark:border-emerald-500/20';
  } else if (status === 'Attempted' || status === 'Needs Revision') {
    color = 'text-amber-700 dark:text-amber-400';
    bg = 'bg-amber-50 dark:bg-amber-500/10';
    border = 'border-amber-200 dark:border-amber-500/20';
  } else {
    color = 'text-slate-700 dark:text-slate-300';
    bg = 'bg-slate-100 dark:bg-slate-800';
    border = 'border-slate-200 dark:border-slate-700';
  }

  return (
    <span className={`badge ${bg} ${color} border ${border} text-[10px]`}>
      {status}
    </span>
  );
}

export function PatternChip({ label, pattern }) {
  return <PatternBadge pattern={label || pattern} />;
}
