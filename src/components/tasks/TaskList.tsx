'use client';
import { useState } from 'react';
import { Plus, ListTodo, SlidersHorizontal } from 'lucide-react';
import { Task, Project, TaskStatus, Priority } from '@/types';
import { useApp } from '@/context/AppContext';
import { useToastContext } from '@/context/ToastContext';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { TASK_STATUS_LABELS, PRIORITY_LABELS, isOverdue } from '@/lib/utils';

interface Props { project: Project; }

export default function TaskList({ project }: Props) {
  const { addTask, updateTask, deleteTask } = useApp();
  const { toast } = useToastContext();
  const [showForm, setShowForm]           = useState(false);
  const [editingTask, setEditingTask]     = useState<Task | null>(null);
  const [deletingId, setDeletingId]       = useState<string | null>(null);
  const [filterStatus, setFilterStatus]   = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showFilters, setShowFilters]     = useState(false);

  const filtered = project.tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });
  const sorted = [...filtered].sort((a, b) => {
    const aOvd = isOverdue(a.dueDate) && a.status !== 'done' ? 0 : 1;
    const bOvd = isOverdue(b.dueDate) && b.status !== 'done' ? 0 : 1;
    if (aOvd !== bOvd) return aOvd - bOvd;
    const p: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
    return (p[b.priority] ?? 0) - (p[a.priority] ?? 0);
  });

  const todoCount = project.tasks.filter(t => t.status === 'todo').length;
  const inProgressCount = project.tasks.filter(t => t.status === 'in_progress').length;
  const doneCount = project.tasks.filter(t => t.status === 'done').length;

  const sel = 'px-3 py-1.5 text-xs bg-surface border border-base rounded-lg text-secondary focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-primary">
            Tasks
            <span className="ml-2 text-xs font-normal text-muted">{todoCount} todo · {inProgressCount} active · {doneCount} done</span>
          </h3>
          <button onClick={() => setShowFilters(!showFilters)} className={`p-1.5 rounded-lg transition-colors ${showFilters ? 'bg-indigo-500/10 text-indigo-400' : 'text-muted hover:text-secondary hover:bg-raised'}`}>
            <SlidersHorizontal size={13} />
          </button>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors">
          <Plus size={12} />Add Task
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-raised rounded-xl border border-base">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={sel}>
            <option value="all">All Statuses</option>
            {(['todo','in_progress','done'] as TaskStatus[]).map(s => <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className={sel}>
            <option value="all">All Priorities</option>
            {(['low','medium','high','urgent'] as Priority[]).map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
          </select>
          {(filterStatus !== 'all' || filterPriority !== 'all') && (
            <button onClick={() => { setFilterStatus('all'); setFilterPriority('all'); }} className="px-3 py-1.5 text-xs text-muted hover:text-secondary hover:bg-surface rounded-lg transition-colors">Clear</button>
          )}
        </div>
      )}

      {sorted.length === 0 ? (
        <EmptyState icon={ListTodo} title={project.tasks.length === 0 ? 'No tasks yet' : 'No matching tasks'} description={project.tasks.length === 0 ? 'Break this project into tasks to track progress.' : 'Try adjusting the filters.'}
          action={project.tasks.length === 0 ? <button onClick={() => setShowForm(true)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl">Add first task</button> : undefined}
        />
      ) : (
        <div className="space-y-2">
          {sorted.map(task => (
            <TaskCard key={task.id} task={task} onEdit={() => setEditingTask(task)} onDelete={() => setDeletingId(task.id)}
              onStatusToggle={() => {
                const next: TaskStatus = task.status === 'done' ? 'todo' : 'done';
                updateTask(project.id, task.id, { status: next });
                toast(next === 'done' ? '✓ Task marked done' : 'Task moved to to-do');
              }}
            />
          ))}
        </div>
      )}

      {showForm    && <TaskForm onSave={d => { addTask(project.id, d); setShowForm(false); toast('Task added'); }} onClose={() => setShowForm(false)} />}
      {editingTask && <TaskForm task={editingTask} onSave={d => { updateTask(project.id, editingTask.id, d); setEditingTask(null); toast('Task updated'); }} onClose={() => setEditingTask(null)} />}
      {deletingId  && <ConfirmDialog title="Delete task?" message="This will permanently remove the task." onConfirm={() => { deleteTask(project.id, deletingId); setDeletingId(null); toast('Task deleted','info'); }} onCancel={() => setDeletingId(null)} />}
    </div>
  );
}
