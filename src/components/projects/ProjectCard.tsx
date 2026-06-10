'use client';

import { Calendar, ChevronRight } from 'lucide-react';
import { Project } from '@/types';
import { PriorityBadge, ProjectStatusBadge } from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import { formatDate, isOverdue, projectProgress, PRIORITY_DOT } from '@/lib/utils';

interface Props {
  project: Project;
  onClick: () => void;
  isSelected?: boolean;
  compact?: boolean;
}

export default function ProjectCard({ project, onClick, isSelected, compact }: Props) {
  const progress = projectProgress(project);
  const overdue = isOverdue(project.deadline) && project.status !== 'completed';
  const pendingTasks = project.tasks.filter(t => t.status !== 'done').length;

  if (compact) {
    // Sidebar compact view
    return (
      <button
        onClick={onClick}
        className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors group ${
          isSelected
            ? 'bg-indigo-50 text-indigo-700'
            : 'hover:bg-slate-50 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[project.priority]}`} />
          <span className="text-sm font-medium truncate flex-1">{project.name}</span>
          {pendingTasks > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-md shrink-0 ${
              isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
            }`}>
              {pendingTasks}
            </span>
          )}
        </div>
        {project.client && (
          <p className="text-xs text-slate-400 truncate mt-0.5 ml-4.5 pl-[18px]">{project.client}</p>
        )}
      </button>
    );
  }

  // Full card view for dashboard
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white rounded-2xl border p-5 transition-all hover:shadow-md group ${
        isSelected ? 'border-indigo-300 shadow-sm' : overdue ? 'border-red-200' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 truncate">{project.name}</h3>
          {project.client && (
            <p className="text-xs text-slate-500 truncate mt-0.5">{project.client}</p>
          )}
        </div>
        <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 shrink-0 mt-0.5 transition-colors" />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <PriorityBadge priority={project.priority} />
        <ProjectStatusBadge status={project.status} />
      </div>

      <ProgressBar value={progress} size="sm" showLabel />

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-500">
          {project.tasks.length === 0
            ? 'No tasks'
            : `${project.tasks.filter(t => t.status === 'done').length}/${project.tasks.length} tasks done`}
        </span>
        {project.deadline && (
          <span className={`inline-flex items-center gap-1 text-xs ${
            overdue ? 'text-red-600 font-medium' : 'text-slate-500'
          }`}>
            <Calendar size={11} />
            {overdue ? 'Overdue' : formatDate(project.deadline)}
          </span>
        )}
      </div>
    </button>
  );
}
