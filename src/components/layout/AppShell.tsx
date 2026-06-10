'use client';

import { useApp } from '@/context/AppContext';
import Sidebar from './Sidebar';
import Dashboard from '@/components/dashboard/Dashboard';
import ProjectDetail from '@/components/projects/ProjectDetail';

export default function AppShell() {
  const { state, view, selectedProjectId, hydrated } = useApp();

  const selectedProject = selectedProjectId
    ? state.projects.find(p => p.id === selectedProjectId)
    : null;

  if (!hydrated) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading TaskFlow…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        {view === 'project' && selectedProject ? (
          <ProjectDetail project={selectedProject} />
        ) : (
          <Dashboard />
        )}
      </main>
    </div>
  );
}
