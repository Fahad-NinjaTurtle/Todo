import { Priority, ProjectStatus, TaskStatus } from '@/types';
import {
  PRIORITY_LABELS, PRIORITY_COLORS,
  PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS,
  TASK_STATUS_LABELS, TASK_STATUS_COLORS,
} from '@/lib/utils';

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${PRIORITY_COLORS[priority]}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${PROJECT_STATUS_COLORS[status]}`}>
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${TASK_STATUS_COLORS[status]}`}>
      {TASK_STATUS_LABELS[status]}
    </span>
  );
}
