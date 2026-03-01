import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Inject auth token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
    }
    return Promise.reject(error)
  }
)

// ─── Projects ───────────────────────────────────────────────
export const projectsApi = {
  list: () => api.get('/projects').then(r => r.data),
  create: (data: any) => api.post('/projects', data).then(r => r.data),
  get: (id: string) => api.get(`/projects/${id}`).then(r => r.data),
  listAgents: (id: string) => api.get(`/projects/${id}/ces-agents`).then(r => r.data),
}

// ─── Test Cases ─────────────────────────────────────────────
export const testCasesApi = {
  list: (params?: { test_suite_id?: string; status?: string }) =>
    api.get('/test-cases', { params }).then(r => r.data),
  get: (id: string) => api.get(`/test-cases/${id}`).then(r => r.data),
  getVersions: (id: string) => api.get(`/test-cases/${id}/versions`).then(r => r.data),
  generate: (suiteId: string, data: { description: string; type_hint?: string; agent_id?: string }) =>
    api.post(`/test-cases/generate?test_suite_id=${suiteId}`, data).then(r => r.data),
  uploadDocx: (suiteId: string, formData: FormData) =>
    api.post(`/test-cases/from-docx?test_suite_id=${suiteId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),
  approve: (id: string, data: { action: string; feedback?: string }) =>
    api.post(`/test-cases/${id}/approve`, data).then(r => r.data),
  submit: (id: string) => api.post(`/test-cases/${id}/submit`).then(r => r.data),
  delete: (id: string) => api.delete(`/test-cases/${id}`).then(r => r.data),
}

// ─── Evaluations ────────────────────────────────────────────
export const evaluationsApi = {
  listRuns: (params?: { test_suite_id?: string; limit?: number }) =>
    api.get('/evaluations/runs', { params }).then(r => r.data),
  getRun: (id: string) => api.get(`/evaluations/runs/${id}`).then(r => r.data),
  getRunResults: (id: string) => api.get(`/evaluations/runs/${id}/results`).then(r => r.data),
  run: (suiteId: string, data: any) =>
    api.post(`/evaluations/run?test_suite_id=${suiteId}`, data).then(r => r.data),
  analyze: (id: string, question?: string) =>
    api.post(`/evaluations/runs/${id}/analyze`, { run_id: id, question }).then(r => r.data),
  deleteRun: (id: string) => api.delete(`/evaluations/runs/${id}`).then(r => r.data),
}

// ─── Sessions ───────────────────────────────────────────────
export const sessionsApi = {
  chat: (projectId: string, data: { text: string; entry_agent?: string; time_zone?: string }, sessionId?: string) =>
    api.post(`/sessions/${projectId}/chat${sessionId ? `?session_id=${sessionId}` : ''}`, data).then(r => r.data),
}

// ─── Dashboard ──────────────────────────────────────────────
export const dashboardApi = {
  summary: (projectId?: string) =>
    api.get(projectId ? `/dashboard/${projectId}/summary` : '/dashboard/summary').then(r => r.data),
}

// ─── Health ─────────────────────────────────────────────────
export const healthApi = {
  check: () => api.get('/health').then(r => r.data),
}
