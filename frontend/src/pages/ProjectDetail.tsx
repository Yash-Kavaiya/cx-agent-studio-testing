import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
    ArrowLeft, Bot, Play, FileText, MessageSquare,
    Globe, MapPin, Cpu, Star
} from 'lucide-react'
import { projectsApi } from '../services/api'
import { useActiveProject } from '../hooks/useActiveProject'

export default function ProjectDetail() {
    const { projectId } = useParams<{ projectId: string }>()
    const navigate = useNavigate()
    const { activeProjectId, setActiveProject } = useActiveProject()

    const { data: project, isLoading } = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => projectsApi.get(projectId!),
        enabled: !!projectId,
    })

    const { data: agents } = useQuery({
        queryKey: ['project-agents', projectId],
        queryFn: () => projectsApi.listAgents(projectId!),
        enabled: !!projectId,
    })

    const isActive = activeProjectId === projectId

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="animate-pulse h-8 bg-gray-200 rounded w-1/3" />
                <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2" />
                <div className="grid grid-cols-3 gap-4 mt-6">
                    {[1, 2, 3].map(i => <div key={i} className="animate-pulse h-32 bg-gray-200 rounded-lg" />)}
                </div>
            </div>
        )
    }

    if (!project) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Project not found</p>
                <button onClick={() => navigate('/projects')} className="btn btn-primary mt-4">Back to Projects</button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/projects')} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                        <p className="text-gray-500">{project.description || 'No description'}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {!isActive && (
                        <button
                            onClick={() => setActiveProject(projectId!)}
                            className="btn btn-secondary text-sm flex items-center"
                        >
                            <Star className="h-4 w-4 mr-1" /> Set as Active
                        </button>
                    )}
                    {isActive && (
                        <span className="text-sm text-green-600 font-medium flex items-center bg-green-50 px-3 py-1.5 rounded-lg">
                            <Star className="h-4 w-4 mr-1 fill-green-600" /> Active Project
                        </span>
                    )}
                </div>
            </div>

            {/* Project Config */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4">Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center text-gray-600 mb-1">
                            <Globe className="h-4 w-4 mr-2" />
                            <span className="text-sm font-medium">GCP Project</span>
                        </div>
                        <p className="text-gray-900 font-mono text-sm">{project.gcp_project_id}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center text-gray-600 mb-1">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span className="text-sm font-medium">Location</span>
                        </div>
                        <p className="text-gray-900 font-mono text-sm">{project.gcp_location}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center text-gray-600 mb-1">
                            <Cpu className="h-4 w-4 mr-2" />
                            <span className="text-sm font-medium">CES App</span>
                        </div>
                        <p className="text-gray-900 text-sm truncate">
                            {project.ces_app_display_name || project.ces_app_name}
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={() => { setActiveProject(projectId!); navigate('/test-cases') }}
                    className="card hover:shadow-md transition-shadow text-left group"
                >
                    <div className="flex items-center">
                        <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="font-semibold text-gray-900">Generate Test Cases</p>
                            <p className="text-sm text-gray-500">Create AI-powered test cases</p>
                        </div>
                    </div>
                </button>
                <button
                    onClick={() => { setActiveProject(projectId!); navigate('/evaluations') }}
                    className="card hover:shadow-md transition-shadow text-left group"
                >
                    <div className="flex items-center">
                        <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                            <Play className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="font-semibold text-gray-900">Run Evaluations</p>
                            <p className="text-sm text-gray-500">Execute tests against CES</p>
                        </div>
                    </div>
                </button>
                <button
                    onClick={() => { setActiveProject(projectId!); navigate('/live-chat') }}
                    className="card hover:shadow-md transition-shadow text-left group"
                >
                    <div className="flex items-center">
                        <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                            <MessageSquare className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="font-semibold text-gray-900">Live Chat</p>
                            <p className="text-sm text-gray-500">Test agent interactively</p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Agents */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Bot className="h-5 w-5 mr-2 text-gray-600" />
                    CES Agents
                </h3>
                {agents && agents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {agents.map((agent: any, i: number) => (
                            <div key={i} className="p-4 border rounded-lg hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Bot className="h-5 w-5 text-primary-600 mr-2" />
                                        <span className="font-medium">{agent.displayName || agent.name}</span>
                                    </div>
                                    {agent.type && (
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">
                                            {agent.type}
                                        </span>
                                    )}
                                </div>
                                {agent.description && (
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{agent.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        <Bot className="h-10 w-10 mx-auto mb-2" />
                        <p>No agents found. Check your CES app configuration.</p>
                    </div>
                )}
            </div>

            {/* Meta */}
            <div className="text-xs text-gray-400">
                Created: {new Date(project.created_at).toLocaleString()} • Updated: {new Date(project.updated_at).toLocaleString()}
            </div>
        </div>
    )
}
