'use client';

import { useState } from 'react';
import {
  LayoutDashboard, FolderKanban, Plus, ChevronLeft, ChevronRight,
  Zap, AlertTriangle, BookOpen, GraduationCap, Timer, Sun, Moon
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { useToastContext } from '@/context/ToastContext';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectForm from '@/components/projects/ProjectForm';
import { Project } from '@/types';
import { PRIORITY_ORDER } from '@/lib/utils';

type View = 'dashboard' | 'project' | 'devlog' | 'learnings' | 'pomodoro';

const NAV_ITEMS: { id: View; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'devlog',     label: 'Dev Log',     icon: BookOpen },
  { id: 'learnings',  label: 'Learnings',   icon: GraduationCap },
  { id: 'pomodoro',   label: 'Pomodoro',    icon: Timer },
];

export default function Sidebar() {
  const { state, view, setView, selectedProjectId, selectProject, addProject } = useApp();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToastContext();
  const [collapsed, setCollapsed] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);

  const handleAddProject = (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) => {
    addProject(data);
    setShowNewProject(false);
    toast('Project created');
  };

  const sortedProjects = [...state.projects].sort(
    (a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]
  );
  const urgentCount = state.projects.filter(p => p.priority === 'urgent' && p.status !== 'completed').length;

  const isActive = (id: View) => id === 'project' ? view === 'project' : view === id;

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className={`hidden md:flex flex-col bg-surface border-r border-base transition-all duration-300 shrink-0 ${collapsed ? 'w-14' : 'w-60'}`}>

        {/* Logo row */}
        <div className="flex items-center justify-between px-3 py-3.5 border-b border-base">
          {collapsed ? (
            <button onClick={() => setCollapsed(false)} className="mx-auto p-1 text-muted hover:text-primary rounded-lg">
              <div className="w-7 h-7 bg-indigo-600 dark:bg-indigo-500 rounded-lg flex items-center justify-center">
                <Zap size={14} className="text-white" />
              </div>
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-indigo-600 dark:bg-indigo-500 rounded-lg flex items-center justify-center">
                  <Zap size={14} className="text-white" />
                </div>
                <span className="font-bold text-primary text-sm">TaskFlow</span>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="p-1.5 text-muted hover:text-secondary hover:bg-raised rounded-lg transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
            </>
          )}
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-2 px-2">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-colors mb-0.5 ${
                isActive(id)
                  ? 'bg-indigo-500/10 text-indigo-400 dark:text-indigo-400'
                  : 'text-secondary hover:bg-raised hover:text-primary'
              }`}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && label}
            </button>
          ))}

          {/* Projects section */}
          {!collapsed && (
            <div className="mt-4">
              <div className="flex items-center justify-between px-2.5 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-muted uppercase tracking-widest">Projects</span>
                  {urgentCount > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-red-400 font-semibold">
                      <AlertTriangle size={10} />{urgentCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowNewProject(true)}
                  className="p-1 text-muted hover:text-indigo-400 hover:bg-raised rounded-lg transition-colors"
                  title="New project"
                >
                  <Plus size={13} />
                </button>
              </div>
              {sortedProjects.length === 0 ? (
                <p className="px-2.5 text-xs text-muted py-2">No projects yet</p>
              ) : (
                <div className="space-y-0.5">
                  {sortedProjects.map(project => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => selectProject(project.id)}
                      isSelected={selectedProjectId === project.id}
                      compact
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom: theme toggle */}
        <div className="px-2 py-2 border-t border-base">
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm text-secondary hover:bg-raised hover:text-primary transition-colors"
          >
            {theme === 'dark'
              ? <Sun size={15} className="shrink-0 text-amber-400" />
              : <Moon size={15} className="shrink-0" />
            }
            {!collapsed && (theme === 'dark' ? 'Light mode' : 'Dark mode')}
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ───────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-base z-40 px-1 py-1">
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                isActive(id) ? 'text-indigo-400' : 'text-muted'
              }`}
            >
              <Icon size={18} />
              <span className="text-[9px] font-medium">{label}</span>
            </button>
          ))}
          <button
            onClick={() => setShowNewProject(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5"
          >
            <div className="w-8 h-8 bg-indigo-600 dark:bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
              <Plus size={16} className="text-white" />
            </div>
            <span className="text-[9px] font-medium text-muted">New</span>
          </button>
          <button
            onClick={toggleTheme}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-muted"
          >
            {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            <span className="text-[9px] font-medium">Theme</span>
          </button>
        </div>
      </nav>

      {showNewProject && (
        <ProjectForm onSave={handleAddProject} onClose={() => setShowNewProject(false)} />
      )}
    </>
  );
}
