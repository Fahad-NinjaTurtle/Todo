import { AppState, ActivityEntry } from '@/types';
import { generateId } from './utils';

const STORAGE_KEY = 'taskflow_data';

const DEFAULT_STATE: AppState = {
  projects: [],
  activity: [],
};

// Safe localStorage access — Next.js runs on server too
export function loadState(): AppState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as AppState;
    // Ensure arrays exist even on older saved data
    return {
      projects: parsed.projects ?? [],
      activity: parsed.activity ?? [],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('TaskFlow: failed to save to localStorage', err);
  }
}

export function exportData(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `taskflow-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const state = JSON.parse(e.target?.result as string) as AppState;
        if (!state.projects) throw new Error('Invalid backup file');
        resolve({
          projects: state.projects ?? [],
          activity: state.activity ?? [],
        });
      } catch {
        reject(new Error('Invalid JSON backup file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function createActivity(
  type: ActivityEntry['type'],
  message: string,
  projectId?: string,
  taskId?: string
): ActivityEntry {
  return {
    id: generateId(),
    type,
    message,
    projectId,
    taskId,
    timestamp: new Date().toISOString(),
  };
}
