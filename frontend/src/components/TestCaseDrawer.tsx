import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, CheckCircle, RefreshCw, XCircle, Send, Clock, ChevronDown, ChevronUp, GitCompare } from 'lucide-react'
import { testCasesApi } from '../services/api'
import TestCaseDiff from './TestCaseDiff'

interface TestCaseDrawerProps {
    testCaseId: string | null
    onClose: () => void
}

export default function TestCaseDrawer({ testCaseId, onClose }: TestCaseDrawerProps) {
    const queryClient = useQueryClient()
    const [showFeedback, setShowFeedback] = useState(false)
    const [feedback, setFeedback] = useState('')
    const [jsonExpanded, setJsonExpanded] = useState(true)
    const [versionsExpanded, setVersionsExpanded] = useState(false)
    const [diffPair, setDiffPair] = useState<{ old: any; new: any; oldV: number; newV: number } | null>(null)

    const { data: testCase, isLoading } = useQuery({
        queryKey: ['test-case', testCaseId],
        queryFn: () => testCasesApi.get(testCaseId!),
        enabled: !!testCaseId,
    })

    const { data: versions } = useQuery({
        queryKey: ['test-case-versions', testCaseId],
        queryFn: () => testCasesApi.getVersions(testCaseId!),
        enabled: !!testCaseId && versionsExpanded,
    })

    const approveMutation = useMutation({
        mutationFn: (data: { action: string; feedback?: string }) =>
            testCasesApi.approve(testCaseId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['test-cases'] })
            queryClient.invalidateQueries({ queryKey: ['test-case', testCaseId] })
            setShowFeedback(false)
            setFeedback('')
        },
    })

    const submitMutation = useMutation({
        mutationFn: () => testCasesApi.submit(testCaseId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['test-cases'] })
            queryClient.invalidateQueries({ queryKey: ['test-case', testCaseId] })
        },
    })

    if (!testCaseId) return null

    const statusColors: Record<string, string> = {
        draft: 'bg-blue-100 text-blue-700',
        pending_review: 'bg-yellow-100 text-yellow-700',
        approved: 'bg-green-100 text-green-700',
        retry: 'bg-orange-100 text-orange-700',
        denied: 'bg-red-100 text-red-700',
        submitted: 'bg-emerald-100 text-emerald-700',
        error: 'bg-red-100 text-red-700',
    }

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={onClose} />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900">Test Case Details</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                    {isLoading ? (
                        <div className="space-y-4">
                            <div className="animate-pulse h-6 bg-gray-200 rounded w-3/4" />
                            <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2" />
                            <div className="animate-pulse h-32 bg-gray-200 rounded" />
                        </div>
                    ) : testCase ? (
                        <>
                            {/* Basic Info */}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{testCase.name}</h3>
                                <p className="text-gray-500 mt-1">{testCase.description}</p>
                                <div className="flex items-center gap-3 mt-3">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[testCase.status] || ''}`}>
                                        {testCase.status?.replace('_', ' ')}
                                    </span>
                                    <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full capitalize">
                                        {testCase.type}
                                    </span>
                                    <span className="text-xs text-gray-500">v{testCase.current_version}</span>
                                    <span className="text-xs text-gray-400">
                                        Source: {testCase.source_type}
                                    </span>
                                </div>
                            </div>

                            {/* Approval Actions */}
                            {(testCase.status === 'draft' || testCase.status === 'pending_review') && (
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <h4 className="font-medium text-blue-800 mb-3">Review Actions</h4>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => approveMutation.mutate({ action: 'approve' })}
                                            disabled={approveMutation.isPending}
                                            className="btn btn-primary text-sm flex items-center"
                                        >
                                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                                        </button>
                                        <button
                                            onClick={() => setShowFeedback(true)}
                                            className="btn btn-secondary text-sm flex items-center"
                                        >
                                            <RefreshCw className="h-4 w-4 mr-1" /> Retry
                                        </button>
                                        <button
                                            onClick={() => approveMutation.mutate({ action: 'deny' })}
                                            disabled={approveMutation.isPending}
                                            className="btn text-sm flex items-center text-red-600 border border-red-300 hover:bg-red-50"
                                        >
                                            <XCircle className="h-4 w-4 mr-1" /> Deny
                                        </button>
                                    </div>

                                    {showFeedback && (
                                        <div className="mt-3 space-y-2">
                                            <textarea
                                                value={feedback}
                                                onChange={(e) => setFeedback(e.target.value)}
                                                placeholder="Provide feedback for regeneration (e.g., add more edge cases, make rubric stricter)..."
                                                className="input h-24 text-sm"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => approveMutation.mutate({ action: 'retry', feedback })}
                                                    disabled={!feedback || approveMutation.isPending}
                                                    className="btn btn-primary text-sm"
                                                >
                                                    {approveMutation.isPending ? 'Regenerating…' : 'Submit & Regenerate'}
                                                </button>
                                                <button onClick={() => setShowFeedback(false)} className="btn btn-secondary text-sm">
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Submit to CES */}
                            {testCase.status === 'approved' && (
                                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-green-800">Ready to Submit</h4>
                                            <p className="text-sm text-green-600">Push this test case to the CES API</p>
                                        </div>
                                        <button
                                            onClick={() => submitMutation.mutate()}
                                            disabled={submitMutation.isPending}
                                            className="btn btn-primary text-sm flex items-center"
                                        >
                                            <Send className="h-4 w-4 mr-1" />
                                            {submitMutation.isPending ? 'Submitting…' : 'Submit to CES'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Generated JSON */}
                            <div>
                                <button
                                    onClick={() => setJsonExpanded(!jsonExpanded)}
                                    className="flex items-center w-full text-left font-semibold text-gray-800"
                                >
                                    {jsonExpanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                                    Generated CES Evaluation JSON
                                </button>
                                {jsonExpanded && testCase.generated_json && (
                                    <pre className="mt-2 p-4 bg-gray-900 text-green-400 rounded-lg text-xs overflow-x-auto max-h-96 overflow-y-auto">
                                        {JSON.stringify(testCase.generated_json, null, 2)}
                                    </pre>
                                )}
                                {jsonExpanded && !testCase.generated_json && (
                                    <p className="mt-2 text-sm text-gray-400 italic">No generated JSON available</p>
                                )}
                            </div>

                            {/* Version History */}
                            <div>
                                <button
                                    onClick={() => setVersionsExpanded(!versionsExpanded)}
                                    className="flex items-center w-full text-left font-semibold text-gray-800"
                                >
                                    {versionsExpanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                                    Version History
                                </button>
                                {versionsExpanded && (
                                    <div className="mt-2 space-y-3">
                                        {versions?.map((v: any, idx: number) => (
                                            <div key={v.id} className="p-3 bg-gray-50 rounded-lg border text-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">Version {v.version_number}</span>
                                                    <div className="flex items-center gap-2">
                                                        {idx < (versions?.length || 0) - 1 && (
                                                            <button
                                                                onClick={() => {
                                                                    const prev = versions[idx + 1]
                                                                    setDiffPair(
                                                                        diffPair?.oldV === prev.version_number && diffPair?.newV === v.version_number
                                                                            ? null
                                                                            : {
                                                                                old: prev.generated_json,
                                                                                new: v.generated_json,
                                                                                oldV: prev.version_number,
                                                                                newV: v.version_number,
                                                                            }
                                                                    )
                                                                }}
                                                                className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-0.5"
                                                            >
                                                                <GitCompare className="h-3 w-3" />
                                                                Diff
                                                            </button>
                                                        )}
                                                        <span className="text-xs text-gray-400 flex items-center">
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            {new Date(v.created_at).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                {v.user_feedback && (
                                                    <p className="mt-1 text-gray-600 italic">Feedback: {v.user_feedback}</p>
                                                )}
                                                {diffPair && diffPair.newV === v.version_number && (
                                                    <div className="mt-3">
                                                        <TestCaseDiff
                                                            oldJson={diffPair.old}
                                                            newJson={diffPair.new}
                                                            oldVersion={diffPair.oldV}
                                                            newVersion={diffPair.newV}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {(!versions || versions.length === 0) && (
                                            <p className="text-sm text-gray-400 italic">No version history</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Meta Info */}
                            <div className="text-xs text-gray-400 border-t pt-4">
                                <p>Created: {new Date(testCase.created_at).toLocaleString()}</p>
                                <p>Updated: {new Date(testCase.updated_at).toLocaleString()}</p>
                                {testCase.ces_evaluation_id && <p>CES ID: {testCase.ces_evaluation_id}</p>}
                            </div>
                        </>
                    ) : (
                        <p className="text-gray-500">Test case not found</p>
                    )}
                </div>
            </div>
        </>
    )
}
