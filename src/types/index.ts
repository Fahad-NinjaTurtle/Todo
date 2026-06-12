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
  dueDate: string | null;
  progressNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  priority: Priority;
  status: ProjectStatus;
  deadline: string | null;
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

// Dev Log
export interface DevLogEntry {
  id: string;
  date: string;         // ISO date (YYYY-MM-DD)
  projectId: string | null;
  title: string;
  content: string;      // what I did today
  mood: 'great' | 'good' | 'okay' | 'rough';
  createdAt: string;
  updatedAt: string;
}

// Learnings
export interface Learning {
  id: string;
  title: string;
  content: string;
  tags: string[];       // e.g. ["React", "TypeScript"]
  source: string;       // book, article, video, colleague, etc.
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
}

// Pomodoro
export interface PomodoroSession {
  id: string;
  completedAt: string;
  duration: number;     // minutes (25 = work, 5/15 = break)
  type: 'work' | 'short_break' | 'long_break';
  projectId: string | null;
  label: string;
}

export interface PomodoroStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number; // days in a row
  longestStreak: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
}

export interface AppState {
  projects: Project[];
  activity: ActivityEntry[];
  devLog: DevLogEntry[];
  learnings: Learning[];
  pomodoroSessions: PomodoroSession[];
}

export interface FilterState {
  search: string;
  status: string;
  priority: string;
  dueDateFilter: 'all' | 'today' | 'this_week' | 'overdue';
  sortBy: 'deadline' | 'priority' | 'name' | 'created';
  sortOrder: 'asc' | 'desc';
}

export interface DashboardStats {
  totalProjects: number;
  completedProjects: number;
  pendingTasks: number;
  overdueTasks: number;
  todaysTasks: number;
  inProgressProjects: number;
}
