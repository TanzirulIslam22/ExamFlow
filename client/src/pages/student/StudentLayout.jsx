import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, FileText, Trophy, LogOut, Menu, Megaphone, X } from 'lucide-react';
import Logo from '../../components/Logo.jsx';
import Avatar from '../../components/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const nav = [
  { to: '/student', label: 'My Exams', icon: LayoutDashboard, end: true },
  { to: '/student/results', label: 'My Results', icon: Trophy },
];

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-bglight">
      {open && <div className="fixed inset-0 bg-ink/40 z-30 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed lg:sticky top-0 h-screen w-60 bg-white border-r border-line z-40 flex flex-col transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-5 border-b border-line">
          <Link to="/student"><Logo /></Link>
        </div>
        <nav className="flex-1 min-h-0 py-4 px-3 space-y-1 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to} to={to} end={end} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-control text-sm font-medium relative transition-colors ${isActive ? 'bg-primary-50 text-primary-600' : 'text-gray hover:bg-gray-50 hover:text-ink'}`}
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r bg-primary" />}
                  <Icon className="h-[18px] w-[18px]" /> {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-line shrink-0">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar name={user?.name} color={user?.avatarColor || '#1A56DB'} size={36} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink truncate">{user?.name}</p>
              <p className="text-xs text-gray truncate">{user?.institute?.name}</p>
            </div>
            <button onClick={logout} title="Logout" className="text-gray-light hover:text-danger transition-colors p-1.5">
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-line flex items-center gap-3 px-4 lg:px-6 sticky top-0 z-20">
          <button className="lg:hidden text-gray p-2 -ml-2" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink truncate">Welcome back, {user?.name?.split(' ')[0]} 👋</p>
            <p className="text-xs text-gray">{user?.batch?.name || 'No batch assigned'}</p>
          </div>
          <Link to="/student" className="btn-ghost !py-1.5"><Megaphone className="h-4 w-4 text-primary" /> Updates</Link>
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
