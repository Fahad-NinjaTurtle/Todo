import { format, isToday, isPast, isThisWeek, parseISO } from 'date-fns';
import { Priority, ProjectStatus, TaskStatus, Project, Task, DashboardStats } from '@/types';

// Generate a unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Format a date string for display
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return '—';
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy · h:mm a');
  } catch {
    return '—';
  }
}

// Check if a date is overdue (past and not today)
export function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  try {
    const date = parseISO(dateStr);
    return isPast(date) && !isToday(date);
  } catch {
    return false;
  }
}

export function isDueToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  try {
    return isToday(parseISO(dateStr));
  } catch {
    return false;
  }
}

export function isDueThisWeek(dateStr: string | null): boolean {
  if (!dateStr) return false;
  try {
    return isThisWeek(parseISO(dateStr));
  } catch {
    return false;
  }
}

// Priority display helpers
export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const PRIORITY_ORDER: Record<Priority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'bg-slate-100 text-slate-600 border-slate-200',
  medium: 'bg-blue-50 text-blue-700 border-blue-200',
  high: 'bg-amber-50 text-amber-700 border-amber-200',
  urgent: 'bg-red-50 text-red-700 border-red-200',
};

export const PRIORITY_DOT: Record<Priority, string> = {
  low: 'bg-slate-400',
  medium: 'bg-blue-500',
  high: 'bg-amber-500',
  urgent: 'bg-red-500',
};

// Status display helpers
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  waiting: 'Waiting',
  completed: 'Completed',
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  not_started: 'bg-slate-100 text-slate-600 border-slate-200',
  in_progress: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  waiting: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'bg-slate-100 text-slate-600 border-slate-200',
  in_progress: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  done: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

// Calculate dashboard stats from projects
export function computeStats(projects: Project[]): DashboardStats {
  const allTasks = projects.flatMap(p => p.tasks);
  const now = new Date().toISOString().split('T')[0];

  return {
    totalProjects: projects.length,
    completedProjects: projects.filter(p => p.status === 'completed').length,
    inProgressProjects: projects.filter(p => p.status === 'in_progress').length,
    pendingTasks: allTasks.filter(t => t.status !== 'done').length,
    overdueTasks: allTasks.filter(
      t => t.status !== 'done' && t.dueDate && t.dueDate < now
    ).length,
    todaysTasks: allTasks.filter(t => t.dueDate === now).length,
  };
}

// Sort projects by field
export function sortProjects(projects: Project[], sortBy: string, order: 'asc' | 'desc'): Project[] {
  return [...projects].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'deadline') {
      const aDate = a.deadline || '9999';
      const bDate = b.deadline || '9999';
      cmp = aDate.localeCompare(bDate);
    } else if (sortBy === 'priority') {
      cmp = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
    } else if (sortBy === 'name') {
      cmp = a.name.localeCompare(b.name);
    } else if (sortBy === 'created') {
      cmp = a.createdAt.localeCompare(b.createdAt);
    }
    return order === 'asc' ? cmp : -cmp;
  });
}

// Task completion percentage for a project
export function projectProgress(project: Project): number {
  if (project.tasks.length === 0) return 0;
  const done = project.tasks.filter(t => t.status === 'done').length;
  return Math.round((done / project.tasks.length) * 100);
}

// Today's ISO date string
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
