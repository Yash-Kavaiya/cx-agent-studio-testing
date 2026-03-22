import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Server, CheckCircle, XCircle, FolderKanban, Globe, MapPin, Cpu, Key, Eye, EyeOff, Trash2 } from 'lucide-react'
import { useActiveProject } from '../hooks/useActiveProject'
import { healthApi, settingsApi } from '../services/api'

export default function Settings() {
    const queryClient = useQueryClient()
    const { activeProject, setActiveProject, projects, isLoading: projectsLoading } = useActiveProject()

    const [showTokenInput, setShowTokenInput] = useState(false)
    const [tokenValue, setTokenValue] = useState('')
    const [showToken, setShowToken] = useState(false)
    const [tokenError, setTokenError] = useState<string | null>(null)

    const { data: health, error: healthError } = useQuery({
        queryKey: ['health'],
        queryFn: healthApi.check,
        retry: 1,
        refetchInterval: 30000,
    })

    const { data: hfStatus } = useQuery({
        queryKey: ['hf-token-status'],
        queryFn: settingsApi.getHFTokenStatus,
    })

    const updateTokenMutation = useMutation({
        mutationFn: settingsApi.updateHFToken,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hf-token-status'] })
            setShowTokenInput(false)
            setTokenValue('')
            setTokenError(null)
        },
        onError: (error: any) => {
            setTokenError(error.response?.data?.detail || 'Failed to save token')
        },
    })

    const deleteTokenMutation = useMutation({
        mutationFn: settingsApi.deleteHFToken,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hf-token-status'] })
        },
    })

    const isHealthy = !!health && !healthError

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500">Configure your platform and project connections</p>
            </div>

            {/* API Connection Status */}
            <div className="card">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <Server className="h-5 w-5 mr-2 text-gray-600" />
                    API Connection Status
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-lg border-2 ${isHealthy ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                        <div className="flex items-center">
                            {isHealthy ? (
                                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                            ) : (
                                <XCircle className="h-5 w-5 text-red-600 mr-2" />
                            )}
                            <span className="font-medium">{isHealthy ? 'Backend Connected' : 'Backend Unavailable'}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            {isHealthy ? health?.service : 'Cannot reach the API server'}
                        </p>
                    </div>
                    <div className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
                        <div className="flex items-center">
                            <Globe className="h-5 w-5 text-blue-600 mr-2" />
                            <span className="font-medium">API Endpoint</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 font-mono">/api (proxied to :8000)</p>
                    </div>
                    <div className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
                        <div className="flex items-center">
                            <Cpu className="h-5 w-5 text-purple-600 mr-2" />
                            <span className="font-medium">Frontend</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Vite + React + TypeScript</p>
                    </div>
                </div>
            </div>

            {/* HuggingFace Integration */}
            <div className="card">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <Key className="h-5 w-5 mr-2 text-gray-600" />
                    HuggingFace Integration
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    Required for Security Testing. Get your token from{' '}
                    <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer"
                       className="text-primary-600 hover:underline">
                        huggingface.co/settings/tokens
                    </a>
                </p>

                <div className={`p-4 rounded-lg border-2 ${hfStatus?.configured ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            {hfStatus?.configured ? (
                                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                            ) : (
                                <XCircle className="h-5 w-5 text-yellow-600 mr-2" />
                            )}
                            <span className="font-medium">
                                {hfStatus?.configured ? 'Token Configured' : 'Token Not Configured'}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowTokenInput(!showTokenInput)}
                                className="btn btn-secondary text-sm"
                            >
                                {hfStatus?.configured ? 'Update' : 'Add Token'}
                            </button>
                            {hfStatus?.configured && (
                                <button
                                    onClick={() => {
                                        if (confirm('Remove HuggingFace token?')) {
                                            deleteTokenMutation.mutate()
                                        }
                                    }}
                                    className="btn btn-secondary text-sm text-red-600"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                    {hfStatus?.last_updated && (
                        <p className="text-sm text-gray-500 mt-1">
                            Last updated: {new Date(hfStatus.last_updated).toLocaleString()}
                        </p>
                    )}
                </div>

                {showTokenInput && (
                    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type={showToken ? 'text' : 'password'}
                                    value={tokenValue}
                                    onChange={(e) => setTokenValue(e.target.value)}
                                    placeholder="hf_..."
                                    className="input w-full pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowToken(!showToken)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <button
                                onClick={() => updateTokenMutation.mutate(tokenValue)}
                                disabled={!tokenValue || updateTokenMutation.isPending}
                                className="btn btn-primary"
                            >
                                {updateTokenMutation.isPending ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowTokenInput(false)
                                    setTokenValue('')
                                    setTokenError(null)
                                }}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                        {tokenError && (
                            <p className="text-sm text-red-600 mt-2">{tokenError}</p>
                        )}
                    </div>
                )}
            </div>

            {/* Active Project */}
            <div className="card">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <FolderKanban className="h-5 w-5 mr-2 text-gray-600" />
                    Active Project
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    Select the project to use across Dashboard, Test Cases, and Evaluations.
                </p>

                {projectsLoading ? (
                    <div className="animate-pulse h-10 bg-gray-200 rounded-lg w-full max-w-md" />
                ) : projects.length === 0 ? (
                    <div className="p-6 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <FolderKanban className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="font-medium text-gray-700">No projects configured</p>
                        <p className="text-sm text-gray-500 mt-1">
                            Go to the <a href="/projects" className="text-primary-600 font-medium hover:underline">Projects</a> page to create one.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <select
                            value={activeProject?.id || ''}
                            onChange={(e) => setActiveProject(e.target.value || null)}
                            className="input max-w-md"
                        >
                            <option value="">Select a project...</option>
                            {projects.map((p: any) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} - {p.gcp_project_id}
                                </option>
                            ))}
                        </select>

                        {activeProject && (
                            <div className="p-4 rounded-lg bg-primary-50 border border-primary-200">
                                <h3 className="font-semibold text-primary-800">{activeProject.name}</h3>
                                <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-primary-700">
                                    <div className="flex items-center">
                                        <Globe className="h-4 w-4 mr-1" />
                                        GCP: {activeProject.gcp_project_id}
                                    </div>
                                    <div className="flex items-center">
                                        <MapPin className="h-4 w-4 mr-1" />
                                        Region: {activeProject.gcp_location}
                                    </div>
                                    <div className="col-span-2 flex items-center">
                                        <Cpu className="h-4 w-4 mr-1" />
                                        CES App: {activeProject.ces_app_display_name || activeProject.ces_app_name}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Platform Info */}
            <div className="card">
                <h2 className="text-lg font-semibold mb-4">Platform Info</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="text-gray-500">Platform</p>
                        <p className="font-medium">CX Agent Studio</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Version</p>
                        <p className="font-medium">0.1.0</p>
                    </div>
                    <div>
                        <p className="text-gray-500">LLM Engine</p>
                        <p className="font-medium">Gemini 2.5 Pro</p>
                    </div>
                    <div>
                        <p className="text-gray-500">API Target</p>
                        <p className="font-medium">CES v1beta</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
