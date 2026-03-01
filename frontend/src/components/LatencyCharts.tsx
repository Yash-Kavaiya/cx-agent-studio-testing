import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts'

interface LatencyChartsProps {
    latencyReport: any
}

export default function LatencyCharts({ latencyReport }: LatencyChartsProps) {
    if (!latencyReport) return null

    // Parse the latency report into chartable data
    // CES LatencyReport has fields like: toolLatencies, callbackLatencies, llmLatencies, guardrailLatencies
    const categories = [
        { key: 'toolLatencies', label: 'Tools', color: '#3B82F6' },
        { key: 'callbackLatencies', label: 'Callbacks', color: '#10B981' },
        { key: 'llmLatencies', label: 'LLM', color: '#8B5CF6' },
        { key: 'guardrailLatencies', label: 'Guardrails', color: '#F59E0B' },
    ]

    // Transform nested latency data into flat chart format
    const chartData: any[] = []

    categories.forEach(({ key, label }) => {
        const data = latencyReport[key]
        if (data) {
            // Handle both array and object formats
            const items = Array.isArray(data) ? data : [data]
            items.forEach((item: any) => {
                chartData.push({
                    name: item.name || item.displayName || label,
                    category: label,
                    p50: item.p50 || item.medianLatency || 0,
                    p90: item.p90 || item.percentile90 || 0,
                    p99: item.p99 || item.percentile99 || 0,
                    avg: item.averageLatency || item.avg || 0,
                })
            })
        }
    })

    // If no structured data, try to flatten the entire report
    if (chartData.length === 0) {
        const flatData = Object.entries(latencyReport)
            .filter(([_, v]) => typeof v === 'object' && v !== null)
            .map(([k, v]: [string, any]) => ({
                name: k.replace(/Latenc(y|ies)$/i, ''),
                category: 'General',
                p50: v.p50 || v.median || 0,
                p90: v.p90 || 0,
                p99: v.p99 || 0,
                avg: v.avg || v.average || 0,
            }))
        chartData.push(...flatData)
    }

    // Summary metrics

    return (
        <div className="space-y-4">
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-sm text-blue-600 font-medium">Avg P50</p>
                    <p className="text-xl font-bold text-blue-800">
                        {chartData.length > 0
                            ? `${(chartData.reduce((s, d) => s + d.p50, 0) / chartData.length).toFixed(0)}ms`
                            : 'N/A'}
                    </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg text-center">
                    <p className="text-sm text-yellow-600 font-medium">Avg P90</p>
                    <p className="text-xl font-bold text-yellow-800">
                        {chartData.length > 0
                            ? `${(chartData.reduce((s, d) => s + d.p90, 0) / chartData.length).toFixed(0)}ms`
                            : 'N/A'}
                    </p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-center">
                    <p className="text-sm text-red-600 font-medium">Avg P99</p>
                    <p className="text-xl font-bold text-red-800">
                        {chartData.length > 0
                            ? `${(chartData.reduce((s, d) => s + d.p99, 0) / chartData.length).toFixed(0)}ms`
                            : 'N/A'}
                    </p>
                </div>
            </div>

            {/* Chart */}
            {chartData.length > 0 ? (
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barCategoryGap="20%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} label={{ value: 'ms', position: 'insideLeft', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                                formatter={(value: number) => [`${value}ms`]}
                            />
                            <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                            <Bar dataKey="p50" name="P50" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="p90" name="P90" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="p99" name="P99" fill="#EF4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="text-center py-8 text-gray-400">
                    <p>Latency data format not recognized. Raw data shown below.</p>
                    <pre className="mt-2 p-3 bg-gray-900 text-green-400 rounded text-xs overflow-x-auto text-left max-h-40">
                        {JSON.stringify(latencyReport, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    )
}
