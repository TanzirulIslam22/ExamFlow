import { useState } from 'react';
import { Menu, Search, Bell, ChevronRight } from 'lucide-react';
import Avatar from './Avatar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Topbar({ title, onMenu }) {
  const { user } = useAuth();
  const [bellOpen, setBellOpen] = useState(false);

  const notifications = [
    { id: 1, text: '3 students completed the weekly test', time: '12 min ago', unread: true },
    { id: 2, text: 'New exam published: English Literature Practice', time: '2 hr ago', unread: true },
    { id: 3, text: 'Ayesha Rahman scored 92% on Physics quiz', time: '5 hr ago', unread: true },
  ];

  return (
    <header className="h-16 bg-white border-b border-line flex items-center gap-4 px-4 lg:px-6 sticky top-0 z-20">
      <button onClick={onMenu} className="lg:hidden text-gray p-2 -ml-2">
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2 text-sm min-w-0">
        <span className="text-gray-light hidden sm:inline">Dashboard</span>
        <ChevronRight className="h-3.5 w-3.5 text-gray-light hidden sm:inline" />
        <span className="font-semibold text-ink truncate">{title}</span>
      </div>

      <div className="flex-1" />

      <div className="hidden md:block relative">
        <Search className="h-4 w-4 text-gray-light absolute left-3 top-1/2 -translate-y-1/2" />
        <input placeholder="Search…" className="input !w-56 !pl-9 !rounded-full !bg-gray-50 !border-transparent" />
      </div>

      <div className="relative">
        <button
          onClick={() => setBellOpen((v) => !v)}
          className="relative p-2 rounded-full text-gray hover:bg-gray-100 transition-colors"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-danger ring-2 ring-white" />
        </button>
        {bellOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setBellOpen(false)} />
            <div className="absolute right-0 top-12 w-80 bg-white rounded-card border border-line shadow-overlay z-40 animate-slideUp overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-line">
                <p className="text-sm font-semibold text-ink">Notifications</p>
                <button className="text-xs font-medium text-primary hover:underline">Mark all read</button>
              </div>
              <div className="divide-y divide-line max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                    <p className="text-sm text-ink leading-snug">{n.text}</p>
                    <p className="text-xs text-gray-light mt-0.5">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <Avatar name={user?.name || user?.ownerName} color="#1A56DB" size={36} />
    </header>
  );
}
