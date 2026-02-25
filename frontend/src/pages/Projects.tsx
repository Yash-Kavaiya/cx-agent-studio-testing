import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, FolderKanban, ExternalLink } from 'lucide-react'
import { api } from '../services/api'

export default function Projects() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    gcp_project_id: '',
    gcp_location: 'us-central1',
    ces_app_name: '',
  })

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post('/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setShowModal(false)
      setFormData({ name: '', description: '', gcp_project_id: '', gcp_location: 'us-central1', ces_app_name: '' })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500">Manage your CX Agent projects and CES app connections</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects?.map((project: any) => (
          <div key={project.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="p-2 bg-primary-50 rounded-lg">
                <FolderKanban className="h-6 w-6 text-primary-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mt-4">{project.name}</h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {project.description || 'No description'}
            </p>
            <div className="mt-4 pt-4 border-t">
              <div className="text-xs text-gray-500 space-y-1">
                <p>GCP Project: {project.gcp_project_id}</p>
                <p>Location: {project.gcp_location}</p>
                <p className="truncate">CES App: {project.ces_app_display_name || project.ces_app_name}</p>
              </div>
            </div>
          </div>
        ))}
        {(!projects || projects.length === 0) && (
          <div className="col-span-full">
            <div className="card text-center py-12">
              <FolderKanban className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No projects yet</h3>
              <p className="text-gray-500 mt-1 mb-4">
                Create your first project to connect to a CX Agent
              </p>
              <button onClick={() => setShowModal(true)} className="btn btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input h-20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GCP Project ID
                </label>
                <input
                  type="text"
                  value={formData.gcp_project_id}
                  onChange={(e) => setFormData({ ...formData, gcp_project_id: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GCP Location
                </label>
                <select
                  value={formData.gcp_location}
                  onChange={(e) => setFormData({ ...formData, gcp_location: e.target.value })}
                  className="input"
                >
                  <option value="us-central1">us-central1</option>
                  <option value="us-east1">us-east1</option>
                  <option value="us-west1">us-west1</option>
                  <option value="europe-west1">europe-west1</option>
                  <option value="asia-northeast1">asia-northeast1</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CES App Resource Name
                </label>
                <input
                  type="text"
                  value={formData.ces_app_name}
                  onChange={(e) => setFormData({ ...formData, ces_app_name: e.target.value })}
                  placeholder="projects/.../locations/.../apps/..."
                  className="input"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn btn-primary"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
