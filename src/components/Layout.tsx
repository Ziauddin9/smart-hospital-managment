import { ReactNode, useState } from 'react';
import {
  LayoutDashboard, Users, UserCog, Calendar, FileText,
  Pill, FlaskConical, Receipt, Building2, Menu, X,
  Activity, ChevronRight, Bell, Search, LogOut
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

type Page =
  | 'dashboard'
  | 'patients'
  | 'doctors'
  | 'departments'
  | 'appointments'
  | 'medical-records'
  | 'pharmacy'
  | 'labs'
  | 'billing';

interface NavItem {
  id: Page;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'doctors', label: 'Doctors', icon: UserCog },
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'medical-records', label: 'Medical Records', icon: FileText },
  { id: 'pharmacy', label: 'Pharmacy', icon: Pill },
  { id: 'labs', label: 'Laboratory', icon: FlaskConical },
  { id: 'billing', label: 'Billing', icon: Receipt },
];

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
}

export type { Page };

export default function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { hospitalUser, signOut } = useAuth();

  const currentItem = navItems.find(n => n.id === currentPage);
  const userInitials = hospitalUser?.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD';


  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 flex flex-col transition-transform duration-200
        lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">MediCore HMS</p>
            <p className="text-slate-400 text-xs">Hospital Management</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">Main Menu</p>
          {navItems.map(item => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
                className={`sidebar-link w-full ${active ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{userInitials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{hospitalUser?.full_name || 'User'}</p>
              <p className="text-slate-400 text-xs truncate capitalize">{hospitalUser?.role || 'Staff'}</p>
            </div>
            <button onClick={signOut} className="text-slate-400 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-900">{currentItem?.label}</h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 w-56">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent text-sm outline-none text-slate-600 placeholder:text-slate-400 w-full"
            />
          </div>

          <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
