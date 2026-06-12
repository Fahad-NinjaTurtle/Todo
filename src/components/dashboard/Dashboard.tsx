'use client';
import { useState } from 'react';
import { FolderKanban, CheckCircle2, ListTodo, AlertCircle, CalendarClock, Plus, Search, SlidersHorizontal, ArrowUpDown, Download, Upload, Activity } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToastContext } from '@/context/ToastContext';
import { computeStats, sortProjects, formatDateTime, isOverdue } from '@/lib/utils';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectForm from '@/components/projects/ProjectForm';
import EmptyState from '@/components/ui/EmptyState';
import { Project } from '@/types';
import { exportData, importData } from '@/lib/storage';

export default function Dashboard() {
  const { state, filters, setFilters, addProject, selectProject, selectedProjectId, importState } = useApp();
  const { toast } = useToastContext();
  const [showNewProject, setShowNewProject] = useState(false);
  const [showFilters, setShowFilters]       = useState(false);

  const stats = computeStats(state.projects);

  const filteredProjects = state.projects.filter(p => {
    const q = filters.search.toLowerCase();
    if (q && !p.name.toLowerCase().includes(q) && !p.client.toLowerCase().includes(q)) return false;
    if (filters.status !== 'all' && p.status !== filters.status) return false;
    if (filters.priority !== 'all' && p.priority !== filters.priority) return false;
    if (filters.dueDateFilter === 'overdue' && (!isOverdue(p.deadline) || p.status === 'completed')) return false;
    return true;
  });
  const sorted = sortProjects(filteredProjects, filters.sortBy, filters.sortOrder);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importData(file);
      importState(imported);
      toast(`Imported ${imported.projects.length} projects`);
    } catch { toast('Import failed — check the file format', 'error'); }
    e.target.value = '';
  };

  const STAT_CARDS = [
    { label: 'Total Projects', value: stats.totalProjects,    icon: FolderKanban,  color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Completed',      value: stats.completedProjects, icon: CheckCircle2,  color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Pending Tasks',  value: stats.pendingTasks,      icon: ListTodo,      color: 'text-amber-400',  bg: 'bg-amber-500/10' },
    { label: 'Overdue',        value: stats.overdueTasks,      icon: AlertCircle,   color: 'text-red-400',    bg: 'bg-red-500/10' },
    { label: "Today's Tasks",  value: stats.todaysTasks,       icon: CalendarClock, color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  ];

  const sel = 'px-3 py-1.5 text-xs bg-surface border border-base rounded-lg text-secondary focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-primary">Dashboard</h1>
            <p className="text-sm text-muted mt-0.5">
              {state.projects.length === 0 ? 'Create your first project' : `${stats.inProgressProjects} project${stats.inProgressProjects !== 1 ? 's' : ''} in progress`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => exportData(state)} className="p-2 text-muted hover:text-secondary hover:bg-raised rounded-xl transition-colors" title="Export"><Download size={15} /></button>
            <label className="p-2 text-muted hover:text-secondary hover:bg-raised rounded-xl transition-colors cursor-pointer" title="Import">
              <Upload size={15} />
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button onClick={() => setShowNewProject(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-sm">
              <Plus size={14} />New Project
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {STAT_CARDS.map(c => (
            <div key={c.label} className="bg-surface rounded-2xl border border-base p-4">
              <div className={`w-8 h-8 ${c.bg} rounded-xl flex items-center justify-center mb-3`}>
                <c.icon size={15} className={c.color} />
              </div>
              <p className="text-2xl font-bold text-primary tabular-nums">{c.value}</p>
              <p className="text-[11px] text-muted mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Search & filter bar */}
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="relative flex-1 min-w-44">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input type="text" placeholder="Search projects…" value={filters.search} onChange={e => setFilters({ search: e.target.value })}
              className="w-full pl-8 pr-3 py-2 text-sm bg-surface border border-base rounded-xl text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm border rounded-xl transition-colors ${showFilters ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400' : 'border-base text-secondary hover:bg-raised'}`}>
            <SlidersHorizontal size={13} />Filters
          </button>
          <button onClick={() => setFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-base text-secondary rounded-xl hover:bg-raised transition-colors">
            <ArrowUpDown size={13} />{filters.sortOrder === 'asc' ? 'Asc' : 'Desc'}
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 mb-4 p-3 bg-raised rounded-xl border border-base">
            <select value={filters.status} onChange={e => setFilters({ status: e.target.value })} className={sel}>
              <option value="all">All Statuses</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting">Waiting</option>
              <option value="completed">Completed</option>
            </select>
            <select value={filters.priority} onChange={e => setFilters({ priority: e.target.value })} className={sel}>
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select value={filters.sortBy} onChange={e => setFilters({ sortBy: e.target.value as 'deadline'|'priority'|'name'|'created' })} className={sel}>
              <option value="deadline">By Deadline</option>
              <option value="priority">By Priority</option>
              <option value="name">By Name</option>
              <option value="created">By Created</option>
            </select>
            <select value={filters.dueDateFilter} onChange={e => setFilters({ dueDateFilter: e.target.value as 'all'|'overdue' })} className={sel}>
              <option value="all">All Deadlines</option>
              <option value="overdue">Overdue Only</option>
            </select>
            {(filters.status !== 'all' || filters.priority !== 'all' || filters.search || filters.dueDateFilter !== 'all') && (
              <button onClick={() => setFilters({ status:'all', priority:'all', search:'', dueDateFilter:'all' })} className="px-3 py-1.5 text-xs text-muted hover:text-secondary hover:bg-surface rounded-lg transition-colors">Clear all</button>
            )}
          </div>
        )}

        {/* Projects */}
        {state.projects.length === 0 ? (
          <EmptyState icon={FolderKanban} title="No projects yet" description="Create your first project and start tracking tasks."
            action={<button onClick={() => setShowNewProject(true)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl">Create a project</button>}
          />
        ) : sorted.length === 0 ? (
          <EmptyState icon={Search} title="No projects match" description="Try adjusting your filters." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {sorted.map(p => <ProjectCard key={p.id} project={p} onClick={() => selectProject(p.id)} isSelected={p.id === selectedProjectId} />)}
          </div>
        )}

        {/* Activity */}
        {state.activity.length > 0 && (
          <div className="bg-surface rounded-2xl border border-base p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={14} className="text-muted" />
              <h2 className="text-sm font-semibold text-primary">Recent Activity</h2>
            </div>
            <div className="space-y-3">
              {state.activity.slice(0, 8).map(e => (
                <div key={e.id} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/40 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm text-secondary">{e.message}</p>
                    <p className="text-[11px] text-muted mt-0.5">{formatDateTime(e.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {showNewProject && <ProjectForm onSave={d => { addProject(d); setShowNewProject(false); toast('Project created'); }} onClose={() => setShowNewProject(false)} />}
    </div>
  );
}
