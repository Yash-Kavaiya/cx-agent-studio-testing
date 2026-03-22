// frontend/src/components/DatasetBrowser.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Database, Link, ChevronDown, ChevronRight, Check } from 'lucide-react'
import { securityTestingApi } from '../services/api'

interface DatasetInfo {
  id: string
  name: string
  size: number
  description: string
}

interface DatasetBrowserProps {
  selectedDataset: string | null
  selectedCategory: string | null
  onSelect: (datasetId: string, category: string) => void
}

const CATEGORY_LABELS: Record<string, string> = {
  prompt_injection: 'Prompt Injection',
  jailbreaking: 'Jailbreaking',
  toxicity: 'Toxicity',
  indirect_attack: 'Indirect Attacks',
}

export default function DatasetBrowser({ selectedDataset, selectedCategory, onSelect }: DatasetBrowserProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['prompt_injection']))
  const [customUrl, setCustomUrl] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const { data: datasets } = useQuery({
    queryKey: ['security-datasets'],
    queryFn: securityTestingApi.getDatasets,
  })

  const toggleCategory = (category: string) => {
    const next = new Set(expandedCategories)
    if (next.has(category)) {
      next.delete(category)
    } else {
      next.add(category)
    }
    setExpandedCategories(next)
  }

  return (
    <div className="space-y-4">
      {/* Curated Datasets */}
      <div className="border rounded-lg">
        {datasets && Object.entries(datasets).map(([category, categoryDatasets]) => (
          <div key={category} className="border-b last:border-b-0">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full p-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center">
                {expandedCategories.has(category) ? (
                  <ChevronDown className="h-4 w-4 mr-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2" />
                )}
                <span className="font-medium">{CATEGORY_LABELS[category] || category}</span>
                <span className="ml-2 text-sm text-gray-500">
                  ({(categoryDatasets as DatasetInfo[]).length} datasets)
                </span>
              </div>
            </button>

            {expandedCategories.has(category) && (
              <div className="p-2 pt-0 space-y-1">
                {(categoryDatasets as DatasetInfo[]).map((ds) => (
                  <button
                    key={ds.id}
                    onClick={() => onSelect(ds.id, category)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedDataset === ds.id
                        ? 'bg-primary-100 border-primary-500 border'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <Database className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="font-medium text-sm">{ds.name}</span>
                          {selectedDataset === ds.id && (
                            <Check className="h-4 w-4 ml-2 text-primary-600" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-6">{ds.description}</p>
                      </div>
                      <span className="text-xs text-gray-400 ml-2">
                        {ds.size.toLocaleString()} prompts
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Custom Dataset URL */}
      <div className="border rounded-lg p-4">
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="flex items-center text-sm font-medium text-gray-700"
        >
          <Link className="h-4 w-4 mr-2" />
          Use Custom Dataset URL
          {showCustom ? <ChevronDown className="h-4 w-4 ml-1" /> : <ChevronRight className="h-4 w-4 ml-1" />}
        </button>

        {showCustom && (
          <div className="mt-3 space-y-2">
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://huggingface.co/datasets/username/dataset"
              className="input w-full text-sm"
            />
            <p className="text-xs text-gray-500">
              Enter a HuggingFace dataset URL or ID (e.g., username/dataset-name)
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
