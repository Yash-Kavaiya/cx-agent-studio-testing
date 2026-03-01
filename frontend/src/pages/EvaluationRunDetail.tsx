import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    ArrowLeft, CheckCircle, XCircle, AlertCircle, Download,
    ChevronDown, ChevronUp, Brain, Loader2, BarChart3
} from 'lucide-react'
import { evaluationsApi } from '../services/api'
import LatencyCharts from '../components/LatencyCharts'

export default function EvaluationRunDetail() {
    const { runId } = useParams<{ runId: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [expandedResult, setExpandedResult] = useState<string | null>(null)
    const [analysisQuestion, setAnalysisQuestion] = useState('')

    const { data: run, isLoading: runLoading } = useQuery({
        queryKey: ['evaluation-run', runId],
        queryFn: () => evaluationsApi.getRun(runId!),
        enabled: !!runId,
    })

    const { data: results, isLoading: resultsLoading } = useQuery({
        queryKey: ['evaluation-run-results', runId],
        queryFn: () => evaluationsApi.getRunResults(runId!),
        enabled: !!runId,
    })

    const analyzeMutation = useMutation({
        mutationFn: (question?: string) => evaluationsApi.analyze(runId!, question),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['evaluation-run', runId] })
        },
    })

    const handleDownloadCSV = () => {
        window.open(`/api/export/runs/${runId}/csv`, '_blank')
    }

    if (runLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
        )
    }

    if (!run) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Evaluation run not found</p>
                <button onClick={() => navigate('/evaluations')} className="btn btn-primary mt-4">
                    Back to Evaluations
                </button>
            </div>
        )
    }

    const passRate = run.total_count > 0 ? ((run.passed_count / run.total_count) * 100).toFixed(1) : '0'
    const duration = run.started_at && run.completed_at
        ? Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)
        : null

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/evaluations')} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Evaluation Run Details</h1>
                        <p className="text-gray-500 text-sm">
                            {new Date(run.created_at).toLocaleString()} •{' '}
                            <span className="capitalize">{run.state}</span>
                            {duration && ` • ${duration}s`}
                        </p>
                    </div>
                </div>
                <button onClick={handleDownloadCSV} className="btn btn-secondary text-sm flex items-center">
                    <Download className="h-4 w-4 mr-1" /> Download CSV
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="card text-center">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-3xl font-bold text-gray-900">{run.total_count}</p>
                </div>
                <div className="card text-center">
                    <p className="text-sm text-gray-500">Passed</p>
                    <p className="text-3xl font-bold text-green-600">{run.passed_count}</p>
                </div>
                <div className="card text-center">
                    <p className="text-sm text-gray-500">Failed</p>
                    <p className="text-3xl font-bold text-red-600">{run.failed_count}</p>
                </div>
                <div className="card text-center">
                    <p className="text-sm text-gray-500">Errors</p>
                    <p className="text-3xl font-bold text-orange-600">{run.error_count}</p>
                </div>
                <div className="card text-center">
                    <p className="text-sm text-gray-500">Pass Rate</p>
                    <p className={`text-3xl font-bold ${Number(passRate) >= 80 ? 'text-green-600' :
                            Number(passRate) >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>{passRate}%</p>
                </div>
            </div>

            {/* AI Analysis */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Brain className="h-5 w-5 mr-2 text-purple-600" />
                    AI Analysis
                </h3>
                {run.ai_analysis ? (
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 text-sm text-purple-900 whitespace-pre-wrap">
                        {run.ai_analysis}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-500">
                            Use Gemini to analyze failures, identify patterns, and get fix recommendations.
                        </p>
                        <div className="flex gap-2">
                            <input
                                value={analysisQuestion}
                                onChange={(e) => setAnalysisQuestion(e.target.value)}
                                placeholder="Ask a specific question (optional)..."
                                className="input flex-1 text-sm"
                            />
                            <button
                                onClick={() => analyzeMutation.mutate(analysisQuestion || undefined)}
                                disabled={analyzeMutation.isPending}
                                className="btn btn-primary text-sm flex items-center"
                            >
                                {analyzeMutation.isPending ? (
                                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Analyzing…</>
                                ) : (
                                    <><Brain className="h-4 w-4 mr-1" /> Analyze</>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Latency Report */}
            {run.latency_report && (
                <div className="card">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                        Latency Report
                    </h3>
                    <LatencyCharts latencyReport={run.latency_report} />
                </div>
            )}

            {/* Per-Evaluation Results */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4">Per-Evaluation Results</h3>
                {resultsLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <div className="space-y-2">
                        {results?.map((result: any) => (
                            <div key={result.id} className="border rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setExpandedResult(expandedResult === result.id ? null : result.id)}
                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                                >
                                    <div className="flex items-center gap-3">
                                        {result.passed === true ? (
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                        ) : result.passed === false ? (
                                            <XCircle className="h-5 w-5 text-red-500" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                                        )}
                                        <span className="font-medium text-sm">{result.test_case_name || 'Unnamed'}</span>
                                        {result.score != null && (
                                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">Score: {result.score}</span>
                                        )}
                                    </div>
                                    {expandedResult === result.id ? (
                                        <ChevronUp className="h-4 w-4 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 text-gray-400" />
                                    )}
                                </button>
                                {expandedResult === result.id && (
                                    <div className="px-4 py-3 bg-gray-50 border-t space-y-3">
                                        {result.failure_reason && (
                                            <div>
                                                <p className="text-xs font-medium text-red-600 mb-1">Failure Reason</p>
                                                <p className="text-sm text-red-800 bg-red-50 p-2 rounded">{result.failure_reason}</p>
                                            </div>
                                        )}
                                        {result.diagnostics && (
                                            <div>
                                                <p className="text-xs font-medium text-gray-600 mb-1">Diagnostics</p>
                                                <pre className="text-xs bg-gray-900 text-green-400 p-2 rounded overflow-x-auto max-h-40 overflow-y-auto">
                                                    {JSON.stringify(result.diagnostics, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                        {result.conversation_log && (
                                            <div>
                                                <p className="text-xs font-medium text-gray-600 mb-1">Conversation Log</p>
                                                <pre className="text-xs bg-gray-900 text-blue-400 p-2 rounded overflow-x-auto max-h-40 overflow-y-auto">
                                                    {JSON.stringify(result.conversation_log, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        {(!results || results.length === 0) && (
                            <p className="text-center text-gray-500 py-8">No individual results available</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
