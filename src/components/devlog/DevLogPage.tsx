'use client';
import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, BookOpen, Search, Calendar, Smile, Meh, Frown, Zap } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToastContext } from '@/context/ToastContext';
import { DevLogEntry } from '@/types';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { formatDate, formatDateTime, todayISO } from '@/lib/utils';
import DevLogForm from './DevLogForm';

const MOOD_ICON: Record<DevLogEntry['mood'], React.ReactNode> = {
  great: <Zap  size={14} className="text-yellow-400" />,
  good:  <Smile size={14} className="text-emerald-400" />,
  okay:  <Meh  size={14} className="text-blue-400" />,
  rough: <Frown size={14} className="text-red-400" />,
};
const MOOD_LABEL: Record<DevLogEntry['mood'], string> = {
  great: 'Great', good: 'Good', okay: 'Okay', rough: 'Rough',
};

export default function DevLogPage() {
  const { state, deleteDevLog } = useApp();
  const { toast } = useToastContext();
  const [showForm, setShowForm]       = useState(false);
  const [editing, setEditing]         = useState<DevLogEntry | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [search, setSearch]           = useState('');

  const entries = useMemo(() => {
    const q = search.toLowerCase();
    return state.devLog.filter(e =>
      !q || e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q)
    );
  }, [state.devLog, search]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, DevLogEntry[]>();
    entries.forEach(e => {
      const d = e.date;
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(e);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [entries]);

  const projectName = (id: string | null) =>
    id ? (state.projects.find(p => p.id === id)?.name ?? 'Unknown project') : null;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-primary">Dev Log</h1>
            <p className="text-sm text-muted mt-0.5">{state.devLog.length} entries · What did you ship today?</p>
          </div>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-sm">
            <Plus size={14} />Log Today
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input type="text" placeholder="Search log entries…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-surface border border-base rounded-xl text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        {state.devLog.length === 0 ? (
          <EmptyState icon={BookOpen} title="No log entries yet" description="Start documenting what you work on each day. It's a great habit." 
            action={<button onClick={() => setShowForm(true)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl">Write first entry</button>} />
        ) : grouped.length === 0 ? (
          <EmptyState icon={Search} title="No matching entries" description="Try a different search term." />
        ) : (
          <div className="space-y-8">
            {grouped.map(([date, dayEntries]) => (
              <div key={date}>
                {/* Date divider */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted uppercase tracking-widest">
                    <Calendar size={11} />
                    {date === todayISO() ? 'Today' : formatDate(date)}
                  </div>
                  <div className="flex-1 h-px bg-subtle" />
                </div>

                {/* Entries for this day */}
                <div className="space-y-3">
                  {dayEntries.map(entry => (
                    <div key={entry.id} className="bg-surface border border-base rounded-2xl p-5 group hover:border-indigo-500/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span title={MOOD_LABEL[entry.mood]}>{MOOD_ICON[entry.mood]}</span>
                            <h3 className="text-sm font-semibold text-primary">{entry.title}</h3>
                          </div>
                          {entry.projectId && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
                              {projectName(entry.projectId)}
                            </span>
                          )}
                          <p className="text-sm text-secondary leading-relaxed whitespace-pre-line">{entry.content}</p>
                          <p className="text-[11px] text-muted mt-2">{formatDateTime(entry.createdAt)}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => setEditing(entry)} className="p-1.5 text-muted hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"><Edit2 size={13} /></button>
                          <button onClick={() => setDeletingId(entry.id)} className="p-1.5 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm  && <DevLogForm onClose={() => setShowForm(false)} />}
      {editing   && <DevLogForm entry={editing} onClose={() => setEditing(null)} />}
      {deletingId && (
        <ConfirmDialog title="Delete log entry?" message="This entry will be permanently removed."
          onConfirm={() => { deleteDevLog(deletingId); setDeletingId(null); toast('Entry deleted', 'info'); }}
          onCancel={() => setDeletingId(null)} />
      )}
    </div>
  );
}
