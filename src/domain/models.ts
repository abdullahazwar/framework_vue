export const TASK_STATUSES = ['todo', 'doing', 'done'] as const;
export const PRIORITIES = ['low', 'normal', 'high'] as const;
export const PROJECT_KINDS = [
  'Personal',
  'Belajar',
  'Kuliah',
  'Pekerjaan',
] as const;
export const PROJECT_THEMES = ['forest', 'clay', 'slate', 'sand'] as const;
export const APPEARANCES = ['light', 'dark', 'system'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type ProjectKind = (typeof PROJECT_KINDS)[number];
export type ProjectTheme = (typeof PROJECT_THEMES)[number];
export type Appearance = (typeof APPEARANCES)[number];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Belum mulai',
  doing: 'Dikerjakan',
  done: 'Selesai',
};
export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Rendah',
  normal: 'Normal',
  high: 'Tinggi',
};
export const THEME_LABELS: Record<ProjectTheme, string> = {
  forest: 'Hutan',
  clay: 'Tanah',
  slate: 'Batu',
  sand: 'Pasir',
};

export interface Entity {
  id: string;
  createdAt: string;
  updatedAt: string;
}
export interface Project extends Entity {
  title: string;
  description: string;
  kind: ProjectKind;
  theme: ProjectTheme;
  deadline: string | null;
  archived: boolean;
  isSample: boolean;
}
export interface Task extends Entity {
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  completedAt: string | null;
}
export interface Note extends Entity {
  projectId: string | null;
  title: string;
  body: string;
}
export interface Preferences {
  workspaceName: string;
  appearance: Appearance;
}
export interface Workspace {
  schemaVersion: 1;
  revision: number;
  savedAt: string;
  projects: Project[];
  tasks: Task[];
  notes: Note[];
  preferences: Preferences;
}

export type ProjectInput = Pick<
  Project,
  'title' | 'description' | 'kind' | 'theme' | 'deadline'
>;
export type TaskInput = Pick<
  Task,
  'projectId' | 'title' | 'description' | 'status' | 'priority' | 'dueDate'
>;
export type NoteInput = Pick<Note, 'projectId' | 'title' | 'body'>;
export type EntityKind = 'project' | 'task' | 'note';

export interface Backup {
  application: 'ruang-kerja';
  version: 1;
  exportedAt: string;
  data: Workspace;
}
