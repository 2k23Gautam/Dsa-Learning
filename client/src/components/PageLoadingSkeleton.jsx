import Skeleton from './Skeleton.jsx';

export default function PageLoadingSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading your dashboard">
      <div className="rounded-3xl border border-slate-200/50 dark:border-white/[0.06] bg-white/70 dark:bg-[#090e1a]/70 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-8 w-full max-w-md rounded-xl" />
            <Skeleton className="h-4 w-full max-w-xl rounded-lg" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-16 w-28 rounded-2xl" />
            <Skeleton className="h-16 w-28 rounded-2xl" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="gradient-glass p-5 space-y-3">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0, 1].map((item) => (
          <div key={item} className="gradient-glass p-6 h-[320px]">
            <div className="flex items-center justify-between mb-8">
              <Skeleton className="h-5 w-36 rounded-lg" />
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
            <div className="space-y-5">
              {[72, 92, 64, 84].map((width, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-8 rounded-xl" style={{ width: `${width}%` }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
