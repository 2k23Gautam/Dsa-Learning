export default function Skeleton({ className = '', style }) {
  return <span aria-hidden="true" style={style} className={`skeleton-shimmer block ${className}`} />;
}

export function InlineSkeleton({ className = 'h-4 w-10' }) {
  return <Skeleton className={`inline-block align-middle ${className}`} />;
}
