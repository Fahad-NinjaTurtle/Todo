'use client';

import { useState } from 'react';
import {
  LayoutDashboard, FolderKanban, Plus, ChevronLeft, ChevronRight,
  Zap, AlertTriangle
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToastContext } from '@/context/ToastContext';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectForm from '@/components/projects/ProjectForm';
import { Project } from '@/types';
import { PRIORITY_ORDER } from '@/lib/utils';

export default function Sidebar() {
  const { state, view, setView, selectedProjectId, selectProject, addProject } = useApp();
  const { toast } = useToastContext();
  const [collapsed, setCollapsed] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);

  const handleAddProject = (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) => {
    addProject(data);
    setShowNewProject(false);
    toast('Project created');
  };

  // Sort by priority for sidebar
  const sortedProjects = [...state.projects].sort(
    (a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]
  );

  const urgentCount = state.projects.filter(p => p.priority === 'urgent' && p.status !== 'completed').length;

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 shrink-0 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Zap size={14} className="text-white" />
              </div>
              <span className="font-bold text-slate-900 text-sm">TaskFlow</span>
            </div>
          )}
          {collapsed && (
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto">
              <Zap size={14} className="text-white" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ${collapsed ? 'hidden' : ''}`}
          >
            <ChevronLeft size={14} />
          </button>
        </div>

        {collapsed ? (
          <div className="flex flex-col items-center py-4 gap-2">
            <button
              onClick={() => setCollapsed(false)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setView('dashboard')}
              className={`p-2 rounded-xl transition-colors ${view === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutDashboard size={18} />
            </button>
            <button
              onClick={() => setShowNewProject(true)}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-3 px-3">
            {/* Nav */}
            <button
              onClick={() => setView('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors mb-1 ${
                view === 'dashboard'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard size={16} />
              Dashboard
            </button>

            {/* Projects section */}
            <div className="mt-4">
              <div className="flex items-center justify-between px-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Projects
                  </span>
                  {urgentCount > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-red-500">
                      <AlertTriangle size={11} />
                      {urgentCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowNewProject(true)}
                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="New project"
                >
                  <Plus size={14} />
                </button>
              </div>

              {sortedProjects.length === 0 ? (
                <p className="px-3 text-xs text-slate-400 py-2">No projects yet</p>
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
          </div>
        )}
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 px-4 py-2">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setView('dashboard')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
              view === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="text-[10px] font-medium">Dashboard</span>
          </button>
          <button
            onClick={() => setView('dashboard')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
              view === 'project' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <FolderKanban size={20} />
            <span className="text-[10px] font-medium">Projects</span>
          </button>
          <button
            onClick={() => setShowNewProject(true)}
            className="flex flex-col items-center gap-1 p-2"
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center -mt-5 shadow-lg">
              <Plus size={20} className="text-white" />
            </div>
          </button>
        </div>
      </nav>

      {showNewProject && (
        <ProjectForm
          onSave={handleAddProject}
          onClose={() => setShowNewProject(false)}
        />
      )}
    </>
  );
}
