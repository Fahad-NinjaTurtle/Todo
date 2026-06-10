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

interface Props {
  project: Project;
}

export default function ProjectDetail({ project }: Props) {
  const { updateProject, deleteProject, setView } = useApp();
  const { toast } = useToastContext();
  const [showEdit, setShowEdit] = useState(false);
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
        {/* Back */}
        <button
          onClick={() => setView('dashboard')}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors group"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          All Projects
        </button>

        {/* Project header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-900 mb-1">{project.name}</h1>
              {project.client && (
                <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-3">
                  <Building2 size={14} />
                  {project.client}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <PriorityBadge priority={project.priority} />
                <ProjectStatusBadge status={project.status} />
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setShowEdit(true)}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                title="Edit project"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => setShowDelete(true)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                title="Delete project"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-100">
            {project.deadline && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Calendar size={14} className="text-slate-400" />
                <span className="text-slate-500">Deadline:</span>
                {formatDate(project.deadline)}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <span className="text-slate-500">Tasks:</span>
              {project.tasks.length}
            </div>
          </div>

          {/* Progress */}
          {project.tasks.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-500">Progress</span>
                <span className="text-xs font-medium text-slate-700">{progress}%</span>
              </div>
              <ProgressBar value={progress} />
            </div>
          )}

          {/* Notes */}
          {project.notes && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1.5">
                <FileText size={12} />
                Notes
              </div>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{project.notes}</p>
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <TaskList project={project} />
        </div>
      </div>

      {/* Modals */}
      {showEdit && (
        <ProjectForm
          project={project}
          onSave={handleUpdate}
          onClose={() => setShowEdit(false)}
        />
      )}
      {showDelete && (
        <ConfirmDialog
          title="Delete project?"
          message={`"${project.name}" and all its tasks will be permanently deleted.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}
