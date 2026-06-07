import { AlertCircle, ArrowUp, Minus, ArrowDown } from 'lucide-react'

export default function PriorityBadge({ priority }) {
  const config = {
    critical: { style: 'bg-red-100 text-red-700', label: 'Critical', icon: AlertCircle },
    high:     { style: 'bg-amber-100 text-amber-700', label: 'High', icon: ArrowUp },
    medium:   { style: 'bg-blue-100 text-blue-700', label: 'Medium', icon: Minus },
    low:      { style: 'bg-gray-100 text-gray-600', label: 'Low', icon: ArrowDown },
  }

  const c = config[priority] || { style: 'bg-gray-100 text-gray-600', label: priority, icon: Minus }
  const Icon = c.icon

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${c.style}`}>
      <Icon size={11} />
      {c.label}
    </span>
  )
}