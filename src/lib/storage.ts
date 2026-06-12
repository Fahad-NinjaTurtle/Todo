import { AppState, ActivityEntry, PomodoroStats } from '@/types';
import { generateId } from './utils';

const STORAGE_KEY = 'taskflow_data';

const DEFAULT_STATE: AppState = {
  projects: [],
  activity: [],
  devLog: [],
  learnings: [],
  pomodoroSessions: [],
};

export function loadState(): AppState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as AppState;
    return {
      projects: parsed.projects ?? [],
      activity: parsed.activity ?? [],
      devLog: parsed.devLog ?? [],
      learnings: parsed.learnings ?? [],
      pomodoroSessions: parsed.pomodoroSessions ?? [],
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
          devLog: state.devLog ?? [],
          learnings: state.learnings ?? [],
          pomodoroSessions: state.pomodoroSessions ?? [],
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

// Pomodoro XP system
const XP_PER_SESSION = 25;
const XP_PER_LEVEL = 200;

export function computePomodoroStats(sessions: AppState['pomodoroSessions']): PomodoroStats {
  const workSessions = sessions.filter(s => s.type === 'work');
  const totalSessions = workSessions.length;
  const totalMinutes = workSessions.reduce((acc, s) => acc + s.duration, 0);
  const totalXP = totalSessions * XP_PER_SESSION;
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;
  const xp = totalXP % XP_PER_LEVEL;

  // Calculate streak (consecutive days with at least 1 work session)
  const sessionDays = new Set(workSessions.map(s => s.completedAt.split('T')[0]));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (sessionDays.has(key)) streak++;
    else if (i > 0) break; // gap found
  }

  return {
    totalSessions,
    totalMinutes,
    currentStreak: streak,
    longestStreak: streak, // simplified
    level,
    xp,
    xpToNextLevel: XP_PER_LEVEL,
  };
}
