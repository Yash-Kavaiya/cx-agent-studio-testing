// frontend/src/components/SecurityTestModal.tsx
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Play, Settings as SettingsIcon } from 'lucide-react'
import { securityTestingApi } from '../services/api'
import DatasetBrowser from './DatasetBrowser'

interface SecurityTestModalProps {
  projectId: string
  onClose: () => void
  onSuccess: (runId: string) => void
}

export default function SecurityTestModal({ projectId, onClose, onSuccess }: SecurityTestModalProps) {
  const queryClient = useQueryClient()
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [config, setConfig] = useState({
    sample_size: 100,
    batch_size: 10,
    timeout_per_prompt: 30,
    shuffle: true,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      securityTestingApi.createRun({
        project_id: projectId,
        dataset_id: selectedDataset!,
        category: selectedCategory!,
        name: name || undefined,
        config,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['security-runs'] })
      onSuccess(data.id)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedDataset && selectedCategory) {
      createMutation.mutate()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">New Security Test</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* Name (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Auto-generated if empty"
              className="input w-full"
            />
          </div>

          {/* Dataset Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Dataset
            </label>
            <DatasetBrowser
              selectedDataset={selectedDataset}
              selectedCategory={selectedCategory}
              onSelect={(datasetId, category) => {
                setSelectedDataset(datasetId)
                setSelectedCategory(category)
              }}
            />
          </div>

          {/* Advanced Configuration */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-sm font-medium text-gray-700"
            >
              <SettingsIcon className="h-4 w-4 mr-2" />
              Advanced Configuration
            </button>

            {showAdvanced && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Sample Size
                  </label>
                  <input
                    type="number"
                    value={config.sample_size}
                    onChange={(e) => setConfig({ ...config, sample_size: parseInt(e.target.value) || 100 })}
                    min={1}
                    max={10000}
                    className="input w-full text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max: 10,000</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Batch Size
                  </label>
                  <input
                    type="number"
                    value={config.batch_size}
                    onChange={(e) => setConfig({ ...config, batch_size: parseInt(e.target.value) || 10 })}
                    min={1}
                    max={100}
                    className="input w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Timeout (s)
                  </label>
                  <input
                    type="number"
                    value={config.timeout_per_prompt}
                    onChange={(e) => setConfig({ ...config, timeout_per_prompt: parseInt(e.target.value) || 30 })}
                    min={1}
                    max={120}
                    className="input w-full text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Per prompt</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Shuffle
                  </label>
                  <select
                    value={config.shuffle ? 'true' : 'false'}
                    onChange={(e) => setConfig({ ...config, shuffle: e.target.value === 'true' })}
                    className="input w-full text-sm"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedDataset || createMutation.isPending}
            className="btn btn-primary flex items-center"
          >
            <Play className="h-4 w-4 mr-2" />
            {createMutation.isPending ? 'Starting...' : 'Start Test'}
          </button>
        </div>
      </div>
    </div>
  )
}
