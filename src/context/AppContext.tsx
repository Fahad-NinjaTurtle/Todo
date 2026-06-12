'use client';

import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { Project, Task, AppState, FilterState, DevLogEntry, Learning, PomodoroSession } from '@/types';
import { loadState, saveState, createActivity } from '@/lib/storage';
import { generateId } from '@/lib/utils';

type View = 'dashboard' | 'project' | 'devlog' | 'learnings' | 'pomodoro';

interface AppContextValue {
  state: AppState;
  filters: FilterState;
  selectedProjectId: string | null;
  view: View;
  hydrated: boolean;

  addProject: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) => void;
  updateProject: (id: string, data: Partial<Omit<Project, 'id' | 'createdAt' | 'tasks'>>) => void;
  deleteProject: (id: string) => void;

  addTask: (projectId: string, data: Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (projectId: string, taskId: string, data: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>>) => void;
  deleteTask: (projectId: string, taskId: string) => void;

  addDevLog: (data: Omit<DevLogEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDevLog: (id: string, data: Partial<Omit<DevLogEntry, 'id' | 'createdAt'>>) => void;
  deleteDevLog: (id: string) => void;

  addLearning: (data: Omit<Learning, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateLearning: (id: string, data: Partial<Omit<Learning, 'id' | 'createdAt'>>) => void;
  deleteLearning: (id: string) => void;

  addPomodoroSession: (data: Omit<PomodoroSession, 'id'>) => void;

  selectProject: (id: string | null) => void;
  setView: (view: View) => void;
  setFilters: (f: Partial<FilterState>) => void;
  resetFilters: () => void;
  importState: (s: AppState) => void;
}

type Action =
  | { type: 'HYDRATE'; payload: AppState }
  | { type: 'IMPORT'; payload: AppState }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; id: string; data: Partial<Project> }
  | { type: 'DELETE_PROJECT'; id: string }
  | { type: 'ADD_TASK'; projectId: string; task: Task }
  | { type: 'UPDATE_TASK'; projectId: string; taskId: string; data: Partial<Task> }
  | { type: 'DELETE_TASK'; projectId: string; taskId: string }
  | { type: 'ADD_DEVLOG'; payload: DevLogEntry }
  | { type: 'UPDATE_DEVLOG'; id: string; data: Partial<DevLogEntry> }
  | { type: 'DELETE_DEVLOG'; id: string }
  | { type: 'ADD_LEARNING'; payload: Learning }
  | { type: 'UPDATE_LEARNING'; id: string; data: Partial<Learning> }
  | { type: 'DELETE_LEARNING'; id: string }
  | { type: 'ADD_POMODORO'; payload: PomodoroSession };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
    case 'IMPORT':
      return action.payload;

    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [...state.projects, action.payload],
        activity: [createActivity('project_created', `Project "${action.payload.name}" created`), ...state.activity].slice(0, 50),
      };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => p.id === action.id ? { ...p, ...action.data, updatedAt: new Date().toISOString() } : p),
        activity: [createActivity('project_updated', `Project "${state.projects.find(p => p.id === action.id)?.name}" updated`, action.id), ...state.activity].slice(0, 50),
      };
    case 'DELETE_PROJECT': {
      const proj = state.projects.find(p => p.id === action.id);
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.id),
        activity: [createActivity('project_deleted', `Project "${proj?.name}" deleted`), ...state.activity].slice(0, 50),
      };
    }
    case 'ADD_TASK':
      return {
        ...state,
        projects: state.projects.map(p => p.id === action.projectId ? { ...p, tasks: [...p.tasks, action.task] } : p),
        activity: [createActivity('task_created', `Task "${action.task.title}" added`, action.projectId, action.task.id), ...state.activity].slice(0, 50),
      };
    case 'UPDATE_TASK': {
      let activityType: 'task_updated' | 'task_completed' = 'task_updated';
      let msg = '';
      const newProjects = state.projects.map(p => {
        if (p.id !== action.projectId) return p;
        return {
          ...p, tasks: p.tasks.map(t => {
            if (t.id !== action.taskId) return t;
            if (action.data.status === 'done' && t.status !== 'done') { activityType = 'task_completed'; msg = `Task "${t.title}" marked as done`; }
            else { msg = `Task "${t.title}" updated`; }
            return { ...t, ...action.data, updatedAt: new Date().toISOString() };
          }),
        };
      });
      return { ...state, projects: newProjects, activity: [createActivity(activityType, msg, action.projectId, action.taskId), ...state.activity].slice(0, 50) };
    }
    case 'DELETE_TASK': {
      let taskName = '';
      return {
        ...state,
        projects: state.projects.map(p => {
          if (p.id !== action.projectId) return p;
          taskName = p.tasks.find(t => t.id === action.taskId)?.title ?? 'Task';
          return { ...p, tasks: p.tasks.filter(t => t.id !== action.taskId) };
        }),
        activity: [createActivity('task_deleted', `Task "${taskName}" deleted`, action.projectId), ...state.activity].slice(0, 50),
      };
    }

    case 'ADD_DEVLOG':
      return { ...state, devLog: [action.payload, ...state.devLog] };
    case 'UPDATE_DEVLOG':
      return { ...state, devLog: state.devLog.map(e => e.id === action.id ? { ...e, ...action.data, updatedAt: new Date().toISOString() } : e) };
    case 'DELETE_DEVLOG':
      return { ...state, devLog: state.devLog.filter(e => e.id !== action.id) };

    case 'ADD_LEARNING':
      return { ...state, learnings: [action.payload, ...state.learnings] };
    case 'UPDATE_LEARNING':
      return { ...state, learnings: state.learnings.map(l => l.id === action.id ? { ...l, ...action.data, updatedAt: new Date().toISOString() } : l) };
    case 'DELETE_LEARNING':
      return { ...state, learnings: state.learnings.filter(l => l.id !== action.id) };

    case 'ADD_POMODORO':
      return { ...state, pomodoroSessions: [action.payload, ...state.pomodoroSessions] };

    default:
      return state;
  }
}

const DEFAULT_FILTERS: FilterState = {
  search: '', status: 'all', priority: 'all', dueDateFilter: 'all', sortBy: 'deadline', sortOrder: 'asc',
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { projects: [], activity: [], devLog: [], learnings: [], pomodoroSessions: [] });
  const [filters, setFiltersState] = React.useState<FilterState>(DEFAULT_FILTERS);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
  const [view, setViewState] = React.useState<View>('dashboard');
  const [hydrated, setHydrated] = React.useState(false);

  useEffect(() => {
    const saved = loadState();
    dispatch({ type: 'HYDRATE', payload: saved });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  const addProject = useCallback((data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) => {
    const now = new Date().toISOString();
    dispatch({ type: 'ADD_PROJECT', payload: { ...data, id: generateId(), tasks: [], createdAt: now, updatedAt: now } });
  }, []);
  const updateProject = useCallback((id: string, data: Partial<Omit<Project, 'id' | 'createdAt' | 'tasks'>>) => { dispatch({ type: 'UPDATE_PROJECT', id, data }); }, []);
  const deleteProject = useCallback((id: string) => { dispatch({ type: 'DELETE_PROJECT', id }); }, []);

  const addTask = useCallback((projectId: string, data: Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    dispatch({ type: 'ADD_TASK', projectId, task: { ...data, id: generateId(), projectId, createdAt: now, updatedAt: now } });
  }, []);
  const updateTask = useCallback((projectId: string, taskId: string, data: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>>) => { dispatch({ type: 'UPDATE_TASK', projectId, taskId, data }); }, []);
  const deleteTask = useCallback((projectId: string, taskId: string) => { dispatch({ type: 'DELETE_TASK', projectId, taskId }); }, []);

  const addDevLog = useCallback((data: Omit<DevLogEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    dispatch({ type: 'ADD_DEVLOG', payload: { ...data, id: generateId(), createdAt: now, updatedAt: now } });
  }, []);
  const updateDevLog = useCallback((id: string, data: Partial<Omit<DevLogEntry, 'id' | 'createdAt'>>) => { dispatch({ type: 'UPDATE_DEVLOG', id, data }); }, []);
  const deleteDevLog = useCallback((id: string) => { dispatch({ type: 'DELETE_DEVLOG', id }); }, []);

  const addLearning = useCallback((data: Omit<Learning, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    dispatch({ type: 'ADD_LEARNING', payload: { ...data, id: generateId(), createdAt: now, updatedAt: now } });
  }, []);
  const updateLearning = useCallback((id: string, data: Partial<Omit<Learning, 'id' | 'createdAt'>>) => { dispatch({ type: 'UPDATE_LEARNING', id, data }); }, []);
  const deleteLearning = useCallback((id: string) => { dispatch({ type: 'DELETE_LEARNING', id }); }, []);

  const addPomodoroSession = useCallback((data: Omit<PomodoroSession, 'id'>) => {
    dispatch({ type: 'ADD_POMODORO', payload: { ...data, id: generateId() } });
  }, []);

  const selectProject = useCallback((id: string | null) => {
    setSelectedProjectId(id);
    setViewState(id ? 'project' : 'dashboard');
  }, []);
  const setView = useCallback((v: View) => {
    setViewState(v);
    if (v !== 'project') setSelectedProjectId(null);
  }, []);
  const setFilters = useCallback((f: Partial<FilterState>) => { setFiltersState(prev => ({ ...prev, ...f })); }, []);
  const resetFilters = useCallback(() => setFiltersState(DEFAULT_FILTERS), []);
  const importState = useCallback((s: AppState) => { dispatch({ type: 'IMPORT', payload: s }); }, []);

  return (
    <AppContext.Provider value={{
      state, filters, selectedProjectId, view, hydrated,
      addProject, updateProject, deleteProject,
      addTask, updateTask, deleteTask,
      addDevLog, updateDevLog, deleteDevLog,
      addLearning, updateLearning, deleteLearning,
      addPomodoroSession,
      selectProject, setView, setFilters, resetFilters, importState,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
