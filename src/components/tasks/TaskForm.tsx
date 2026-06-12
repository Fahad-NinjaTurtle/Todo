'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import { Task, Priority, TaskStatus } from '@/types';
import { PRIORITY_LABELS, TASK_STATUS_LABELS } from '@/lib/utils';

interface Props { task?: Task | null; onSave: (data: Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => void; onClose: () => void; }

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];
const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];
const input = 'w-full px-3 py-2 text-sm bg-raised border border-base rounded-xl text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';
const sel   = 'w-full px-3 py-2 text-sm bg-raised border border-base rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500';

export default function TaskForm({ task, onSave, onClose }: Props) {
  const [title, setTitle]               = useState(task?.title ?? '');
  const [description, setDescription]   = useState(task?.description ?? '');
  const [status, setStatus]             = useState<TaskStatus>(task?.status ?? 'todo');
  const [priority, setPriority]         = useState<Priority>(task?.priority ?? 'medium');
  const [dueDate, setDueDate]           = useState(task?.dueDate ?? '');
  const [progressNotes, setProgressNotes] = useState(task?.progressNotes ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), description: description.trim(), status, priority, dueDate: dueDate || null, progressNotes: progressNotes.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-base rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-base">
          <h2 className="font-semibold text-primary">{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="text-muted hover:text-secondary"><X size={17} /></button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Task Title <span className="text-red-400">*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Design homepage mockup" className={input} autoFocus required />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What needs to be done?" rows={2} className={`${input} resize-none`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)} className={sel}>
                  {STATUSES.map(s => <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className={sel}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={input} />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">What I have done</label>
              <textarea value={progressNotes} onChange={e => setProgressNotes(e.target.value)} placeholder="Progress updates, notes, blockers…" rows={3} className={`${input} resize-none`} />
            </div>
          </div>
          <div className="flex gap-3 px-5 py-4 border-t border-base">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-secondary bg-raised hover:bg-base border border-base rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={!title.trim()} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors disabled:opacity-40">
              {task ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
