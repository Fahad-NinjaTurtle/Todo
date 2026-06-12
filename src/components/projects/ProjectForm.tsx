'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import { Project, Priority, ProjectStatus } from '@/types';
import { PRIORITY_LABELS, PROJECT_STATUS_LABELS, todayISO } from '@/lib/utils';

interface Props { project?: Project | null; onSave: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) => void; onClose: () => void; }

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];
const STATUSES: ProjectStatus[] = ['not_started', 'in_progress', 'waiting', 'completed'];

const input = 'w-full px-3 py-2 text-sm bg-raised border border-base rounded-xl text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';
const select = 'w-full px-3 py-2 text-sm bg-raised border border-base rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500';

export default function ProjectForm({ project, onSave, onClose }: Props) {
  const [name, setName]         = useState(project?.name ?? '');
  const [client, setClient]     = useState(project?.client ?? '');
  const [priority, setPriority] = useState<Priority>(project?.priority ?? 'medium');
  const [status, setStatus]     = useState<ProjectStatus>(project?.status ?? 'not_started');
  const [deadline, setDeadline] = useState(project?.deadline ?? '');
  const [notes, setNotes]       = useState(project?.notes ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), client: client.trim(), priority, status, deadline: deadline || null, notes: notes.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-base rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-base">
          <h2 className="font-semibold text-primary">{project ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose} className="text-muted hover:text-secondary"><X size={17} /></button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Project Name <span className="text-red-400">*</span></label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Website Redesign" className={input} autoFocus required />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Client / Department</label>
              <input type="text" value={client} onChange={e => setClient(e.target.value)} placeholder="e.g. Marketing Dept" className={input} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className={select}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as ProjectStatus)} className={select}>
                  {STATUSES.map(s => <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Deadline</label>
              <input type="date" value={deadline} min={todayISO()} onChange={e => setDeadline(e.target.value)} className={input} />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any details, links, or context…" rows={3} className={`${input} resize-none`} />
            </div>
          </div>
          <div className="flex gap-3 px-5 py-4 border-t border-base">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-secondary bg-raised hover:bg-base border border-base rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={!name.trim()} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors disabled:opacity-40">
              {project ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
