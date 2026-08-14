import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, Database, FileText, BarChart3,
  Megaphone, Settings, LogOut, BookOpen,
} from 'lucide-react';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/batches', label: 'Batches', icon: GraduationCap },
  { to: '/admin/questions', label: 'Question Bank', icon: Database },
  { to: '/admin/exams', label: 'Exams', icon: FileText },
  { to: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      {open && <div className="fixed inset-0 bg-ink/40 z-30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed lg:sticky top-0 h-screen w-60 bg-white border-r border-line z-40 flex flex-col transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-16 flex items-center px-5 border-b border-line">
          <Logo />
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-control text-sm font-medium transition-colors relative ${
                  isActive ? 'bg-primary-50 text-primary-600' : 'text-gray hover:bg-gray-50 hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r bg-primary" />}
                  <Icon className="h-[18px] w-[18px]" />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-line">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar name={user?.name || user?.ownerName} color="#1A56DB" size={36} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink truncate">{user?.name || user?.ownerName}</p>
              <p className="text-xs text-gray truncate">{user?.city || 'Institute'}</p>
            </div>
            <button onClick={logout} title="Logout" className="text-gray-light hover:text-danger transition-colors p-1.5">
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
