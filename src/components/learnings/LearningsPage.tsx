'use client';
import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, GraduationCap, Search, Tag, ExternalLink, BookOpen } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToastContext } from '@/context/ToastContext';
import { Learning } from '@/types';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import LearningForm from './LearningForm';

export default function LearningsPage() {
  const { state, deleteLearning } = useApp();
  const { toast } = useToastContext();
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState<Learning | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [activeTag, setActiveTag]   = useState<string | null>(null);

  // All unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    state.learnings.forEach(l => l.tags.forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [state.learnings]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return state.learnings.filter(l => {
      if (q && !l.title.toLowerCase().includes(q) && !l.content.toLowerCase().includes(q) && !l.tags.some(t => t.toLowerCase().includes(q))) return false;
      if (activeTag && !l.tags.includes(activeTag)) return false;
      return true;
    });
  }, [state.learnings, search, activeTag]);

  const projectName = (id: string | null) =>
    id ? (state.projects.find(p => p.id === id)?.name ?? 'Unknown') : null;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-primary">Learnings</h1>
            <p className="text-sm text-muted mt-0.5">{state.learnings.length} notes · Your personal knowledge base</p>
          </div>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-sm">
            <Plus size={14} />Add Learning
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input type="text" placeholder="Search learnings…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-surface border border-base rounded-xl text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        {/* Tag filter pills */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            <button onClick={() => setActiveTag(null)} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${!activeTag ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-raised text-muted border border-base hover:text-secondary'}`}>
              All
            </button>
            {allTags.map(tag => (
              <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${activeTag === tag ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-raised text-muted border border-base hover:text-secondary'}`}>
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Entries */}
        {state.learnings.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No learnings yet" description="Capture things you learn — from articles, colleagues, debugging sessions, or anywhere else."
            action={<button onClick={() => setShowForm(true)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl">Add first learning</button>} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Search} title="Nothing matches" description="Try a different search or tag." />
        ) : (
          <div className="space-y-4">
            {filtered.map(learning => (
              <div key={learning.id} className="bg-surface border border-base rounded-2xl p-5 group hover:border-indigo-500/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-start gap-2 mb-2">
                      <BookOpen size={15} className="text-indigo-400 shrink-0 mt-0.5" />
                      <h3 className="text-sm font-semibold text-primary leading-snug">{learning.title}</h3>
                    </div>

                    {/* Content */}
                    <p className="text-sm text-secondary leading-relaxed whitespace-pre-line mb-3">{learning.content}</p>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Tags */}
                      {learning.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {learning.tags.map(tag => (
                            <button key={tag} onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors">
                              <Tag size={9} />#{tag}
                            </button>
                          ))}
                        </div>
                      )}
                      {learning.source && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                          <ExternalLink size={10} />{learning.source}
                        </span>
                      )}
                      {learning.projectId && (
                        <span className="text-[11px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                          {projectName(learning.projectId)}
                        </span>
                      )}
                      <span className="text-[11px] text-muted ml-auto">{formatDate(learning.createdAt.split('T')[0])}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => setEditing(learning)} className="p-1.5 text-muted hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"><Edit2 size={13} /></button>
                    <button onClick={() => setDeletingId(learning.id)} className="p-1.5 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm  && <LearningForm onClose={() => setShowForm(false)} />}
      {editing   && <LearningForm learning={editing} onClose={() => setEditing(null)} />}
      {deletingId && (
        <ConfirmDialog title="Delete learning?" message="This note will be permanently removed."
          onConfirm={() => { deleteLearning(deletingId); setDeletingId(null); toast('Learning deleted', 'info'); }}
          onCancel={() => setDeletingId(null)} />
      )}
    </div>
  );
}
