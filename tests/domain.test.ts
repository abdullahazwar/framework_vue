import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  addDays,
  dateKey,
  isDateKey,
  isOverdue,
  startOfWeek,
} from '../src/domain/dates.ts';
import {
  emptyWorkspace,
  sampleWorkspace,
  saveTask,
  saveProject,
  saveNote,
  deleteEntity,
  setProjectArchived,
  replaceWorkspace,
} from '../src/domain/workspace.ts';
import {
  filterTasks,
  projectStats,
  workspaceStats,
} from '../src/domain/selectors.ts';
import { serializeBackup } from '../src/domain/backup.ts';
import { parseBackup, parseWorkspace } from '../src/domain/validation.ts';
import type { ProjectInput, TaskInput } from '../src/domain/models.ts';

const now = '2026-10-17T03:00:00.000Z';
const later = '2026-10-17T04:00:00.000Z';
const project: ProjectInput = {
  title: 'Uji proyek',
  description: '',
  kind: 'Personal',
  theme: 'forest',
  deadline: null,
};
const task: TaskInput = {
  projectId: 'project_test',
  title: 'Tulis draf',
  description: '',
  status: 'todo',
  priority: 'high',
  dueDate: '2026-10-17',
};
const fresh = () =>
  saveProject(emptyWorkspace(now), project, 'project_test', now);

test('tanggal kalender lokal, kabisat, pergantian bulan, dan awal pekan', () => {
  assert.equal(dateKey(new Date(2026, 9, 17, 0, 1)), '2026-10-17');
  assert.equal(isDateKey('2024-02-29'), true);
  for (const bad of [
    '2026-02-29',
    '2026-02-30',
    '2026-13-01',
    '1899-12-31',
    '2200-01-01',
    '2026-1-01',
  ])
    assert.equal(isDateKey(bad), false);
  assert.equal(addDays('2026-01-31', 1), '2026-02-01');
  assert.equal(startOfWeek('2026-10-18'), '2026-10-12');
  assert.equal(isOverdue('2026-10-16', 'done', '2026-10-17'), false);
  assert.equal(isOverdue('2026-10-17', 'todo', '2026-10-17'), false);
  assert.equal(isOverdue('2026-10-16', 'todo', '2026-10-17'), true);
});

test('data contoh valid dan metrik sesuai tugas aktif', () => {
  const data = parseWorkspace(sampleWorkspace(now));
  assert.deepEqual(
    [data.projects.length, data.tasks.length, data.notes.length],
    [3, 12, 2],
  );
  assert.ok(data.projects.every((item) => item.isSample));
  assert.deepEqual(workspaceStats(data, '2026-10-17'), {
    projects: 3,
    open: 9,
    done: 3,
    overdue: 1,
    today: 1,
  });
  assert.deepEqual(projectStats(data, 'project_vue'), {
    total: 4,
    done: 1,
    progress: 25,
  });
  assert.equal(projectStats(data, 'missing').progress, 0);
});

test('simpan dan edit proyek tidak mengubah data sumber', () => {
  const data = fresh();
  const result = saveProject(
    data,
    { ...project, title: '  Judul baru  ' },
    'project_test',
    later,
    now,
  );
  assert.equal(data.projects[0]!.title, 'Uji proyek');
  assert.equal(result.projects[0]!.title, 'Judul baru');
  assert.equal(result.projects[0]!.createdAt, now);
  assert.equal(result.projects[0]!.updatedAt, later);
  assert.equal(result.revision, data.revision + 1);
  assert.throws(
    () => saveProject(result, project, 'project_test', later, now),
    /sudah berubah/,
  );
  assert.throws(
    () => saveProject(data, project, 'missing', later, now),
    /sudah dihapus/,
  );
  assert.throws(
    () => saveProject(data, { ...project, title: '  ' }, 'new', now),
    /wajib/,
  );
});

test('selesai, edit tugas selesai, dan buka kembali mengelola waktu penyelesaian', () => {
  const data = saveTask(fresh(), task, 'task_test', now);
  const done = saveTask(
    data,
    { ...task, status: 'done' },
    'task_test',
    later,
    now,
  );
  assert.equal(data.tasks[0]!.completedAt, null);
  assert.equal(done.tasks[0]!.completedAt, later);
  const edited = saveTask(
    done,
    { ...task, title: 'Draf final', status: 'done' },
    'task_test',
    '2026-10-18T03:00:00Z',
    later,
  );
  assert.equal(edited.tasks[0]!.completedAt, later);
  const reopened = saveTask(
    edited,
    { ...task, status: 'doing' },
    'task_test',
    '2026-10-19T03:00:00Z',
  );
  assert.equal(reopened.tasks[0]!.completedAt, null);
  assert.throws(
    () => saveTask(done, task, 'task_test', later, now),
    /sudah berubah/,
  );
});

test('tugas memerlukan proyek aktif dan proyek asal aktif sebelum dipindah', () => {
  assert.throws(
    () => saveTask(emptyWorkspace(now), task, 'task_test', now),
    /Pilih proyek/,
  );
  const data = saveTask(fresh(), task, 'task_test', now);
  const archived = setProjectArchived(data, 'project_test', true, later);
  assert.throws(() => saveTask(archived, task, 'task_new', later), /arsip/);
  const second = saveProject(archived, project, 'project_second', later);
  assert.throws(
    () =>
      saveTask(
        second,
        { ...task, projectId: 'project_second' },
        'task_test',
        later,
      ),
    /proyek asal/,
  );
  const active = setProjectArchived(second, 'project_test', false, later);
  assert.equal(
    saveTask(
      active,
      { ...task, projectId: 'project_second' },
      'task_test',
      later,
    ).tasks[0]!.projectId,
    'project_second',
  );
});

test('filter digabung, urutan stabil, dan arsip tidak dihitung sebagai pekerjaan aktif', () => {
  const data = sampleWorkspace(now);
  const before = data.tasks.map((item) => item.id);
  assert.deepEqual(
    filterTasks(
      data,
      { status: 'open', priority: 'high', due: 'today', query: 'PORTOFOLIO' },
      '2026-10-17',
    ).map((item) => item.id),
    ['task_case'],
  );
  assert.deepEqual(
    filterTasks(data, { due: 'overdue', status: 'all' }, '2026-10-17').map(
      (item) => item.id,
    ),
    ['task_outline'],
  );
  assert.deepEqual(
    filterTasks(data, { due: 'undated' }, '2026-10-17').map((item) => item.id),
    ['task_reflect'],
  );
  assert.equal(
    filterTasks(data, { query: 'tidak-tersedia' }, '2026-10-17').length,
    0,
  );
  assert.deepEqual(
    data.tasks.map((item) => item.id),
    before,
  );
  const archived = setProjectArchived(data, 'project_kampus', true, later);
  assert.equal(workspaceStats(archived, '2026-10-17').overdue, 0);
  assert.equal(
    filterTasks(archived, { projectId: 'project_kampus' }, '2026-10-17').length,
    0,
  );
  assert.equal(
    filterTasks(
      archived,
      { projectId: 'project_kampus', includeArchived: true },
      '2026-10-17',
    ).length,
    4,
  );
});

test('hapus proyek hanya menghapus data terkait dan snapshot dapat dipulihkan', () => {
  const data = sampleWorkspace(now);
  const removed = deleteEntity(data, 'project', 'project_kampus', later);
  assert.deepEqual(
    [removed.projects.length, removed.tasks.length, removed.notes.length],
    [2, 8, 1],
  );
  assert.equal(removed.notes[0]!.projectId, null);
  const restored = replaceWorkspace(removed, data, later);
  assert.equal(restored.tasks.length, 12);
  assert.equal(restored.revision, removed.revision + 1);
  assert.equal(deleteEntity(data, 'task', 'task_case', later).tasks.length, 11);
  assert.equal(deleteEntity(data, 'note', 'note_start', later).notes.length, 1);
  assert.throws(
    () => deleteEntity(data, 'project', 'missing', later),
    /tidak tersedia/,
  );
});

test('catatan mempertahankan whitespace dan memperlakukan HTML sebagai teks', () => {
  const body = '  Baris pertama\n\n<script>alert(1)</script>\n  ';
  const data = saveNote(
    fresh(),
    { title: 'Ide', body, projectId: null },
    'note_test',
    now,
  );
  assert.equal(data.notes[0]!.body, body);
  assert.equal(parseBackup(serializeBackup(data)).data.notes[0]!.body, body);
  assert.throws(
    () =>
      saveNote(data, { title: 'Ide', body, projectId: 'missing' }, 'new', now),
    /tidak ditemukan/,
  );
});

test('cadangan roundtrip dan validasi menolak data rusak tanpa mengubah sumber', () => {
  const original = sampleWorkspace(now);
  assert.deepEqual(parseBackup(serializeBackup(original)).data, original);
  const duplicate = structuredClone(original);
  duplicate.tasks.push({ ...duplicate.tasks[0]! });
  assert.throws(() => parseWorkspace(duplicate), /duplikat/);
  const dangling = structuredClone(original);
  dangling.tasks[0]!.projectId = 'missing';
  assert.throws(() => parseWorkspace(dangling), /tidak tersedia/);
  assert.throws(
    () => parseWorkspace({ ...original, schemaVersion: 2 }),
    /Versi/,
  );
  assert.throws(() => parseWorkspace({ ...original, revision: -1 }), /Revisi/);
  assert.throws(() => parseBackup('{broken'), /bukan JSON/);
  assert.throws(
    () => parseBackup('{"application":"other","version":1}'),
    /Ruang Kerja/,
  );
  assert.throws(() => parseBackup(' '.repeat(5 * 1024 * 1024 + 1)), /5 MB/);
  const oversized = structuredClone(original);
  oversized.notes = Array.from({ length: 50 }, (_, index) => ({
    ...original.notes[0]!,
    id: `note_${index}`,
    body: 'a'.repeat(50000),
  }));
  assert.throws(() => parseWorkspace(oversized), /2 MB/);
  assert.equal(original.tasks.length, 12);
});
