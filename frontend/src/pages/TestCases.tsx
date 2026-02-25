import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Upload, FileText, CheckCircle, XCircle, RefreshCw, Eye } from 'lucide-react'
import { api } from '../services/api'

export default function TestCases() {
  const queryClient = useQueryClient()
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const { data: testCases, isLoading } = useQuery({
    queryKey: ['test-cases'],
    queryFn: () => api.get('/test-cases').then(res => res.data),
  })

  const generateMutation = useMutation({
    mutationFn: (data: { description: string; test_suite_id: string }) =>
      api.post('/test-cases/generate', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-cases'] })
      setShowGenerateModal(false)
      setDescription('')
    },
  })

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) =>
      api.post('/test-cases/from-docx', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-cases'] })
      setSelectedFile(null)
    },
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, action, feedback }: { id: string; action: string; feedback?: string }) =>
      api.post(`/test-cases/${id}/approve`, { action, feedback }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-cases'] })
    },
  })

  const handleGenerate = () => {
    if (!description) return
    generateMutation.mutate({ description, test_suite_id: 'default' })
  }

  const handleUpload = () => {
    if (!selectedFile) return
    const formData = new FormData()
    formData.append('file', selectedFile)
    uploadMutation.mutate(formData)
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      draft: 'badge-info',
      pending_review: 'badge-warning',
      approved: 'badge-success',
      retry: 'badge-warning',
      denied: 'badge-error',
      submitted: 'badge-success',
      error: 'badge-error',
    }
    return badges[status] || 'badge-info'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Cases</h1>
          <p className="text-gray-500">Generate and manage AI-powered test cases</p>
        </div>
        <div className="flex space-x-3">
          <label className="btn btn-secondary cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            Upload .docx
            <input
              type="file"
              accept=".docx"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
          </label>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate Test Case
          </button>
        </div>
      </div>

      {selectedFile && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              <span>{selectedFile.name}</span>
            </div>
            <button
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
              className="btn btn-primary"
            >
              {uploadMutation.isPending ? 'Processing...' : 'Generate from Document'}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Version</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Created</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {testCases?.map((tc: any) => (
                <tr key={tc.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium">{tc.name}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {tc.description}
                    </div>
                  </td>
                  <td className="py-3 px-4 capitalize">{tc.type}</td>
                  <td className="py-3 px-4">
                    <span className={`badge ${getStatusBadge(tc.status)}`}>
                      {tc.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">v{tc.current_version}</td>
                  <td className="py-3 px-4">
                    {new Date(tc.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      {tc.status === 'draft' && (
                        <>
                          <button
                            onClick={() => approveMutation.mutate({ id: tc.id, action: 'approve' })}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => approveMutation.mutate({ id: tc.id, action: 'retry', feedback: 'Please improve' })}
                            className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                            title="Retry"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => approveMutation.mutate({ id: tc.id, action: 'deny' })}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Deny"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <button className="p-1 text-gray-600 hover:bg-gray-50 rounded" title="View">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!testCases || testCases.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No test cases yet. Generate your first test case to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Generate Test Case</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your test requirement
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Test the agent's ability to handle customer refund requests for orders within 30 days..."
                  className="input h-40"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!description || generateMutation.isPending}
                  className="btn btn-primary"
                >
                  {generateMutation.isPending ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
