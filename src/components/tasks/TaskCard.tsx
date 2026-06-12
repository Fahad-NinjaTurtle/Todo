'use client';
import { useState } from 'react';
import { Edit2, Trash2, Calendar, ChevronDown, ChevronUp, CheckCircle2, Circle, Clock } from 'lucide-react';
import { Task } from '@/types';
import { PriorityBadge, TaskStatusBadge } from '@/components/ui/Badge';
import { formatDate, isOverdue, isDueToday } from '@/lib/utils';

interface Props { task: Task; onEdit: () => void; onDelete: () => void; onStatusToggle: () => void; }

export default function TaskCard({ task, onEdit, onDelete, onStatusToggle }: Props) {
  const [expanded, setExpanded] = useState(false);
  const overdue   = isOverdue(task.dueDate) && task.status !== 'done';
  const dueToday  = isDueToday(task.dueDate) && task.status !== 'done';
  const StatusIcon = task.status === 'done' ? CheckCircle2 : task.status === 'in_progress' ? Clock : Circle;

  return (
    <div className={`bg-surface rounded-xl border transition-all ${
      task.status === 'done' ? 'border-base opacity-60' :
      overdue ? 'border-red-500/30 bg-red-500/5' : 'border-base hover:border-indigo-500/30'
    }`}>
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          <button
            onClick={onStatusToggle}
            className={`mt-0.5 shrink-0 transition-colors ${
              task.status === 'done' ? 'text-emerald-500' :
              task.status === 'in_progress' ? 'text-indigo-400' : 'text-muted hover:text-secondary'
            }`}
          >
            <StatusIcon size={17} />
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium leading-snug ${task.status === 'done' ? 'line-through text-muted' : 'text-primary'}`}>
              {task.title}
            </p>
            {task.description && <p className="text-xs text-muted mt-0.5 line-clamp-1">{task.description}</p>}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <PriorityBadge priority={task.priority} />
              <TaskStatusBadge status={task.status} />
              {task.dueDate && (
                <span className={`inline-flex items-center gap-1 text-xs ${overdue ? 'text-red-400 font-medium' : dueToday ? 'text-amber-400 font-medium' : 'text-muted'}`}>
                  <Calendar size={10} />
                  {dueToday ? 'Today' : overdue ? `Overdue · ${formatDate(task.dueDate)}` : formatDate(task.dueDate)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {(task.description || task.progressNotes) && (
              <button onClick={() => setExpanded(!expanded)} className="p-1.5 text-muted hover:text-secondary hover:bg-raised rounded-lg transition-colors">
                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            )}
            <button onClick={onEdit} className="p-1.5 text-muted hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"><Edit2 size={13} /></button>
            <button onClick={onDelete} className="p-1.5 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={13} /></button>
          </div>
        </div>
        {expanded && (task.description || task.progressNotes) && (
          <div className="mt-3 pl-7 space-y-2 border-t border-subtle pt-3">
            {task.description && (
              <div>
                <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Description</p>
                <p className="text-xs text-secondary leading-relaxed">{task.description}</p>
              </div>
            )}
            {task.progressNotes && (
              <div>
                <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Progress</p>
                <p className="text-xs text-secondary leading-relaxed whitespace-pre-line">{task.progressNotes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
