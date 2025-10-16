function SkeletonBox({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-20 dark:bg-gray-10 ${className}`} />;
}

export function WidgetSkeleton() {
  return (
    <div className="flex h-[400px] w-[340px] flex-col justify-between overflow-hidden rounded-xl bg-surface shadow-lg dark:bg-gray-1">
      {/* Top Section (Header + Body) */}
      <div className="flex h-full flex-col p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <SkeletonBox className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <SkeletonBox className="h-4 w-32" />
              <SkeletonBox className="h-3 w-24" />
            </div>
          </div>
          <div className="mr-2 flex items-center space-x-2 pt-1">
            <SkeletonBox className="h-5 w-5 rounded" />
            <SkeletonBox className="h-5 w-5 rounded" />
            <SkeletonBox className="h-5 w-5 rounded" />
          </div>
        </div>

        {/* Sync Status Center */}
        <div className="flex flex-grow flex-col items-center justify-center space-y-3 text-center">
          <SkeletonBox className="h-20 w-20 rounded-xl" />
          <SkeletonBox className="h-5 w-40" />
          <SkeletonBox className="h-4 w-48" />
        </div>
      </div>

      {/* Footer */}
      <div className="mb-3 flex flex-row items-center space-x-2 border-t border-gray-10 bg-surface px-4 py-3 dark:border-gray-5 dark:bg-gray-1">
        <SkeletonBox className="h-6 w-6 rounded-full" />
        <SkeletonBox className="h-4 w-16 rounded-md" />
      </div>
    </div>
  );
}
