'use client';
import { useState } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { Learning } from '@/types';
import { useApp } from '@/context/AppContext';
import { useToastContext } from '@/context/ToastContext';

interface Props { learning?: Learning; onClose: () => void; }

const input    = 'w-full px-3 py-2 text-sm bg-raised border border-base rounded-xl text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500';
const selClass = 'w-full px-3 py-2 text-sm bg-raised border border-base rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500';

export default function LearningForm({ learning, onClose }: Props) {
  const { state, addLearning, updateLearning } = useApp();
  const { toast } = useToastContext();

  const [title, setTitle]       = useState(learning?.title ?? '');
  const [content, setContent]   = useState(learning?.content ?? '');
  const [source, setSource]     = useState(learning?.source ?? '');
  const [projectId, setProjectId] = useState<string>(learning?.projectId ?? '');
  const [tags, setTags]         = useState<string[]>(learning?.tags ?? []);
  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };
  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    const data = { title: title.trim(), content: content.trim(), source: source.trim(), projectId: projectId || null, tags };
    if (learning) {
      updateLearning(learning.id, data);
      toast('Learning updated');
    } else {
      addLearning(data);
      toast('Learning saved ✓');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-base rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-base">
          <h2 className="font-semibold text-primary">{learning ? 'Edit Learning' : 'Add Learning'}</h2>
          <button onClick={onClose} className="text-muted hover:text-secondary"><X size={17} /></button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">What did you learn? <span className="text-red-400">*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. React useCallback prevents unnecessary re-renders" className={input} autoFocus required />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Details / Notes <span className="text-red-400">*</span></label>
              <textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder={"Explain it in your own words...\n\nuseCallback memoizes a function so it keeps the same reference between renders unless its dependencies change. Useful when passing callbacks to child components wrapped in React.memo."}
                rows={6} className={`${input} resize-none`} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Source</label>
                <input type="text" value={source} onChange={e => setSource(e.target.value)} placeholder="Article, book, video…" className={input} />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Project (optional)</label>
                <select value={projectId} onChange={e => setProjectId(e.target.value)} className={selClass}>
                  <option value="">No project</option>
                  {state.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            {/* Tags */}
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Tags</label>
              <div className="flex gap-2">
                <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="react, typescript, patterns…" className={`${input} flex-1`} />
                <button type="button" onClick={addTag} className="px-3 py-2 bg-raised border border-base rounded-xl text-muted hover:text-secondary transition-colors"><Plus size={14} /></button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Tag size={9} />#{t}
                      <button type="button" onClick={() => removeTag(t)} className="ml-0.5 hover:text-red-400 text-indigo-300">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 px-5 py-4 border-t border-base">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-secondary bg-raised hover:bg-base border border-base rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={!title.trim() || !content.trim()} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors disabled:opacity-40">
              {learning ? 'Save Changes' : 'Save Learning'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
