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

// ─── Settings ──────────────────────────────────────────────
export const settingsApi = {
  getHFTokenStatus: () => api.get<{ configured: boolean; last_updated?: string }>('/settings/hf-token/status').then(r => r.data),
  updateHFToken: (token: string) => api.put<{ success: boolean; updated_at: string }>('/settings/hf-token', { token }).then(r => r.data),
  deleteHFToken: () => api.delete<{ success: boolean }>('/settings/hf-token').then(r => r.data),
}

// ─── Security Testing ──────────────────────────────────────
export interface SecurityTestRun {
  id: string;
  project_id: string;
  name: string;
  dataset_source: string;
  dataset_category: string;
  state: 'pending' | 'running' | 'completed' | 'error' | 'cancelled';
  config: Record<string, unknown>;
  total_prompts: number;
  completed_prompts: number;
  attack_success_count: number;
  attack_success_rate: number | null;
  ces_session_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface SecurityTestResult {
  id: string;
  security_test_run_id: string;
  prompt_text: string;
  prompt_category: string | null;
  agent_response: string | null;
  is_attack_successful: boolean;
  detection_method: string | null;
  confidence_score: number | null;
  latency_ms: number | null;
  created_at: string;
}

export const securityTestingApi = {
  getDatasets: () => api.get<Record<string, Array<{ id: string; name: string; size: number; description: string }>>>('/security-testing/datasets').then(r => r.data),
  validateDataset: (datasetUrl: string) =>
    api.post<{ valid: boolean; name?: string; size?: number; columns?: string[]; error?: string }>('/security-testing/validate-dataset', { dataset_url: datasetUrl }).then(r => r.data),
  createRun: (data: {
    project_id: string;
    dataset_id: string;
    category: string;
    name?: string;
    config?: { sample_size?: number; batch_size?: number; shuffle?: boolean };
  }) => api.post<SecurityTestRun>('/security-testing/runs', data).then(r => r.data),
  listRuns: (projectId: string, limit?: number) =>
    api.get<{ runs: SecurityTestRun[]; total: number }>('/security-testing/runs', { params: { project_id: projectId, limit } }).then(r => r.data),
  getRun: (runId: string) => api.get<SecurityTestRun>(`/security-testing/runs/${runId}`).then(r => r.data),
  getResults: (runId: string, params?: { filter?: string; page?: number; per_page?: number }) =>
    api.get<{ results: SecurityTestResult[]; total: number; page: number }>(`/security-testing/runs/${runId}/results`, { params }).then(r => r.data),
  cancelRun: (runId: string) => api.post<{ success: boolean; state: string }>(`/security-testing/runs/${runId}/cancel`).then(r => r.data),
  deleteRun: (runId: string) => api.delete(`/security-testing/runs/${runId}`).then(r => r.data),
}
