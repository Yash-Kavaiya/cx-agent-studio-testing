import { useQuery } from '@tanstack/react-query'
import { BarChart3, CheckCircle, Clock, XCircle } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { api } from '../services/api'

const COLORS = ['#10B981', '#EF4444', '#F59E0B']

export default function Dashboard() {
  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => api.get('/dashboard/summary').then(res => res.data),
  })

  const { data: recentRuns } = useQuery({
    queryKey: ['recent-runs'],
    queryFn: () => api.get('/evaluations/runs?limit=5').then(res => res.data),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Overview of your CX Agent testing platform</p>
      </div>

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
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Runs</p>
              <p className="text-2xl font-semibold">{summary?.total_runs || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Pass Rate Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.pass_rate_trend || []}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="pass_rate" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Test Case Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Approved', value: summary?.approved_count || 0 },
                    { name: 'Failed', value: summary?.failed_count || 0 },
                    { name: 'Pending', value: summary?.pending_count || 0 },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
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
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Recent Evaluation Runs</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Total</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Passed</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Failed</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Pass Rate</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentRuns?.map((run: any) => (
                <tr key={run.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{new Date(run.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4 capitalize">{run.evaluation_type}</td>
                  <td className="py-3 px-4">{run.total_count}</td>
                  <td className="py-3 px-4 text-green-600">{run.passed_count}</td>
                  <td className="py-3 px-4 text-red-600">{run.failed_count}</td>
                  <td className="py-3 px-4">{run.pass_rate?.toFixed(1)}%</td>
                  <td className="py-3 px-4">
                    <span className={`badge ${
                      run.state === 'completed' ? 'badge-success' :
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
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No evaluation runs yet. Create test cases and run evaluations to see results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
