// frontend/src/pages/SecurityTesting.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Shield, Plus, Clock, CheckCircle, XCircle, AlertTriangle, Play } from 'lucide-react'
import { useActiveProject } from '../hooks/useActiveProject'
import { securityTestingApi } from '../services/api'
import SecurityTestModal from '../components/SecurityTestModal'

const STATE_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-gray-400" />,
  running: <Play className="h-4 w-4 text-blue-500 animate-pulse" />,
  completed: <CheckCircle className="h-4 w-4 text-green-500" />,
  error: <XCircle className="h-4 w-4 text-red-500" />,
  cancelled: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
}

const STATE_LABELS: Record<string, string> = {
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  error: 'Error',
  cancelled: 'Cancelled',
}

export default function SecurityTesting() {
  const navigate = useNavigate()
  const { activeProject } = useActiveProject()
  const [showModal, setShowModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['security-runs', activeProject?.id],
    queryFn: () => securityTestingApi.listRuns(activeProject!.id),
    enabled: !!activeProject,
    refetchInterval: (query) => {
      // Poll every 2s if any run is in progress
      const runs = query.state.data?.runs
      const hasRunning = runs?.some((r: any) => r.state === 'running' || r.state === 'pending')
      return hasRunning ? 2000 : false
    },
  })

  const runs = data?.runs || []

  if (!activeProject) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-700">No Project Selected</h2>
        <p className="text-gray-500 mt-1">
          Select a project in <a href="/settings" className="text-primary-600 hover:underline">Settings</a> to run security tests.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="h-6 w-6 mr-2" />
            Security Testing
          </h1>
          <p className="text-gray-500">Red-team your agent against adversarial attacks</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          New Security Test
        </button>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-700">No Security Tests Yet</h2>
          <p className="text-gray-500 mt-1 mb-4">
            Run your first security test to check for vulnerabilities
          </p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Run First Test
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run: any) => (
            <div
              key={run.id}
              onClick={() => navigate(`/security-testing/runs/${run.id}`)}
              className="card p-4 hover:border-primary-300 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    {STATE_ICONS[run.state]}
                    <span className="ml-2 font-medium">{run.name}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    run.state === 'completed' ? 'bg-green-100 text-green-700' :
                    run.state === 'running' ? 'bg-blue-100 text-blue-700' :
                    run.state === 'error' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {STATE_LABELS[run.state]}
                  </span>
                </div>
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div>
                    {run.completed_prompts} / {run.total_prompts} prompts
                  </div>
                  {run.attack_success_rate !== null && (
                    <div className={`font-medium ${
                      run.attack_success_rate > 10 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      ASR: {run.attack_success_rate.toFixed(1)}%
                    </div>
                  )}
                  <div>{new Date(run.created_at).toLocaleDateString()}</div>
                </div>
              </div>

              {run.state === 'running' && (
                <div className="mt-3">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 transition-all"
                      style={{ width: `${(run.completed_prompts / run.total_prompts) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <SecurityTestModal
          projectId={activeProject.id}
          onClose={() => setShowModal(false)}
          onSuccess={(runId) => {
            setShowModal(false)
            navigate(`/security-testing/runs/${runId}`)
          }}
        />
      )}
    </div>
  )
}
