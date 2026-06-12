'use client';
import { useState } from 'react';
import { ArrowLeft, Edit2, Trash2, Calendar, Building2, FileText } from 'lucide-react';
import { Project } from '@/types';
import { useApp } from '@/context/AppContext';
import { useToastContext } from '@/context/ToastContext';
import { PriorityBadge, ProjectStatusBadge } from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import ProjectForm from './ProjectForm';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import TaskList from '@/components/tasks/TaskList';
import { formatDate, projectProgress } from '@/lib/utils';

interface Props { project: Project; }

export default function ProjectDetail({ project }: Props) {
  const { updateProject, deleteProject, setView } = useApp();
  const { toast } = useToastContext();
  const [showEdit, setShowEdit]     = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const progress = projectProgress(project);

  const handleUpdate = (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) => {
    updateProject(project.id, data);
    setShowEdit(false);
    toast('Project updated');
  };
  const handleDelete = () => {
    deleteProject(project.id);
    setView('dashboard');
    toast('Project deleted', 'info');
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <button onClick={() => setView('dashboard')} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary mb-6 transition-colors group">
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          All Projects
        </button>

        <div className="bg-surface border border-base rounded-2xl p-6 mb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-primary mb-1">{project.name}</h1>
              {project.client && (
                <div className="flex items-center gap-1.5 text-sm text-muted mb-3">
                  <Building2 size={13} />{project.client}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <PriorityBadge priority={project.priority} />
                <ProjectStatusBadge status={project.status} />
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button onClick={() => setShowEdit(true)} className="p-2 text-muted hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-colors"><Edit2 size={15} /></button>
              <button onClick={() => setShowDelete(true)} className="p-2 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"><Trash2 size={15} /></button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-subtle">
            {project.deadline && (
              <div className="flex items-center gap-1.5 text-sm">
                <Calendar size={13} className="text-muted" />
                <span className="text-muted">Deadline:</span>
                <span className="text-secondary">{formatDate(project.deadline)}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-muted">Tasks:</span>
              <span className="text-secondary">{project.tasks.length}</span>
            </div>
          </div>
          {project.tasks.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted">Progress</span>
                <span className="text-xs font-medium text-secondary">{progress}%</span>
              </div>
              <ProgressBar value={progress} />
            </div>
          )}
          {project.notes && (
            <div className="mt-4 pt-4 border-t border-subtle">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                <FileText size={11} />Notes
              </div>
              <p className="text-sm text-secondary leading-relaxed whitespace-pre-line">{project.notes}</p>
            </div>
          )}
        </div>

        <div className="bg-surface border border-base rounded-2xl p-6">
          <TaskList project={project} />
        </div>
      </div>

      {showEdit   && <ProjectForm project={project} onSave={handleUpdate} onClose={() => setShowEdit(false)} />}
      {showDelete && <ConfirmDialog title="Delete project?" message={`"${project.name}" and all its tasks will be permanently deleted.`} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />}
    </div>
  );
}
