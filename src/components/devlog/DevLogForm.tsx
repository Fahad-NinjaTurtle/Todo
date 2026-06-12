'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import { DevLogEntry } from '@/types';
import { useApp } from '@/context/AppContext';
import { useToastContext } from '@/context/ToastContext';
import { todayISO } from '@/lib/utils';

interface Props { entry?: DevLogEntry; onClose: () => void; }

const MOODS: { value: DevLogEntry['mood']; label: string; emoji: string }[] = [
  { value: 'great', label: 'Great',  emoji: '⚡' },
  { value: 'good',  label: 'Good',   emoji: '😊' },
  { value: 'okay',  label: 'Okay',   emoji: '😐' },
  { value: 'rough', label: 'Rough',  emoji: '😤' },
];

const input    = 'w-full px-3 py-2 text-sm bg-raised border border-base rounded-xl text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500';
const selClass = 'w-full px-3 py-2 text-sm bg-raised border border-base rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500';

export default function DevLogForm({ entry, onClose }: Props) {
  const { state, addDevLog, updateDevLog } = useApp();
  const { toast } = useToastContext();

  const [date, setDate]         = useState(entry?.date ?? todayISO());
  const [projectId, setProjectId] = useState<string>(entry?.projectId ?? '');
  const [title, setTitle]       = useState(entry?.title ?? '');
  const [content, setContent]   = useState(entry?.content ?? '');
  const [mood, setMood]         = useState<DevLogEntry['mood']>(entry?.mood ?? 'good');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    const data = { date, projectId: projectId || null, title: title.trim(), content: content.trim(), mood };
    if (entry) {
      updateDevLog(entry.id, data);
      toast('Entry updated');
    } else {
      addDevLog(data);
      toast('Entry logged ✓');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-base rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-base">
          <h2 className="font-semibold text-primary">{entry ? 'Edit Log Entry' : 'Log Today\'s Work'}</h2>
          <button onClick={onClose} className="text-muted hover:text-secondary"><X size={17} /></button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-5 py-4 space-y-4">
            {/* Mood picker */}
            <div>
              <label className="block text-xs font-medium text-secondary mb-2">How did it go?</label>
              <div className="flex gap-2">
                {MOODS.map(m => (
                  <button key={m.value} type="button" onClick={() => setMood(m.value)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                      mood === m.value ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400' : 'border-base bg-raised text-muted hover:border-indigo-500/30'
                    }`}>
                    <span className="text-base">{m.emoji}</span>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className={input} />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Project (optional)</label>
                <select value={projectId} onChange={e => setProjectId(e.target.value)} className={selClass}>
                  <option value="">No project</option>
                  {state.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Title <span className="text-red-400">*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Finished authentication flow" className={input} autoFocus required />
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">What did you do? <span className="text-red-400">*</span></label>
              <textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder={"• Implemented JWT refresh token logic\n• Fixed the modal z-index bug\n• Reviewed PR #42 from teammate"}
                rows={6} className={`${input} resize-none`} required />
            </div>
          </div>
          <div className="flex gap-3 px-5 py-4 border-t border-base">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-secondary bg-raised hover:bg-base border border-base rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={!title.trim() || !content.trim()} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors disabled:opacity-40">
              {entry ? 'Save Changes' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
