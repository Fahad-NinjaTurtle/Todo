'use client';

import { useState } from 'react';
import {
  FolderKanban, CheckCircle2, ListTodo, AlertCircle, CalendarClock,
  Plus, Search, SlidersHorizontal, ArrowUpDown, Download, Upload,
  Activity
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToastContext } from '@/context/ToastContext';
import { computeStats, sortProjects, formatDateTime, isOverdue } from '@/lib/utils';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectForm from '@/components/projects/ProjectForm';
import EmptyState from '@/components/ui/EmptyState';
import { Project, Priority, ProjectStatus } from '@/types';
import { exportData, importData } from '@/lib/storage';

export default function Dashboard() {
  const { state, filters, setFilters, addProject, selectProject, selectedProjectId, importState } = useApp();
  const { toast } = useToastContext();
  const [showNewProject, setShowNewProject] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const stats = computeStats(state.projects);

  // Filter & sort projects
  const filteredProjects = state.projects.filter(p => {
    const q = filters.search.toLowerCase();
    if (q && !p.name.toLowerCase().includes(q) && !p.client.toLowerCase().includes(q)) return false;
    if (filters.status !== 'all' && p.status !== filters.status) return false;
    if (filters.priority !== 'all' && p.priority !== filters.priority) return false;
    if (filters.dueDateFilter === 'overdue' && (!isOverdue(p.deadline) || p.status === 'completed')) return false;
    return true;
  });

  const sorted = sortProjects(filteredProjects, filters.sortBy, filters.sortOrder);

  const handleAddProject = (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) => {
    addProject(data);
    setShowNewProject(false);
    toast('Project created');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importData(file);
      importState(imported);
      toast(`Imported ${imported.projects.length} projects`);
    } catch (err) {
      toast('Import failed — check the file format', 'error');
    }
    e.target.value = '';
  };

  const STAT_CARDS = [
    { label: 'Total Projects', value: stats.totalProjects, icon: FolderKanban, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Completed', value: stats.completedProjects, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Tasks', value: stats.pendingTasks, icon: ListTodo, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Overdue Tasks', value: stats.overdueTasks, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: "Today's Tasks", value: stats.todaysTasks, icon: CalendarClock, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {state.projects.length === 0
                ? 'Create your first project to get started'
                : `${stats.inProgressProjects} project${stats.inProgressProjects !== 1 ? 's' : ''} in progress`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportData(state)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              title="Export data"
            >
              <Download size={16} />
            </button>
            <label
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Import data"
            >
              <Upload size={16} />
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button
              onClick={() => setShowNewProject(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
            >
              <Plus size={15} />
              New Project
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {STAT_CARDS.map(card => (
            <div key={card.label} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className={`w-8 h-8 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                <card.icon size={16} className={card.color} />
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{card.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Search & filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects…"
              value={filters.search}
              onChange={e => setFilters({ search: e.target.value })}
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm border rounded-xl transition-colors ${
              showFilters ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal size={14} />
            Filters
          </button>
          <button
            onClick={() => setFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <ArrowUpDown size={14} />
            {filters.sortOrder === 'asc' ? 'Asc' : 'Desc'}
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 mb-4 p-3 bg-slate-50 rounded-xl">
            <select
              value={filters.status}
              onChange={e => setFilters({ status: e.target.value })}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting">Waiting</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={filters.priority}
              onChange={e => setFilters({ priority: e.target.value })}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={filters.sortBy}
              onChange={e => setFilters({ sortBy: e.target.value as 'deadline' | 'priority' | 'name' | 'created' })}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="deadline">Sort by Deadline</option>
              <option value="priority">Sort by Priority</option>
              <option value="name">Sort by Name</option>
              <option value="created">Sort by Created</option>
            </select>
            <select
              value={filters.dueDateFilter}
              onChange={e => setFilters({ dueDateFilter: e.target.value as 'all' | 'today' | 'this_week' | 'overdue' })}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Deadlines</option>
              <option value="overdue">Overdue Only</option>
            </select>
            {(filters.status !== 'all' || filters.priority !== 'all' || filters.search || filters.dueDateFilter !== 'all') && (
              <button
                onClick={() => setFilters({ status: 'all', priority: 'all', search: '', dueDateFilter: 'all' })}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Projects grid */}
        {state.projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create your first project and start tracking tasks."
            action={
              <button
                onClick={() => setShowNewProject(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
              >
                Create a project
              </button>
            }
          />
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No projects match"
            description="Try adjusting your filters or search query."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {sorted.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => selectProject(project.id)}
                isSelected={project.id === selectedProjectId}
              />
            ))}
          </div>
        )}

        {/* Recent Activity */}
        {state.activity.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={15} className="text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700">Recent Activity</h2>
            </div>
            <div className="space-y-3">
              {state.activity.slice(0, 8).map(entry => (
                <div key={entry.id} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm text-slate-700">{entry.message}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(entry.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showNewProject && (
        <ProjectForm
          onSave={handleAddProject}
          onClose={() => setShowNewProject(false)}
        />
      )}
    </div>
  );
}
