export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between pb-6">
        <div>
          <div className="h-7 w-32 bg-gray-200 rounded"></div>
          <div className="h-4 w-56 bg-gray-100 rounded mt-2"></div>
        </div>
        <div className="h-9 w-32 bg-blue-100 rounded-lg"></div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-gray-100"></div>
              <div>
                <div className="h-3 w-20 bg-gray-100 rounded"></div>
                <div className="h-6 w-24 bg-gray-200 rounded mt-2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6">
          <div className="h-5 w-36 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-50 rounded-lg"></div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="h-5 w-24 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-50 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}
