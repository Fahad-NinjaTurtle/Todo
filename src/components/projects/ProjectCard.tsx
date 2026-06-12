'use client';
import { Calendar, ChevronRight } from 'lucide-react';
import { Project } from '@/types';
import { PriorityBadge, ProjectStatusBadge } from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import { formatDate, isOverdue, projectProgress, PRIORITY_DOT } from '@/lib/utils';

interface Props { project: Project; onClick: () => void; isSelected?: boolean; compact?: boolean; }

export default function ProjectCard({ project, onClick, isSelected, compact }: Props) {
  const progress = projectProgress(project);
  const overdue  = isOverdue(project.deadline) && project.status !== 'completed';
  const pending  = project.tasks.filter(t => t.status !== 'done').length;

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`w-full text-left px-2.5 py-2 rounded-xl transition-colors group ${
          isSelected ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-raised text-secondary hover:text-primary'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[project.priority]}`} />
          <span className="text-xs font-medium truncate flex-1">{project.name}</span>
          {pending > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md shrink-0 ${isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-raised text-muted'}`}>
              {pending}
            </span>
          )}
        </div>
        {project.client && <p className="text-[10px] text-muted truncate mt-0.5 pl-3.5">{project.client}</p>}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-surface rounded-2xl border p-5 transition-all hover:shadow-lg group ${
        isSelected ? 'border-indigo-500/40' : overdue ? 'border-red-500/30' : 'border-base hover:border-indigo-500/30'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-primary truncate">{project.name}</h3>
          {project.client && <p className="text-xs text-muted truncate mt-0.5">{project.client}</p>}
        </div>
        <ChevronRight size={15} className="text-muted group-hover:text-indigo-400 shrink-0 mt-0.5 transition-colors" />
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <PriorityBadge priority={project.priority} />
        <ProjectStatusBadge status={project.status} />
      </div>
      <ProgressBar value={progress} size="sm" showLabel />
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-subtle">
        <span className="text-xs text-muted">
          {project.tasks.length === 0 ? 'No tasks' : `${project.tasks.filter(t => t.status === 'done').length}/${project.tasks.length} done`}
        </span>
        {project.deadline && (
          <span className={`inline-flex items-center gap-1 text-xs ${overdue ? 'text-red-400 font-medium' : 'text-muted'}`}>
            <Calendar size={10} />
            {overdue ? 'Overdue' : formatDate(project.deadline)}
          </span>
        )}
      </div>
    </button>
  );
}
