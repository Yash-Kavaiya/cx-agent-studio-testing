import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, FileText, Play, FolderKanban, Settings, MessageSquare, Calendar, Shield } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Test Cases', href: '/test-cases', icon: FileText },
  { name: 'Evaluations', href: '/evaluations', icon: Play },
  { name: 'Scheduled', href: '/evaluations/scheduled', icon: Calendar },
  { name: 'Live Chat', href: '/live-chat', icon: MessageSquare },
  { name: 'Security', href: '/security-testing', icon: Shield },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-primary-600">CX Agent Studio</h1>
              </div>
              <div className="ml-10 flex items-center space-x-4">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.href === '/'}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                      }`
                    }
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `p-2 rounded-full ${isActive ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100 text-gray-500'}`
                }
              >
                <Settings className="h-5 w-5" />
              </NavLink>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}
