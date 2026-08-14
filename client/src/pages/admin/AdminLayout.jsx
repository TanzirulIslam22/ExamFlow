import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../../components/Sidebar.jsx';
import Topbar from '../../components/Topbar.jsx';

const titles = {
  '/admin': 'Overview',
  '/admin/students': 'Students',
  '/admin/batches': 'Batches',
  '/admin/questions': 'Question Bank',
  '/admin/exams': 'Exams',
  '/admin/reports': 'Reports & Analytics',
  '/admin/announcements': 'Announcements',
  '/admin/settings': 'Settings',
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const title = titles[pathname] || 'Exams';

  return (
    <div className="min-h-screen flex bg-bglight">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar title={title} onMenu={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
