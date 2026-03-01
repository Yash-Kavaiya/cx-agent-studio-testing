import { Activity, CheckCircle, XCircle, RefreshCw, Play, FileText, Plus } from 'lucide-react'

interface ActivityItem {
    type: 'created' | 'approved' | 'denied' | 'retried' | 'run_started' | 'run_completed' | 'run_failed' | 'project_created'
    title: string
    description?: string
    timestamp: string
}

interface ActivityFeedProps {
    items?: ActivityItem[]
}

const iconMap: Record<string, { icon: any; color: string; bg: string }> = {
    created: { icon: Plus, color: 'text-blue-600', bg: 'bg-blue-100' },
    approved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    denied: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
    retried: { icon: RefreshCw, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    run_started: { icon: Play, color: 'text-blue-600', bg: 'bg-blue-100' },
    run_completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    run_failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
    project_created: { icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100' },
}

function timeAgo(timestamp: string): string {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
}

export default function ActivityFeed({ items }: ActivityFeedProps) {
    // When backend is unavailable, show demo/placeholder items
    const displayItems: ActivityItem[] = items && items.length > 0 ? items : [
        { type: 'project_created', title: 'Platform initialized', description: 'CX Agent Studio ready', timestamp: new Date().toISOString() },
    ]

    return (
        <div className="space-y-3">
            {displayItems.map((item, i) => {
                const config = iconMap[item.type] || iconMap.created
                const Icon = config.icon
                return (
                    <div key={i} className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-full ${config.bg} flex-shrink-0 mt-0.5`}>
                            <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 leading-tight">{item.title}</p>
                            {item.description && (
                                <p className="text-xs text-gray-500 truncate">{item.description}</p>
                            )}
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                            {timeAgo(item.timestamp)}
                        </span>
                    </div>
                )
            })}
            {displayItems.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm">
                    <Activity className="h-5 w-5 mx-auto mb-1" />
                    No recent activity
                </div>
            )}
        </div>
    )
}

export type { ActivityItem }
