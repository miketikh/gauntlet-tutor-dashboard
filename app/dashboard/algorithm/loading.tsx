export default function Loading() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-1" />
          <div className="h-3 bg-gray-200 rounded w-1/4" />
        </div>

        {/* Performance summary skeleton */}
        <div className="border rounded-lg p-6">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-32 bg-gray-200 rounded mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
        </div>

        {/* Two-column layout skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weight panel skeleton */}
          <div className="border rounded-lg p-6">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-2 bg-gray-200 rounded w-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Learning events skeleton */}
          <div className="border rounded-lg p-6">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>

        {/* Quick actions skeleton */}
        <div className="border rounded-lg p-6">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="flex gap-3">
            <div className="h-10 bg-gray-200 rounded w-32" />
            <div className="h-10 bg-gray-200 rounded w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}
