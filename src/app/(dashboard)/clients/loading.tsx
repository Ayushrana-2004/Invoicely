export default function ClientsLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between pb-6">
        <div>
          <div className="h-7 w-24 bg-gray-200 rounded"></div>
          <div className="h-4 w-44 bg-gray-100 rounded mt-2"></div>
        </div>
        <div className="h-9 w-28 bg-blue-100 rounded-lg"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="h-10 w-10 rounded-full bg-gray-100 mb-3"></div>
            <div className="h-5 w-32 bg-gray-200 rounded"></div>
            <div className="h-3 w-44 bg-gray-100 rounded mt-3"></div>
            <div className="h-3 w-36 bg-gray-100 rounded mt-2"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
