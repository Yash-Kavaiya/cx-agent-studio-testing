import { useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Upload, FileText, CheckCircle, XCircle, RefreshCw, Eye,
  Sparkles, FolderOpen, Loader2
} from 'lucide-react'
import { testCasesApi } from '../services/api'
import TestCaseDrawer from '../components/TestCaseDrawer'

type TestType = 'auto' | 'golden' | 'scenario'

export default function TestCases() {
  const queryClient = useQueryClient()
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [description, setDescription] = useState('')
  const [testType, setTestType] = useState<TestType>('auto')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [drawerTestCaseId, setDrawerTestCaseId] = useState<string | null>(null)
  const [retryModal, setRetryModal] = useState<{ id: string } | null>(null)
  const [retryFeedback, setRetryFeedback] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: testCases } = useQuery({
    queryKey: ['test-cases'],
    queryFn: () => testCasesApi.list(),
  })

  const generateMutation = useMutation({
    mutationFn: (data: { description: string; type_hint?: string }) =>
      testCasesApi.generate('default', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-cases'] })
      setShowGenerateModal(false)
      setDescription('')
      setTestType('auto')
    },
  })

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => testCasesApi.uploadDocx('default', formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-cases'] })
      setSelectedFile(null)
    },
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, action, feedback }: { id: string; action: string; feedback?: string }) =>
      testCasesApi.approve(id, { action, feedback }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-cases'] })
      setRetryModal(null)
      setRetryFeedback('')
    },
  })

  const handleGenerate = () => {
    if (!description) return
    generateMutation.mutate({
      description,
      type_hint: testType !== 'auto' ? testType : undefined,
    })
  }

  const handleUpload = () => {
    if (!selectedFile) return
    const formData = new FormData()
    formData.append('file', selectedFile)
    uploadMutation.mutate(formData)
  }

  // Drag-and-drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])
  const handleDragLeave = useCallback(() => setIsDragOver(false), [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && (file.name.endsWith('.docx') || file.name.endsWith('.doc'))) {
      setSelectedFile(file)
    }
  }, [])

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

  const testTypes: { value: TestType; label: string; desc: string; icon: any }[] = [
    { value: 'auto', label: 'Auto-detect', desc: 'AI chooses the best type', icon: Sparkles },
    { value: 'golden', label: 'Golden', desc: 'Exact expected output', icon: CheckCircle },
    { value: 'scenario', label: 'Scenario', desc: 'Rubric-based evaluation', icon: FileText },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Cases</h1>
          <p className="text-gray-500">Generate and manage AI-powered test cases</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload .docx
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.doc"
            className="hidden"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          />
          <button
            onClick={() => setShowGenerateModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate Test Case
          </button>
        </div>
      </div>

      {/* Drag-and-Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${isDragOver
            ? 'border-primary-400 bg-primary-50'
            : selectedFile
              ? 'border-green-300 bg-green-50'
              : 'border-gray-200 bg-gray-50 hover:border-gray-300'
          }`}
        onClick={() => fileInputRef.current?.click()}
      >
        {selectedFile ? (
          <div className="flex items-center justify-center gap-4">
            <FileText className="h-8 w-8 text-green-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024).toFixed(1)} KB — Ready to process
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleUpload() }}
              disabled={uploadMutation.isPending}
              className="btn btn-primary text-sm"
            >
              {uploadMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Processing…</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-1" /> Generate from Document</>
              )}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div>
            <FolderOpen className={`h-8 w-8 mx-auto mb-2 ${isDragOver ? 'text-primary-500' : 'text-gray-400'}`} />
            <p className="text-sm text-gray-600">
              <span className="font-medium text-primary-600">Click to browse</span> or drag and drop a .docx file
            </p>
            <p className="text-xs text-gray-400 mt-1">
              AI will extract requirements and generate structured test cases
            </p>
          </div>
        )}
      </div>

      {/* Test Cases Table */}
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
                <tr
                  key={tc.id}
                  className="border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => setDrawerTestCaseId(tc.id)}
                >
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
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
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
                            onClick={() => { setRetryModal({ id: tc.id }); setRetryFeedback('') }}
                            className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                            title="Retry with feedback"
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
                      <button
                        onClick={() => setDrawerTestCaseId(tc.id)}
                        className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                        title="View details"
                      >
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

      {/* Test Case Detail Drawer */}
      <TestCaseDrawer testCaseId={drawerTestCaseId} onClose={() => setDrawerTestCaseId(null)} />

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-primary-600" />
              Generate Test Case
            </h2>
            <div className="space-y-5">
              {/* Test Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Test Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {testTypes.map((tt) => (
                    <button
                      key={tt.value}
                      type="button"
                      onClick={() => setTestType(tt.value)}
                      className={`p-3 rounded-lg border text-left transition-all ${testType === tt.value
                          ? 'border-primary-400 bg-primary-50 ring-1 ring-primary-400'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <tt.icon className={`h-4 w-4 mb-1 ${testType === tt.value ? 'text-primary-600' : 'text-gray-400'
                        }`} />
                      <p className="text-sm font-medium">{tt.label}</p>
                      <p className="text-xs text-gray-500">{tt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description / Requirements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your test requirement
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={`e.g., Test the agent's ability to handle customer refund requests for orders within 30 days...\n\nTip: Describe one scenario per line for batch generation.`}
                  className="input h-40"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Gemini will analyze your description and generate structured CES evaluation cases
                </p>
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
                  {generateMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating…</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-1" /> Generate</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Retry Feedback Modal */}
      {retryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-2">Retry with Feedback</h2>
            <p className="text-sm text-gray-500 mb-4">
              Provide feedback so Gemini can regenerate a better test case.
            </p>
            <textarea
              value={retryFeedback}
              onChange={(e) => setRetryFeedback(e.target.value)}
              placeholder="e.g., Add more edge cases for payment failures, make rubric stricter for tone checking..."
              className="input h-32 mb-4"
            />
            <div className="flex justify-end space-x-3">
              <button onClick={() => setRetryModal(null)} className="btn btn-secondary">Cancel</button>
              <button
                onClick={() => approveMutation.mutate({ id: retryModal.id, action: 'retry', feedback: retryFeedback })}
                disabled={!retryFeedback || approveMutation.isPending}
                className="btn btn-primary"
              >
                {approveMutation.isPending ? 'Regenerating…' : 'Submit & Regenerate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
