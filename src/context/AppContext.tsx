'use client';

import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { Project, Task, AppState, FilterState } from '@/types';
import { loadState, saveState, createActivity } from '@/lib/storage';
import { generateId } from '@/lib/utils';

// ─── State shape ────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  filters: FilterState;
  selectedProjectId: string | null;
  view: 'dashboard' | 'project';
  hydrated: boolean;

  // Project actions
  addProject: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) => void;
  updateProject: (id: string, data: Partial<Omit<Project, 'id' | 'createdAt' | 'tasks'>>) => void;
  deleteProject: (id: string) => void;

  // Task actions
  addTask: (projectId: string, data: Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (projectId: string, taskId: string, data: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>>) => void;
  deleteTask: (projectId: string, taskId: string) => void;

  // Navigation
  selectProject: (id: string | null) => void;
  setView: (view: 'dashboard' | 'project') => void;

  // Filters
  setFilters: (f: Partial<FilterState>) => void;
  resetFilters: () => void;

  // Data I/O
  importState: (s: AppState) => void;
}

// ─── Reducer ────────────────────────────────────────────────────────────────

type Action =
  | { type: 'HYDRATE'; payload: AppState }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; id: string; data: Partial<Project> }
  | { type: 'DELETE_PROJECT'; id: string }
  | { type: 'ADD_TASK'; projectId: string; task: Task }
  | { type: 'UPDATE_TASK'; projectId: string; taskId: string; data: Partial<Task> }
  | { type: 'DELETE_TASK'; projectId: string; taskId: string }
  | { type: 'IMPORT'; payload: AppState };

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
        projects: state.projects.map(p =>
          p.id === action.id ? { ...p, ...action.data, updatedAt: new Date().toISOString() } : p
        ),
        activity: [
          createActivity('project_updated', `Project "${state.projects.find(p => p.id === action.id)?.name}" updated`, action.id),
          ...state.activity,
        ].slice(0, 50),
      };

    case 'DELETE_PROJECT': {
      const proj = state.projects.find(p => p.id === action.id);
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.id),
        activity: [
          createActivity('project_deleted', `Project "${proj?.name}" deleted`),
          ...state.activity,
        ].slice(0, 50),
      };
    }

    case 'ADD_TASK':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.projectId ? { ...p, tasks: [...p.tasks, action.task] } : p
        ),
        activity: [
          createActivity('task_created', `Task "${action.task.title}" added`, action.projectId, action.task.id),
          ...state.activity,
        ].slice(0, 50),
      };

    case 'UPDATE_TASK': {
      let activityType: 'task_updated' | 'task_completed' = 'task_updated';
      let msg = '';
      return {
        ...state,
        projects: state.projects.map(p => {
          if (p.id !== action.projectId) return p;
          return {
            ...p,
            tasks: p.tasks.map(t => {
              if (t.id !== action.taskId) return t;
              const updated = { ...t, ...action.data, updatedAt: new Date().toISOString() };
              if (action.data.status === 'done' && t.status !== 'done') {
                activityType = 'task_completed';
                msg = `Task "${t.title}" marked as done`;
              } else {
                msg = `Task "${t.title}" updated`;
              }
              return updated;
            }),
          };
        }),
        activity: [
          createActivity(activityType, msg, action.projectId, action.taskId),
          ...state.activity,
        ].slice(0, 50),
      };
    }

    case 'DELETE_TASK': {
      let taskName = '';
      return {
        ...state,
        projects: state.projects.map(p => {
          if (p.id !== action.projectId) return p;
          const task = p.tasks.find(t => t.id === action.taskId);
          taskName = task?.title ?? 'Task';
          return { ...p, tasks: p.tasks.filter(t => t.id !== action.taskId) };
        }),
        activity: [
          createActivity('task_deleted', `Task "${taskName}" deleted`, action.projectId),
          ...state.activity,
        ].slice(0, 50),
      };
    }

    default:
      return state;
  }
}

// ─── Default filter state ────────────────────────────────────────────────────

const DEFAULT_FILTERS: FilterState = {
  search: '',
  status: 'all',
  priority: 'all',
  dueDateFilter: 'all',
  sortBy: 'deadline',
  sortOrder: 'asc',
};

// ─── Context ─────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { projects: [], activity: [] });
  const [filters, setFiltersState] = React.useState<FilterState>(DEFAULT_FILTERS);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
  const [view, setViewState] = React.useState<'dashboard' | 'project'>('dashboard');
  const [hydrated, setHydrated] = React.useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadState();
    dispatch({ type: 'HYDRATE', payload: saved });
    setHydrated(true);
  }, []);

  // Persist to localStorage on every state change
  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  // ── Project actions ──────────────────────────────────────────────────────
  const addProject = useCallback(
    (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) => {
      const now = new Date().toISOString();
      dispatch({
        type: 'ADD_PROJECT',
        payload: { ...data, id: generateId(), tasks: [], createdAt: now, updatedAt: now },
      });
    },
    []
  );

  const updateProject = useCallback(
    (id: string, data: Partial<Omit<Project, 'id' | 'createdAt' | 'tasks'>>) => {
      dispatch({ type: 'UPDATE_PROJECT', id, data });
    },
    []
  );

  const deleteProject = useCallback((id: string) => {
    dispatch({ type: 'DELETE_PROJECT', id });
  }, []);

  // ── Task actions ─────────────────────────────────────────────────────────
  const addTask = useCallback(
    (projectId: string, data: Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      dispatch({
        type: 'ADD_TASK',
        projectId,
        task: { ...data, id: generateId(), projectId, createdAt: now, updatedAt: now },
      });
    },
    []
  );

  const updateTask = useCallback(
    (projectId: string, taskId: string, data: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>>) => {
      dispatch({ type: 'UPDATE_TASK', projectId, taskId, data });
    },
    []
  );

  const deleteTask = useCallback((projectId: string, taskId: string) => {
    dispatch({ type: 'DELETE_TASK', projectId, taskId });
  }, []);

  // ── Navigation ───────────────────────────────────────────────────────────
  const selectProject = useCallback((id: string | null) => {
    setSelectedProjectId(id);
    setViewState(id ? 'project' : 'dashboard');
  }, []);

  const setView = useCallback((v: 'dashboard' | 'project') => {
    setViewState(v);
    if (v === 'dashboard') setSelectedProjectId(null);
  }, []);

  // ── Filters ──────────────────────────────────────────────────────────────
  const setFilters = useCallback((f: Partial<FilterState>) => {
    setFiltersState(prev => ({ ...prev, ...f }));
  }, []);

  const resetFilters = useCallback(() => setFiltersState(DEFAULT_FILTERS), []);

  // ── Import ───────────────────────────────────────────────────────────────
  const importState = useCallback((s: AppState) => {
    dispatch({ type: 'IMPORT', payload: s });
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        filters,
        selectedProjectId,
        view,
        hydrated,
        addProject,
        updateProject,
        deleteProject,
        addTask,
        updateTask,
        deleteTask,
        selectProject,
        setView,
        setFilters,
        resetFilters,
        importState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
