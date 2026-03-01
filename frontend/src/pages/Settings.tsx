import { useQuery } from '@tanstack/react-query'
import { Server, CheckCircle, XCircle, FolderKanban, Globe, MapPin, Cpu } from 'lucide-react'
import { useActiveProject } from '../hooks/useActiveProject'
import { healthApi } from '../services/api'

export default function Settings() {
    const { activeProject, setActiveProject, projects, isLoading: projectsLoading } = useActiveProject()

    const { data: health, error: healthError } = useQuery({
        queryKey: ['health'],
        queryFn: healthApi.check,
        retry: 1,
        refetchInterval: 30000,
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
                            <option value="">Select a project…</option>
                            {projects.map((p: any) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} — {p.gcp_project_id}
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
