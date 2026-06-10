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

interface Props {
  project: Project;
}

export default function TaskList({ project }: Props) {
  const { addTask, updateTask, deleteTask } = useApp();
  const { toast } = useToastContext();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const tasks = project.tasks;

  // Apply filters
  const filtered = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  // Sort: overdue first, then by priority, then by due date
  const sorted = [...filtered].sort((a, b) => {
    const aOverdue = isOverdue(a.dueDate) && a.status !== 'done' ? 0 : 1;
    const bOverdue = isOverdue(b.dueDate) && b.status !== 'done' ? 0 : 1;
    if (aOverdue !== bOverdue) return aOverdue - bOverdue;
    const pOrder: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
    return (pOrder[b.priority] ?? 0) - (pOrder[a.priority] ?? 0);
  });

  const handleAddTask = (data: Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => {
    addTask(project.id, data);
    setShowForm(false);
    toast('Task added');
  };

  const handleUpdateTask = (data: Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => {
    if (!editingTask) return;
    updateTask(project.id, editingTask.id, data);
    setEditingTask(null);
    toast('Task updated');
  };

  const handleDeleteTask = () => {
    if (!deletingTaskId) return;
    deleteTask(project.id, deletingTaskId);
    setDeletingTaskId(null);
    toast('Task deleted', 'info');
  };

  const handleStatusToggle = (task: Task) => {
    const next: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    updateTask(project.id, task.id, { status: next });
    toast(next === 'done' ? '✓ Task marked done' : 'Task moved back to to-do');
  };

  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold text-slate-700">
            Tasks
            <span className="ml-2 text-xs font-normal text-slate-400">
              {todoCount} to do · {inProgressCount} in progress · {doneCount} done
            </span>
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-lg transition-colors ${
              showFilters ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal size={14} />
          </button>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
        >
          <Plus size={13} />
          Add Task
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-slate-50 rounded-xl">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            {(['todo', 'in_progress', 'done'] as TaskStatus[]).map(s => (
              <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Priorities</option>
            {(['low', 'medium', 'high', 'urgent'] as Priority[]).map(p => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </select>
          {(filterStatus !== 'all' || filterPriority !== 'all') && (
            <button
              onClick={() => { setFilterStatus('all'); setFilterPriority('all'); }}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Task list */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title={tasks.length === 0 ? 'No tasks yet' : 'No matching tasks'}
          description={tasks.length === 0 ? 'Break this project into tasks to track progress.' : 'Try adjusting the filters.'}
          action={
            tasks.length === 0 ? (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
              >
                Add first task
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {sorted.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => setEditingTask(task)}
              onDelete={() => setDeletingTaskId(task.id)}
              onStatusToggle={() => handleStatusToggle(task)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <TaskForm
          onSave={handleAddTask}
          onClose={() => setShowForm(false)}
        />
      )}
      {editingTask && (
        <TaskForm
          task={editingTask}
          onSave={handleUpdateTask}
          onClose={() => setEditingTask(null)}
        />
      )}
      {deletingTaskId && (
        <ConfirmDialog
          title="Delete task?"
          message="This will permanently remove the task and its progress notes."
          onConfirm={handleDeleteTask}
          onCancel={() => setDeletingTaskId(null)}
        />
      )}
    </div>
  );
}
