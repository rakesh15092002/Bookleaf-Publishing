export default function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  bgColor,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-200">
      
      {/* Icon */}
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bgColor}`}
      >
        {Icon && <Icon size={22} className={iconColor} />}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] sm:text-xs text-slate-500 font-medium uppercase tracking-wide truncate">
          {label}
        </p>

        <p className="text-lg sm:text-2xl font-bold text-slate-700 mt-1 truncate">
          {value}
        </p>
      </div>
    </div>
  )
}