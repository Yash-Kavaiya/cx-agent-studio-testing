import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Plus, Trash2, Loader2 } from 'lucide-react'
import { api } from '../services/api'
import { useActiveProject } from '../hooks/useActiveProject'

export default function ScheduledRuns() {
    const { activeProject } = useActiveProject()
    const queryClient = useQueryClient()
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        displayName: '',
        cronExpression: '0 8 * * 1-5',
        description: '',
        runCount: 1,
        generateLatencyReport: true,
    })

    const { data: schedules, isLoading } = useQuery({
        queryKey: ['scheduled-runs', activeProject?.id],
        queryFn: () => api.get(`/evaluations/scheduled?project_id=${activeProject?.id}`).then(r => r.data),
        enabled: !!activeProject,
    })

    const createMutation = useMutation({
        mutationFn: (data: typeof formData) =>
            api.post(`/evaluations/scheduled?project_id=${activeProject?.id}`, data).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scheduled-runs'] })
            setShowModal(false)
            setFormData({ displayName: '', cronExpression: '0 8 * * 1-5', description: '', runCount: 1, generateLatencyReport: true })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) =>
            api.delete(`/evaluations/scheduled/${id}?project_id=${activeProject?.id}`).then(r => r.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduled-runs'] }),
    })

    const cronPresets = [
        { label: 'Every weekday at 8 AM', value: '0 8 * * 1-5' },
        { label: 'Every day at midnight', value: '0 0 * * *' },
        { label: 'Every 6 hours', value: '0 */6 * * *' },
        { label: 'Every Monday at 9 AM', value: '0 9 * * 1' },
        { label: 'First of every month', value: '0 0 1 * *' },
    ]

    if (!activeProject) {
        return (
            <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-700">No Project Selected</h2>
                <p className="text-gray-500 mt-2">
                    Select a project in <a href="/settings" className="text-primary-600 hover:underline">Settings</a>.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Scheduled Evaluations</h1>
                    <p className="text-gray-500">Automate recurring regression test runs</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn btn-primary">
                    <Plus className="h-4 w-4 mr-2" /> New Schedule
                </button>
            </div>

            {/* Schedules List */}
            <div className="space-y-3">
                {isLoading && (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                )}

                {schedules?.map((schedule: any) => (
                    <div key={schedule.id || schedule.name} className="card flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Calendar className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{schedule.displayName || schedule.name}</h3>
                                <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">
                                        {schedule.cronExpression || schedule.schedule}
                                    </span>
                                    {schedule.lastRunTime && (
                                        <span>Last: {new Date(schedule.lastRunTime).toLocaleString()}</span>
                                    )}
                                </div>
                                {schedule.description && (
                                    <p className="text-sm text-gray-500 mt-1">{schedule.description}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => deleteMutation.mutate(schedule.id || schedule.name)}
                                disabled={deleteMutation.isPending}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                title="Delete schedule"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {(!schedules || schedules.length === 0) && !isLoading && (
                    <div className="card text-center py-12">
                        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No schedules configured</h3>
                        <p className="text-gray-500 mt-1 mb-4">
                            Set up automated evaluation runs to catch regressions early
                        </p>
                        <button onClick={() => setShowModal(true)} className="btn btn-primary">
                            <Plus className="h-4 w-4 mr-2" /> Create First Schedule
                        </button>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg">
                        <h2 className="text-xl font-semibold mb-4">Create Scheduled Run</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    placeholder="e.g., Nightly Regression"
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Optional description"
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule (Cron Expression)</label>
                                <input
                                    type="text"
                                    value={formData.cronExpression}
                                    onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
                                    className="input font-mono text-sm"
                                />
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {cronPresets.map((preset) => (
                                        <button
                                            key={preset.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, cronExpression: preset.value })}
                                            className={`text-xs px-2 py-1 rounded-full border ${formData.cronExpression === preset.value
                                                ? 'bg-primary-50 border-primary-300 text-primary-700'
                                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Run Count</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={formData.runCount}
                                        onChange={(e) => setFormData({ ...formData, runCount: parseInt(e.target.value) })}
                                        className="input"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 mb-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.generateLatencyReport}
                                            onChange={(e) => setFormData({ ...formData, generateLatencyReport: e.target.checked })}
                                            className="rounded border-gray-300 text-primary-600"
                                        />
                                        <span className="text-sm text-gray-700">Latency report</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                                <button
                                    onClick={() => createMutation.mutate(formData)}
                                    disabled={!formData.displayName || createMutation.isPending}
                                    className="btn btn-primary"
                                >
                                    {createMutation.isPending ? 'Creating…' : 'Create Schedule'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
