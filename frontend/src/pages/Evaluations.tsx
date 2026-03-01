import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Play, CheckCircle, XCircle, Clock, BarChart3 } from 'lucide-react'
import { evaluationsApi } from '../services/api'
import EvaluationProgress from '../components/EvaluationProgress'

export default function Evaluations() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [showRunModal, setShowRunModal] = useState(false)
  const [runConfig, setRunConfig] = useState({
    run_count: 1,
    generate_latency_report: true,
    app_version: '',
  })

  const { data: runs } = useQuery({
    queryKey: ['evaluation-runs'],
    queryFn: () => evaluationsApi.listRuns(),
  })

  const runMutation = useMutation({
    mutationFn: () => evaluationsApi.run('default', {
      ...runConfig,
      app_version: runConfig.app_version || undefined,
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['evaluation-runs'] })
      setActiveRunId(data.id)
      setShowRunModal(false)
    },
  })

  const getStatusIcon = (state: string) => {
    switch (state) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'running':
        return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evaluations</h1>
          <p className="text-gray-500">Run and monitor test evaluations against CES agents</p>
        </div>
        <button
          onClick={() => setShowRunModal(true)}
          disabled={runMutation.isPending}
          className="btn btn-primary"
        >
          <Play className="h-4 w-4 mr-2" />
          Run Evaluation
        </button>
      </div>

      {/* Active Run Progress */}
      {activeRunId && (
        <EvaluationProgress runId={activeRunId} onDismiss={() => setActiveRunId(null)} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Passed</p>
              <p className="text-2xl font-semibold">
                {runs?.reduce((acc: number, r: any) => acc + r.passed_count, 0) || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-red-50 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Failed</p>
              <p className="text-2xl font-semibold">
                {runs?.reduce((acc: number, r: any) => acc + r.failed_count, 0) || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Pass Rate</p>
              <p className="text-2xl font-semibold">
                {runs?.length
                  ? (runs.reduce((acc: number, r: any) => acc + (r.pass_rate || 0), 0) / runs.length).toFixed(1)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Evaluation History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Total</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Passed</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Failed</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Pass Rate</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Duration</th>
              </tr>
            </thead>
            <tbody>
              {runs?.map((run: any) => (
                <tr
                  key={run.id}
                  className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/evaluations/${run.id}`)}
                >
                  <td className="py-3 px-4">{new Date(run.created_at).toLocaleString()}</td>
                  <td className="py-3 px-4 capitalize">{run.evaluation_type || 'N/A'}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      {getStatusIcon(run.state)}
                      <span className="ml-2 capitalize">{run.state}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">{run.total_count}</td>
                  <td className="py-3 px-4 text-green-600">{run.passed_count}</td>
                  <td className="py-3 px-4 text-red-600">{run.failed_count}</td>
                  <td className="py-3 px-4">
                    <span className={`font-medium ${(run.pass_rate || 0) >= 80 ? 'text-green-600' :
                        (run.pass_rate || 0) >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                      {run.pass_rate?.toFixed(1) || 0}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {run.started_at && run.completed_at
                      ? `${Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s`
                      : '-'}
                  </td>
                </tr>
              ))}
              {(!runs || runs.length === 0) && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    No evaluation runs yet. Approve some test cases and run an evaluation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Run Config Modal */}
      {showRunModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Run Evaluation</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Run Count</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={runConfig.run_count}
                  onChange={(e) => setRunConfig({ ...runConfig, run_count: parseInt(e.target.value) })}
                  className="input"
                />
                <p className="text-xs text-gray-400 mt-1">Number of times to run each evaluation (1 for goldens, 5+ for scenarios)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">App Version (optional)</label>
                <input
                  type="text"
                  value={runConfig.app_version}
                  onChange={(e) => setRunConfig({ ...runConfig, app_version: e.target.value })}
                  placeholder="Leave empty for latest"
                  className="input"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={runConfig.generate_latency_report}
                  onChange={(e) => setRunConfig({ ...runConfig, generate_latency_report: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600"
                />
                <span className="text-sm text-gray-700">Generate latency report (p50/p90/p99)</span>
              </label>
              <div className="flex justify-end space-x-3 pt-4">
                <button onClick={() => setShowRunModal(false)} className="btn btn-secondary">Cancel</button>
                <button
                  onClick={() => runMutation.mutate()}
                  disabled={runMutation.isPending}
                  className="btn btn-primary"
                >
                  {runMutation.isPending ? 'Starting…' : 'Start Run'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
