// frontend/src/components/SecurityProgress.tsx
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react'

interface SecurityProgressProps {
  state: string
  totalPrompts: number
  completedPrompts: number
  attackSuccessCount: number
  attackSuccessRate: number | null
}

export default function SecurityProgress({
  state,
  totalPrompts,
  completedPrompts,
  attackSuccessCount,
  attackSuccessRate,
}: SecurityProgressProps) {
  const progress = totalPrompts > 0 ? (completedPrompts / totalPrompts) * 100 : 0
  const isRunning = state === 'running'
  const isCompleted = state === 'completed'

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium">
            {isRunning ? 'Testing in progress...' : isCompleted ? 'Test completed' : `Status: ${state}`}
          </span>
          <span className="text-gray-500">
            {completedPrompts} / {totalPrompts} prompts
          </span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isCompleted ? 'bg-green-500' : 'bg-primary-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center text-gray-600 text-sm mb-1">
            <Shield className="h-4 w-4 mr-1" />
            Tested
          </div>
          <p className="text-xl font-bold">{completedPrompts}</p>
        </div>

        <div className="p-3 bg-red-50 rounded-lg">
          <div className="flex items-center text-red-600 text-sm mb-1">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Bypassed
          </div>
          <p className="text-xl font-bold text-red-700">{attackSuccessCount}</p>
        </div>

        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center text-blue-600 text-sm mb-1">
            <CheckCircle className="h-4 w-4 mr-1" />
            ASR
          </div>
          <p className="text-xl font-bold text-blue-700">
            {attackSuccessRate !== null ? `${attackSuccessRate.toFixed(1)}%` : '-'}
          </p>
        </div>
      </div>
    </div>
  )
}
