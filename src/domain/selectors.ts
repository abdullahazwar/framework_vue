import type { Priority, Task, TaskStatus, Workspace } from './models.ts';
import { addDays, isOverdue } from './dates.ts';

export interface TaskFilters {
  query?: string;
  projectId?: string;
  status?: TaskStatus | 'all' | 'open';
  priority?: Priority | 'all';
  due?: 'all' | 'today' | 'week' | 'overdue' | 'undated';
  includeArchived?: boolean;
}

const priorityOrder: Record<Priority, number> = { high: 0, normal: 1, low: 2 };

export function filterTasks(
  data: Workspace,
  filters: TaskFilters,
  today: string,
): Task[] {
  const projectMap = new Map(
    data.projects.map((project) => [project.id, project]),
  );
  const query = (filters.query || '').trim().toLocaleLowerCase('id-ID');
  return data.tasks
    .filter((task) => {
      const project = projectMap.get(task.projectId);
      if (!project || (!filters.includeArchived && project.archived))
        return false;
      if (filters.projectId && task.projectId !== filters.projectId)
        return false;
      if (filters.status === 'open' && task.status === 'done') return false;
      if (
        filters.status &&
        !['all', 'open'].includes(filters.status) &&
        task.status !== filters.status
      )
        return false;
      if (
        filters.priority &&
        filters.priority !== 'all' &&
        task.priority !== filters.priority
      )
        return false;
      if (
        query &&
        !`${task.title} ${task.description} ${project.title}`
          .toLocaleLowerCase('id-ID')
          .includes(query)
      )
        return false;
      if (filters.due === 'today' && task.dueDate !== today) return false;
      if (
        filters.due === 'week' &&
        (!task.dueDate ||
          task.dueDate < today ||
          task.dueDate > addDays(today, 6))
      )
        return false;
      if (
        filters.due === 'overdue' &&
        !isOverdue(task.dueDate, task.status, today)
      )
        return false;
      if (filters.due === 'undated' && task.dueDate) return false;
      return true;
    })
    .sort((a, b) => {
      if ((a.status === 'done') !== (b.status === 'done'))
        return a.status === 'done' ? 1 : -1;
      return (
        (a.dueDate || '9999').localeCompare(b.dueDate || '9999') ||
        priorityOrder[a.priority] - priorityOrder[b.priority] ||
        a.createdAt.localeCompare(b.createdAt) ||
        a.id.localeCompare(b.id)
      );
    });
}

export function projectStats(data: Workspace, id: string) {
  const tasks = data.tasks.filter((task) => task.projectId === id);
  const done = tasks.filter((task) => task.status === 'done').length;
  return {
    total: tasks.length,
    done,
    progress: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
  };
}

export function workspaceStats(data: Workspace, today: string) {
  const active = filterTasks(data, { status: 'all' }, today);
  return {
    projects: data.projects.filter((project) => !project.archived).length,
    open: active.filter((task) => task.status !== 'done').length,
    done: active.filter((task) => task.status === 'done').length,
    overdue: active.filter((task) =>
      isOverdue(task.dueDate, task.status, today),
    ).length,
    today: active.filter(
      (task) => task.status !== 'done' && task.dueDate === today,
    ).length,
  };
}
