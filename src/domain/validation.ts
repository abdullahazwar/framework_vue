import {
  APPEARANCES,
  PRIORITIES,
  PROJECT_KINDS,
  PROJECT_THEMES,
  TASK_STATUSES,
} from './models.ts';
import type {
  Backup,
  Entity,
  Note,
  Preferences,
  Project,
  Task,
  Workspace,
} from './models.ts';
import { isDateKey } from './dates.ts';

type RecordValue = Record<string, unknown>;

export function record(value: unknown, label = 'Data'): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`${label} harus berupa objek.`);
  return value as RecordValue;
}

export function text(
  value: unknown,
  max: number,
  label: string,
  required = true,
  trim = true,
): string {
  if (typeof value !== 'string') throw new Error(`${label} harus berupa teks.`);
  const result = trim ? value.trim() : value;
  if (required && !result.trim()) throw new Error(`${label} wajib diisi.`);
  if (result.length > max)
    throw new Error(`${label} maksimal ${max} karakter.`);
  return result;
}

export function choice<T extends string>(
  value: unknown,
  options: readonly T[],
  label: string,
): T {
  if (typeof value !== 'string' || !options.includes(value as T))
    throw new Error(`${label} tidak valid.`);
  return value as T;
}

export function optionalDate(value: unknown): string | null {
  if (value === null || value === '') return null;
  if (!isDateKey(value))
    throw new Error('Gunakan tanggal yang valid antara 1900 dan 2199.');
  return value;
}

function timestamp(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T/.test(value) ||
    !Number.isFinite(Date.parse(value))
  )
    throw new Error('Waktu penyimpanan tidak valid.');
  return value;
}

function identifier(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(value))
    throw new Error('Identitas data tidak valid.');
  return value;
}

function entity(value: RecordValue): Entity {
  return {
    id: identifier(value.id),
    createdAt: timestamp(value.createdAt),
    updatedAt: timestamp(value.updatedAt),
  };
}

function boolean(value: unknown): boolean {
  if (typeof value !== 'boolean') throw new Error('Nilai status tidak valid.');
  return value;
}

export function parsePreferences(value: unknown): Preferences {
  const input = record(value, 'Preferensi');
  return {
    workspaceName: text(input.workspaceName, 50, 'Nama ruang'),
    appearance: choice(input.appearance, APPEARANCES, 'Tampilan'),
  };
}

export function parseProject(value: unknown): Project {
  const input = record(value, 'Proyek');
  return {
    ...entity(input),
    title: text(input.title, 100, 'Nama proyek'),
    description: text(input.description, 2000, 'Deskripsi proyek', false),
    kind: choice(input.kind, PROJECT_KINDS, 'Kategori proyek'),
    theme: choice(input.theme, PROJECT_THEMES, 'Tema proyek'),
    deadline: optionalDate(input.deadline),
    archived: boolean(input.archived),
    isSample: boolean(input.isSample),
  };
}

export function parseTask(value: unknown): Task {
  const input = record(value, 'Tugas');
  const status = choice(input.status, TASK_STATUSES, 'Status tugas');
  const completedAt =
    input.completedAt === null ? null : timestamp(input.completedAt);
  if ((status === 'done') !== Boolean(completedAt))
    throw new Error('Waktu penyelesaian tugas tidak sesuai status.');
  return {
    ...entity(input),
    projectId: identifier(input.projectId),
    title: text(input.title, 160, 'Judul tugas'),
    description: text(input.description, 5000, 'Deskripsi tugas', false),
    status,
    priority: choice(input.priority, PRIORITIES, 'Prioritas'),
    dueDate: optionalDate(input.dueDate),
    completedAt,
  };
}

export function parseNote(value: unknown): Note {
  const input = record(value, 'Catatan');
  return {
    ...entity(input),
    projectId: input.projectId === null ? null : identifier(input.projectId),
    title: text(input.title, 140, 'Judul catatan'),
    body: text(input.body, 50000, 'Isi catatan', false, false),
  };
}

function list<T extends Entity>(
  value: unknown,
  max: number,
  parser: (item: unknown) => T,
): T[] {
  if (!Array.isArray(value) || value.length > max)
    throw new Error('Jumlah data melebihi batas yang didukung.');
  const items = value.map(parser);
  if (new Set(items.map((item) => item.id)).size !== items.length)
    throw new Error('Terdapat identitas data yang duplikat.');
  return items;
}

export function parseWorkspace(value: unknown): Workspace {
  const input = record(value, 'Ruang kerja');
  if (input.schemaVersion !== 1)
    throw new Error('Versi cadangan belum didukung. Gunakan format versi 1.');
  if (!Number.isSafeInteger(input.revision) || Number(input.revision) < 0)
    throw new Error('Revisi data tidak valid.');
  const projects = list(input.projects, 200, parseProject);
  const tasks = list(input.tasks, 10000, parseTask);
  const notes = list(input.notes, 2000, parseNote);
  const projectIds = new Set(projects.map((project) => project.id));
  if (
    tasks.some((task) => !projectIds.has(task.projectId)) ||
    notes.some((note) => note.projectId && !projectIds.has(note.projectId))
  )
    throw new Error(
      'Cadangan memuat tugas atau catatan dengan proyek yang tidak tersedia.',
    );
  const data: Workspace = {
    schemaVersion: 1,
    revision: Number(input.revision),
    savedAt: timestamp(input.savedAt),
    projects,
    tasks,
    notes,
    preferences: parsePreferences(input.preferences),
  };
  if (new TextEncoder().encode(JSON.stringify(data)).length > 2 * 1024 * 1024)
    throw new Error(
      'Ruang kerja maksimal 2 MB. Kurangi isi catatan atau jumlah data.',
    );
  return data;
}

export function parseBackup(source: string): Backup {
  if (new TextEncoder().encode(source).length > 5 * 1024 * 1024)
    throw new Error('Berkas cadangan maksimal 5 MB.');
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    throw new Error('Berkas bukan JSON yang valid.');
  }
  const input = record(value, 'Cadangan');
  if (input.application !== 'ruang-kerja' || input.version !== 1)
    throw new Error('Pilih cadangan Ruang Kerja versi 1.');
  return {
    application: 'ruang-kerja',
    version: 1,
    exportedAt: timestamp(input.exportedAt),
    data: parseWorkspace(input.data),
  };
}
