function SkeletonBox({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-20 dark:bg-gray-10 rounded ${className}`} />;
}

export function WidgetSkeleton() {
  return (
    <div className="w-[340px] h-[400px] flex flex-col justify-between rounded-xl bg-surface dark:bg-gray-1 shadow-lg overflow-hidden">
      {/* Top Section (Header + Body) */}
      <div className="p-4 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <SkeletonBox className="w-10 h-10 rounded-full" />
            <div className="space-y-1">
              <SkeletonBox className="w-32 h-4" />
              <SkeletonBox className="w-24 h-3" />
            </div>
          </div>
          <div className="flex items-center space-x-2 pt-1 mr-2">
            <SkeletonBox className="w-5 h-5 rounded" />
            <SkeletonBox className="w-5 h-5 rounded" />
            <SkeletonBox className="w-5 h-5 rounded" />
          </div>
        </div>

        {/* Sync Status Center */}
        <div className="flex flex-col items-center justify-center text-center space-y-3 flex-grow">
          <SkeletonBox className="w-20 h-20 rounded-xl" />
          <SkeletonBox className="w-40 h-5" />
          <SkeletonBox className="w-48 h-4" />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t flex flex-row items-center space-x-2 border-gray-10 dark:border-gray-5 mb-3 px-4 py-3 bg-surface dark:bg-gray-1">
        <SkeletonBox className="w-6 h-6 rounded-full" />
        <SkeletonBox className="w-16 h-4 rounded-md" />
      </div>
    </div>
  );
}
