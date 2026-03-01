import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, CheckCircle, Clock, ArrowRight, Sparkles, FileText, Play, Zap } from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'
import { dashboardApi, evaluationsApi } from '../services/api'
import ActivityFeed, { type ActivityItem } from '../components/ActivityFeed'

const COLORS = ['#10B981', '#EF4444', '#F59E0B']

export default function Dashboard() {
  const navigate = useNavigate()

  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardApi.summary(),
  })

  const { data: recentRuns } = useQuery({
    queryKey: ['recent-runs'],
    queryFn: () => evaluationsApi.listRuns({ limit: 5 }),
  })

  // Derive activity from recent runs
  const activityItems: ActivityItem[] = (recentRuns || []).map((run: any) => ({
    type: run.state === 'completed' ? 'run_completed' as const
      : run.state === 'error' ? 'run_failed' as const
        : 'run_started' as const,
    title: `Evaluation ${run.state}`,
    description: `${run.total_count} tests • ${run.pass_rate?.toFixed(0) || 0}% pass rate`,
    timestamp: run.created_at,
  }))

  const hasData = (summary?.total_test_cases || 0) > 0 || (recentRuns || []).length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Overview of your CX Agent testing platform</p>
      </div>

      {/* Quick-Start Guide (shown when no data) */}
      {!hasData && (
        <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="h-5 w-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Quick Start Guide</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/projects')}
              className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow text-left"
            >
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-sm">1. Create a Project</p>
                <p className="text-xs text-gray-500">Connect your GCP/CES app</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 ml-auto" />
            </button>
            <button
              onClick={() => navigate('/test-cases')}
              className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow text-left"
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm">2. Generate Test Cases</p>
                <p className="text-xs text-gray-500">AI creates structured tests</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 ml-auto" />
            </button>
            <button
              onClick={() => navigate('/evaluations')}
              className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow text-left"
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <Play className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">3. Run Evaluations</p>
                <p className="text-xs text-gray-500">Execute against CES agents</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 ml-auto" />
            </button>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-primary-50 rounded-lg">
              <BarChart3 className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Test Cases</p>
              <p className="text-2xl font-semibold">{summary?.total_test_cases || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Approved</p>
              <p className="text-2xl font-semibold">{summary?.approved_count || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Review</p>
              <p className="text-2xl font-semibold">{summary?.pending_count || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Runs</p>
              <p className="text-2xl font-semibold">{summary?.total_runs || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts + Activity Feed Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pass Rate Trend – LineChart */}
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Pass Rate Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary?.pass_rate_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: number) => [`${value}%`, 'Pass Rate']}
                />
                <Line
                  type="monotone"
                  dataKey="pass_rate"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <ActivityFeed items={activityItems} />
        </div>
      </div>

      {/* Test Case Status Pie + Recent Runs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Test Case Status</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Approved', value: summary?.approved_count || 0 },
                    { name: 'Failed', value: summary?.total_failed || 0 },
                    { name: 'Pending', value: summary?.pending_count || 0 },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {[0, 1, 2].map((index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {[
              { label: 'Approved', color: '#10B981' },
              { label: 'Failed', color: '#EF4444' },
              { label: 'Pending', color: '#F59E0B' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 text-xs text-gray-600">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Recent Evaluation Runs</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Total</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Passed</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Failed</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Pass Rate</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRuns?.map((run: any) => (
                  <tr
                    key={run.id}
                    className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/evaluations/${run.id}`)}
                  >
                    <td className="py-3 px-4">{new Date(run.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{run.total_count}</td>
                    <td className="py-3 px-4 text-green-600">{run.passed_count}</td>
                    <td className="py-3 px-4 text-red-600">{run.failed_count}</td>
                    <td className="py-3 px-4">
                      <span className={`font-medium ${(run.pass_rate || 0) >= 80 ? 'text-green-600' :
                          (run.pass_rate || 0) >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                        {run.pass_rate?.toFixed(1) || 0}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${run.state === 'completed' ? 'badge-success' :
                        run.state === 'running' ? 'badge-warning' :
                          run.state === 'error' ? 'badge-error' : 'badge-info'
                        }`}>
                        {run.state}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!recentRuns || recentRuns.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No evaluation runs yet. Create test cases and run evaluations to see results.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
