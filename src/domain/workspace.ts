import type {
  EntityKind,
  NoteInput,
  Preferences,
  ProjectInput,
  TaskInput,
  Workspace,
} from './models.ts';
import {
  parseNote,
  parsePreferences,
  parseProject,
  parseTask,
  parseWorkspace,
} from './validation.ts';
import { addDays, dateKey } from './dates.ts';

export function emptyWorkspace(now = new Date().toISOString()): Workspace {
  return {
    schemaVersion: 1,
    revision: 0,
    savedAt: now,
    projects: [],
    tasks: [],
    notes: [],
    preferences: { workspaceName: 'Ruang pribadi', appearance: 'light' },
  };
}

function touch(data: Workspace, now: string): Workspace {
  return { ...data, revision: data.revision + 1, savedAt: now };
}

function assertCurrent(updatedAt: string, expected?: string): void {
  if (expected && updatedAt !== expected)
    throw new Error(
      'Data ini sudah berubah. Tutup form dan buka kembali sebelum menyimpan.',
    );
}

export function saveProject(
  data: Workspace,
  input: ProjectInput,
  id: string,
  now: string,
  expected?: string,
): Workspace {
  const previous = data.projects.find((project) => project.id === id);
  if (expected && !previous) throw new Error('Proyek sudah dihapus.');
  if (previous) assertCurrent(previous.updatedAt, expected);
  if (!previous && data.projects.length >= 200)
    throw new Error('Maksimal 200 proyek dalam satu ruang.');
  const project = parseProject({
    ...input,
    id,
    createdAt: previous?.createdAt || now,
    updatedAt: now,
    archived: previous?.archived || false,
    isSample: previous?.isSample || false,
  });
  return touch(
    {
      ...data,
      projects: previous
        ? data.projects.map((item) => (item.id === id ? project : item))
        : [...data.projects, project],
    },
    now,
  );
}

export function setProjectArchived(
  data: Workspace,
  id: string,
  archived: boolean,
  now: string,
): Workspace {
  if (!data.projects.some((project) => project.id === id))
    throw new Error('Proyek tidak ditemukan.');
  return touch(
    {
      ...data,
      projects: data.projects.map((project) =>
        project.id === id ? { ...project, archived, updatedAt: now } : project,
      ),
    },
    now,
  );
}

export function saveTask(
  data: Workspace,
  input: TaskInput,
  id: string,
  now: string,
  expected?: string,
): Workspace {
  const project = data.projects.find((item) => item.id === input.projectId);
  if (!project) throw new Error('Pilih proyek yang tersedia.');
  if (project.archived)
    throw new Error('Buka kembali proyek dari arsip sebelum mengubah tugas.');
  const previous = data.tasks.find((task) => task.id === id);
  if (expected && !previous) throw new Error('Tugas sudah dihapus.');
  if (previous) {
    assertCurrent(previous.updatedAt, expected);
    const oldProject = data.projects.find(
      (item) => item.id === previous.projectId,
    );
    if (oldProject?.archived)
      throw new Error(
        'Buka kembali proyek asal dari arsip sebelum memindahkan tugas.',
      );
  }
  if (!previous && data.tasks.length >= 10000)
    throw new Error('Maksimal 10.000 tugas dalam satu ruang.');
  const task = parseTask({
    ...input,
    id,
    createdAt: previous?.createdAt || now,
    updatedAt: now,
    completedAt: input.status === 'done' ? previous?.completedAt || now : null,
  });
  return touch(
    {
      ...data,
      tasks: previous
        ? data.tasks.map((item) => (item.id === id ? task : item))
        : [...data.tasks, task],
    },
    now,
  );
}

export function saveNote(
  data: Workspace,
  input: NoteInput,
  id: string,
  now: string,
  expected?: string,
): Workspace {
  if (
    input.projectId &&
    !data.projects.some((project) => project.id === input.projectId)
  )
    throw new Error('Proyek catatan tidak ditemukan.');
  const previous = data.notes.find((note) => note.id === id);
  if (expected && !previous) throw new Error('Catatan sudah dihapus.');
  if (previous) assertCurrent(previous.updatedAt, expected);
  if (!previous && data.notes.length >= 2000)
    throw new Error('Maksimal 2.000 catatan dalam satu ruang.');
  const note = parseNote({
    ...input,
    id,
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  });
  return touch(
    {
      ...data,
      notes: previous
        ? data.notes.map((item) => (item.id === id ? note : item))
        : [...data.notes, note],
    },
    now,
  );
}

export function deleteEntity(
  data: Workspace,
  kind: EntityKind,
  id: string,
  now: string,
): Workspace {
  const collection =
    kind === 'project'
      ? data.projects
      : kind === 'task'
        ? data.tasks
        : data.notes;
  if (!collection.some((item) => item.id === id))
    throw new Error('Data sudah tidak tersedia.');
  if (kind === 'project')
    return touch(
      {
        ...data,
        projects: data.projects.filter((item) => item.id !== id),
        tasks: data.tasks.filter((task) => task.projectId !== id),
        notes: data.notes.filter((note) => note.projectId !== id),
      },
      now,
    );
  if (kind === 'task')
    return touch(
      { ...data, tasks: data.tasks.filter((item) => item.id !== id) },
      now,
    );
  return touch(
    { ...data, notes: data.notes.filter((item) => item.id !== id) },
    now,
  );
}

export function savePreferences(
  data: Workspace,
  input: Preferences,
  now: string,
): Workspace {
  return touch({ ...data, preferences: parsePreferences(input) }, now);
}

export function replaceWorkspace(
  data: Workspace,
  incoming: Workspace,
  now: string,
): Workspace {
  const checked = parseWorkspace(incoming);
  return { ...checked, revision: data.revision + 1, savedAt: now };
}

export function sampleWorkspace(now = new Date().toISOString()): Workspace {
  const today = dateKey(new Date(now));
  const data = emptyWorkspace(now);
  data.projects = [
    {
      id: 'project_portfolio',
      title: 'Portofolio pribadi',
      description:
        'Proyek contoh: rapikan studi kasus dan siapkan karya untuk dibagikan.',
      kind: 'Personal',
      theme: 'forest',
      deadline: addDays(today, 10),
      archived: false,
      isSample: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'project_vue',
      title: 'Belajar Vue',
      description:
        'Proyek contoh: bangun kebiasaan belajar melalui komponen kecil yang benar-benar bekerja.',
      kind: 'Belajar',
      theme: 'slate',
      deadline: addDays(today, 18),
      archived: false,
      isSample: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'project_kampus',
      title: 'Presentasi kelompok',
      description:
        'Proyek contoh: kumpulkan materi, susun alur, dan siapkan sesi latihan.',
      kind: 'Kuliah',
      theme: 'clay',
      deadline: addDays(today, 5),
      archived: false,
      isSample: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
  const tasks: [
    string,
    string,
    string,
    TaskInput['status'],
    TaskInput['priority'],
    number | null,
  ][] = [
    [
      'task_scope',
      'project_portfolio',
      'Pilih tiga karya utama',
      'done',
      'normal',
      -2,
    ],
    [
      'task_case',
      'project_portfolio',
      'Tulis proses studi kasus',
      'doing',
      'high',
      0,
    ],
    [
      'task_cover',
      'project_portfolio',
      'Siapkan sampul proyek',
      'todo',
      'normal',
      2,
    ],
    [
      'task_contact',
      'project_portfolio',
      'Periksa tautan dan kontak',
      'todo',
      'low',
      7,
    ],
    [
      'task_component',
      'project_vue',
      'Pelajari props dan event',
      'done',
      'normal',
      -1,
    ],
    ['task_state', 'project_vue', 'Coba state bersama', 'doing', 'high', 1],
    ['task_test', 'project_vue', 'Tulis pengujian fungsi', 'todo', 'normal', 4],
    [
      'task_reflect',
      'project_vue',
      'Catat hal yang dipelajari',
      'todo',
      'low',
      null,
    ],
    [
      'task_reference',
      'project_kampus',
      'Kumpulkan referensi materi',
      'done',
      'normal',
      -2,
    ],
    [
      'task_outline',
      'project_kampus',
      'Rapikan alur pembahasan',
      'doing',
      'high',
      -1,
    ],
    [
      'task_slides',
      'project_kampus',
      'Susun halaman presentasi',
      'todo',
      'high',
      2,
    ],
    [
      'task_rehearse',
      'project_kampus',
      'Latihan bersama kelompok',
      'todo',
      'normal',
      4,
    ],
  ];
  data.tasks = tasks.map(
    ([id, projectId, title, status, priority, offset]) => ({
      id,
      projectId,
      title,
      status,
      priority,
      dueDate: offset === null ? null : addDays(today, offset),
      description:
        'Tugas contoh. Ubah detail ini sesuai kebutuhan proyek Anda.',
      completedAt: status === 'done' ? now : null,
      createdAt: now,
      updatedAt: now,
    }),
  );
  data.notes = [
    {
      id: 'note_start',
      projectId: null,
      title: 'Mulai dengan satu langkah',
      body: 'Catatan contoh\n\nPilih satu pekerjaan yang bisa dituntaskan hari ini. Pecah tugas besar menjadi langkah yang jelas.\n\nRuang ini menyimpan data pada browser perangkat Anda. Buat backup secara berkala melalui Pengaturan.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'note_outline',
      projectId: 'project_kampus',
      title: 'Rangka pembahasan',
      body: 'Catatan contoh\n\n1. Masalah yang ingin dijelaskan\n2. Konsep utama\n3. Contoh penerapan\n4. Kesimpulan dan pertanyaan diskusi',
      createdAt: now,
      updatedAt: now,
    },
  ];
  return data;
}
