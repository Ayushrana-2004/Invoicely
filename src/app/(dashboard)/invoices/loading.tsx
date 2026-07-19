export default function InvoicesLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between pb-6">
        <div>
          <div className="h-7 w-28 bg-gray-200 rounded"></div>
          <div className="h-4 w-48 bg-gray-100 rounded mt-2"></div>
        </div>
        <div className="h-9 w-32 bg-blue-100 rounded-lg"></div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="space-y-4">
          <div className="h-10 bg-gray-100 rounded"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-50 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
