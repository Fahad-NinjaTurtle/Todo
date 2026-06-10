'use client';

import { useState } from 'react';
import { Edit2, Trash2, Calendar, ChevronDown, ChevronUp, CheckCircle2, Circle, Clock } from 'lucide-react';
import { Task } from '@/types';
import { PriorityBadge, TaskStatusBadge } from '@/components/ui/Badge';
import { formatDate, isOverdue, isDueToday } from '@/lib/utils';

interface Props {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onStatusToggle: () => void;
}

export default function TaskCard({ task, onEdit, onDelete, onStatusToggle }: Props) {
  const [expanded, setExpanded] = useState(false);
  const overdue = isOverdue(task.dueDate) && task.status !== 'done';
  const dueToday = isDueToday(task.dueDate) && task.status !== 'done';

  const StatusIcon = task.status === 'done' ? CheckCircle2 :
                     task.status === 'in_progress' ? Clock : Circle;

  return (
    <div className={`bg-white rounded-xl border transition-all ${
      task.status === 'done'
        ? 'border-slate-100 opacity-70'
        : overdue
        ? 'border-red-200 bg-red-50/30'
        : 'border-slate-200 hover:border-slate-300'
    }`}>
      <div className="px-4 py-3">
        {/* Top row */}
        <div className="flex items-start gap-3">
          <button
            onClick={onStatusToggle}
            className={`mt-0.5 flex-shrink-0 transition-colors ${
              task.status === 'done' ? 'text-emerald-500' :
              task.status === 'in_progress' ? 'text-indigo-500' : 'text-slate-300 hover:text-slate-400'
            }`}
            title={task.status === 'done' ? 'Mark as to-do' : 'Mark as done'}
          >
            <StatusIcon size={18} />
          </button>

          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium leading-snug ${
              task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'
            }`}>
              {task.title}
            </p>

            {task.description && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <PriorityBadge priority={task.priority} />
              <TaskStatusBadge status={task.status} />
              {task.dueDate && (
                <span className={`inline-flex items-center gap-1 text-xs ${
                  overdue ? 'text-red-600 font-medium' :
                  dueToday ? 'text-amber-600 font-medium' : 'text-slate-500'
                }`}>
                  <Calendar size={11} />
                  {dueToday ? 'Due today' : overdue ? `Overdue · ${formatDate(task.dueDate)}` : formatDate(task.dueDate)}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {(task.description || task.progressNotes) && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title={expanded ? 'Collapse' : 'Expand'}
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
            <button
              onClick={onEdit}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Edit task"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete task"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="mt-3 pl-7 space-y-2 border-t border-slate-100 pt-3">
            {task.description && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-0.5">Description</p>
                <p className="text-xs text-slate-700 leading-relaxed">{task.description}</p>
              </div>
            )}
            {task.progressNotes && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-0.5">What I have done</p>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{task.progressNotes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
