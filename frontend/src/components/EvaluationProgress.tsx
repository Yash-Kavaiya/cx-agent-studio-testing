import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react'
import { evaluationsApi } from '../services/api'

interface EvaluationProgressProps {
    runId: string
    onDismiss: () => void
}

export default function EvaluationProgress({ runId, onDismiss }: EvaluationProgressProps) {
    const navigate = useNavigate()
    const [elapsed, setElapsed] = useState(0)

    const { data: run } = useQuery({
        queryKey: ['evaluation-run-poll', runId],
        queryFn: () => evaluationsApi.getRun(runId),
        refetchInterval: (query) => {
            const state = query.state.data?.state
            if (state === 'completed' || state === 'error' || state === 'cancelled') return false
            return 3000
        },
        enabled: !!runId,
    })

    useEffect(() => {
        const timer = setInterval(() => setElapsed(e => e + 1), 1000)
        return () => clearInterval(timer)
    }, [])

    const isFinished = run?.state === 'completed' || run?.state === 'error' || run?.state === 'cancelled'
    const progress = run?.total_count > 0
        ? Math.round(((run.passed_count + run.failed_count + run.error_count) / run.total_count) * 100)
        : 0

    const stateConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
        pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', label: 'Queued' },
        running: { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'Running' },
        completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 border-green-200', label: 'Completed' },
        error: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'Error' },
        cancelled: { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', label: 'Cancelled' },
    }

    const config = stateConfig[run?.state || 'pending'] || stateConfig.pending
    const StateIcon = config.icon

    return (
        <div className={`p-4 rounded-lg border-2 ${config.bg} mb-6`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <StateIcon className={`h-6 w-6 ${config.color} ${run?.state === 'running' ? 'animate-spin' : ''}`} />
                    <div>
                        <p className="font-semibold text-gray-900">Evaluation Run — {config.label}</p>
                        <p className="text-sm text-gray-500">
                            Elapsed: {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}
                            {run && ` • ${run.passed_count + run.failed_count}/${run.total_count} evaluated`}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isFinished && (
                        <button
                            onClick={() => navigate(`/evaluations/${runId}`)}
                            className="btn btn-primary text-sm flex items-center"
                        >
                            View Results <ArrowRight className="h-4 w-4 ml-1" />
                        </button>
                    )}
                    <button onClick={onDismiss} className="btn btn-secondary text-sm">
                        {isFinished ? 'Dismiss' : 'Background'}
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            {run?.state === 'running' && (
                <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(progress, 5)}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>{progress}% complete</span>
                        <span className="flex gap-3">
                            <span className="text-green-600">✓ {run.passed_count}</span>
                            <span className="text-red-600">✗ {run.failed_count}</span>
                        </span>
                    </div>
                </div>
            )}

            {/* Completion Summary */}
            {run?.state === 'completed' && (
                <div className="mt-3 grid grid-cols-4 gap-3">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{run.total_count}</p>
                        <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{run.passed_count}</p>
                        <p className="text-xs text-gray-500">Passed</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{run.failed_count}</p>
                        <p className="text-xs text-gray-500">Failed</p>
                    </div>
                    <div className="text-center">
                        <p className={`text-2xl font-bold ${(run.passed_count / run.total_count * 100) >= 80 ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {(run.passed_count / run.total_count * 100).toFixed(0)}%
                        </p>
                        <p className="text-xs text-gray-500">Pass Rate</p>
                    </div>
                </div>
            )}
        </div>
    )
}
