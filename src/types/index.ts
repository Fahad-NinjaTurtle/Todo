// Core type definitions for TaskFlow

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type ProjectStatus = 'not_started' | 'in_progress' | 'waiting' | 'completed';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;    // ISO date string
  progressNotes: string;     // "What I have done"
  createdAt: string;         // ISO datetime string
  updatedAt: string;         // ISO datetime string
}

export interface Project {
  id: string;
  name: string;
  client: string;            // Client or department
  priority: Priority;
  status: ProjectStatus;
  deadline: string | null;   // ISO date string
  notes: string;
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
}

export interface ActivityEntry {
  id: string;
  type: 'project_created' | 'project_updated' | 'project_deleted' |
        'task_created' | 'task_updated' | 'task_deleted' | 'task_completed';
  message: string;
  projectId?: string;
  taskId?: string;
  timestamp: string;
}

export interface AppState {
  projects: Project[];
  activity: ActivityEntry[];
}

export interface FilterState {
  search: string;
  status: string;
  priority: string;
  dueDateFilter: 'all' | 'today' | 'this_week' | 'overdue';
  sortBy: 'deadline' | 'priority' | 'name' | 'created';
  sortOrder: 'asc' | 'desc';
}

// For the dashboard summary cards
export interface DashboardStats {
  totalProjects: number;
  completedProjects: number;
  pendingTasks: number;
  overdueTasks: number;
  todaysTasks: number;
  inProgressProjects: number;
}
