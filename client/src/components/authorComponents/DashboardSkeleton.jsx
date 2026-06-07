export default function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 bg-gray-100 rounded-xl w-48 mb-2" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 h-24 shadow-sm" />
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 h-72 shadow-sm" />
    </div>
  )
}