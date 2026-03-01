import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '../services/api'

const STORAGE_KEY = 'cx_active_project_id'

export interface Project {
    id: string
    name: string
    description?: string
    gcp_project_id: string
    gcp_location: string
    ces_app_name: string
    ces_app_display_name?: string
    is_active: boolean
    created_at: string
    updated_at: string
}

export function useActiveProject() {
    const [activeProjectId, setActiveProjectIdState] = useState<string | null>(() =>
        localStorage.getItem(STORAGE_KEY)
    )

    const { data: projects = [], isLoading, error } = useQuery<Project[]>({
        queryKey: ['projects'],
        queryFn: projectsApi.list,
        retry: 1,
    })

    const activeProject = projects.find((p) => p.id === activeProjectId) || null

    const setActiveProject = useCallback((id: string | null) => {
        setActiveProjectIdState(id)
        if (id) {
            localStorage.setItem(STORAGE_KEY, id)
        } else {
            localStorage.removeItem(STORAGE_KEY)
        }
    }, [])

    // Auto-select first project if none selected
    useEffect(() => {
        if (!activeProjectId && projects.length > 0) {
            setActiveProject(projects[0].id)
        }
    }, [activeProjectId, projects, setActiveProject])

    return {
        activeProject,
        activeProjectId,
        setActiveProject,
        projects,
        isLoading,
        error,
    }
}
