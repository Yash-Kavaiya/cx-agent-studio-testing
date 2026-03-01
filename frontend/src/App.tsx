import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import TestCases from './pages/TestCases'
import Evaluations from './pages/Evaluations'
import EvaluationRunDetail from './pages/EvaluationRunDetail'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import LiveChat from './pages/LiveChat'
import Settings from './pages/Settings'
import ScheduledRuns from './pages/ScheduledRuns'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:projectId" element={<ProjectDetail />} />
        <Route path="test-cases" element={<TestCases />} />
        <Route path="evaluations" element={<Evaluations />} />
        <Route path="evaluations/scheduled" element={<ScheduledRuns />} />
        <Route path="evaluations/:runId" element={<EvaluationRunDetail />} />
        <Route path="live-chat" element={<LiveChat />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
