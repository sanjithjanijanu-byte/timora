export default function SkeletonLoader({ rows = 5, cols = 4 }) {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="flex gap-4 mb-6">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton h-4 flex-1" />
        ))}
      </div>
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 mb-3">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="skeleton h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
