'use client';

import { useApp } from '@/context/AppContext';
import Sidebar from './Sidebar';
import Dashboard from '@/components/dashboard/Dashboard';
import ProjectDetail from '@/components/projects/ProjectDetail';
import DevLogPage from '@/components/devlog/DevLogPage';
import LearningsPage from '@/components/learnings/LearningsPage';
import PomodoroPage from '@/components/pomodoro/PomodoroPage';

export default function AppShell() {
  const { state, view, selectedProjectId, hydrated } = useApp();

  const selectedProject = selectedProjectId
    ? state.projects.find(p => p.id === selectedProjectId)
    : null;

  if (!hydrated) {
    return (
      <div className="h-screen flex items-center justify-center bg-base">
        <div className="flex items-center gap-3 text-secondary">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading TaskFlow…</span>
        </div>
      </div>
    );
  }

  const renderMain = () => {
    if (view === 'project' && selectedProject) return <ProjectDetail project={selectedProject} />;
    if (view === 'devlog')    return <DevLogPage />;
    if (view === 'learnings') return <LearningsPage />;
    if (view === 'pomodoro')  return <PomodoroPage />;
    return <Dashboard />;
  };

  return (
    <div className="h-screen flex overflow-hidden bg-base">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        {renderMain()}
      </main>
    </div>
  );
}
