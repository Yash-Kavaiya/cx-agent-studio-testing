// frontend/src/pages/SecurityTestRunDetail.tsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Shield, StopCircle, Trash2, Filter, CheckCircle, AlertTriangle } from 'lucide-react'
import { securityTestingApi } from '../services/api'
import SecurityProgress from '../components/SecurityProgress'

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Results' },
  { value: 'successful_attacks', label: 'Bypassed' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'low_confidence', label: 'Low Confidence' },
]

export default function SecurityTestRunDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)

  const { data: run, isLoading: runLoading } = useQuery({
    queryKey: ['security-run', id],
    queryFn: () => securityTestingApi.getRun(id!),
    refetchInterval: (query) => {
      const data = query.state.data
      return data?.state === 'running' || data?.state === 'pending' ? 2000 : false
    },
  })

  const { data: resultsData, isLoading: resultsLoading } = useQuery({
    queryKey: ['security-results', id, filter, page],
    queryFn: () => securityTestingApi.getResults(id!, { filter, page, per_page: 20 }),
    enabled: !!run,
  })

  const cancelMutation = useMutation({
    mutationFn: () => securityTestingApi.cancelRun(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['security-run', id] }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => securityTestingApi.deleteRun(id!),
    onSuccess: () => navigate('/security-testing'),
  })

  if (runLoading) {
    return <div className="animate-pulse h-64 bg-gray-200 rounded-lg" />
  }

  if (!run) {
    return <div className="text-center py-12 text-gray-500">Run not found</div>
  }

  const results = resultsData?.results || []
  const totalResults = resultsData?.total || 0
  const totalPages = Math.ceil(totalResults / 20)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/security-testing')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              {run.name}
            </h1>
            <p className="text-sm text-gray-500">
              {run.dataset_source} | {run.dataset_category}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {(run.state === 'running' || run.state === 'pending') && (
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="btn btn-secondary text-red-600 flex items-center"
            >
              <StopCircle className="h-4 w-4 mr-2" />
              Cancel
            </button>
          )}
          <button
            onClick={() => {
              if (confirm('Delete this security test run?')) {
                deleteMutation.mutate()
              }
            }}
            className="btn btn-secondary text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="card p-6">
        <SecurityProgress
          state={run.state}
          totalPrompts={run.total_prompts}
          completedPrompts={run.completed_prompts}
          attackSuccessCount={run.attack_success_count}
          attackSuccessRate={run.attack_success_rate}
        />
      </div>

      {/* Results */}
      <div className="card">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Results</h2>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value)
                setPage(1)
              }}
              className="input py-1 text-sm"
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {resultsLoading ? (
          <div className="p-8 text-center text-gray-500">Loading results...</div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {run.state === 'pending' ? 'Test not started yet' : 'No results match the filter'}
          </div>
        ) : (
          <div className="divide-y">
            {results.map((result: any) => (
              <div key={result.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {result.is_attack_successful ? (
                        <span className="flex items-center text-red-600 text-sm font-medium">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Attack Bypassed
                        </span>
                      ) : result.confidence_score >= 0.7 ? (
                        <span className="flex items-center text-green-600 text-sm font-medium">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Blocked
                        </span>
                      ) : (
                        <span className="flex items-center text-yellow-600 text-sm font-medium">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Low Confidence
                        </span>
                      )}
                      {result.prompt_category && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          {result.prompt_category}
                        </span>
                      )}
                      {result.latency_ms && (
                        <span className="text-xs text-gray-400">
                          {result.latency_ms}ms
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Prompt:</p>
                        <p className="text-sm bg-gray-50 p-2 rounded font-mono break-all">
                          {result.prompt_text.slice(0, 300)}
                          {result.prompt_text.length > 300 && '...'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Response:</p>
                        <p className="text-sm bg-gray-50 p-2 rounded">
                          {result.agent_response?.slice(0, 300) || '[No response]'}
                          {(result.agent_response?.length || 0) > 300 && '...'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm font-medium">
                      {(result.confidence_score * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-500">confidence</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages} ({totalResults} results)
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="btn btn-secondary text-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="btn btn-secondary text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
