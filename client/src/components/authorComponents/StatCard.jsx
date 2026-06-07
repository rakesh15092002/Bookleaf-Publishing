// 🟩 FIXED LOGIC: Pehli line se LucideIcon ka import poori tarah saaf kar diya hai!
export default function StatCard({ label, value, icon: Icon, iconColor, bgColor }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 transform shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${bgColor}`}>
        {/* Dynamic icon selection wrapper without TypeScript types */}
        {Icon && <Icon size={22} className={iconColor} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider truncate">{label}</p>
        <p className="text-2xl font-extrabold text-gray-800 mt-1 tracking-tight truncate">{value}</p>
      </div>
    </div>
  )
}