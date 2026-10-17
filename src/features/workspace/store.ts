import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type {
  EntityKind,
  NoteInput,
  Preferences,
  ProjectInput,
  TaskInput,
  Workspace,
} from '../../domain/models.ts';
import * as domain from '../../domain/workspace.ts';
import { parseWorkspace } from '../../domain/validation.ts';
import {
  readWorkspace,
  STORAGE_KEY,
  StorageConflict,
  writeWorkspace,
} from './repository.ts';
import type { StoragePort } from './repository.ts';

function browserStorage(): StoragePort {
  return {
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
  };
}

export const useWorkspaceStore = defineStore('workspace', () => {
  const data = ref<Workspace>(domain.emptyWorkspace());
  const storageState = ref<'ready' | 'memory' | 'blocked' | 'conflict'>(
    'ready',
  );
  const storageMessage = ref('');
  const unreadableRaw = ref<string | null>(null);
  const notice = ref('');
  const undoSnapshot = ref<{ data: Workspace; revision: number } | null>(null);
  const canUndo = computed(
    () => undoSnapshot.value?.revision === data.value.revision,
  );
  let expectedRaw: string | null = null;
  const storage = browserStorage();

  function inform(message: string) {
    notice.value = message;
  }

  function persist(next: Workspace, overwrite = false): void {
    if (storageState.value === 'blocked' && !overwrite)
      throw new Error(
        'Data lama belum dapat dibaca. Gunakan pemulihan pada Pengaturan terlebih dahulu.',
      );
    if (storageState.value === 'conflict' && !overwrite)
      throw new StorageConflict();
    if (storageState.value === 'memory' && !overwrite) return;
    try {
      if (overwrite) expectedRaw = storage.getItem(STORAGE_KEY);
      expectedRaw = writeWorkspace(storage, next, expectedRaw);
      storageState.value = 'ready';
      storageMessage.value = '';
      unreadableRaw.value = null;
    } catch (error) {
      if (error instanceof StorageConflict) {
        storageState.value = 'conflict';
        storageMessage.value = error.message;
        throw error;
      }
      storageState.value = 'memory';
      storageMessage.value =
        'Perubahan hanya tersimpan di tab ini. Unduh backup sebelum menutup halaman, atau coba simpan kembali.';
    }
  }

  function commit(
    next: Workspace,
    message: string,
    undo = false,
    overwrite = false,
  ): void {
    const checked = parseWorkspace(next);
    const previous = data.value;
    persist(checked, overwrite);
    data.value = checked;
    undoSnapshot.value = undo
      ? { data: previous, revision: checked.revision }
      : null;
    inform(message);
  }

  function initialize(): void {
    const loaded = readWorkspace(storage);
    expectedRaw = loaded.raw;
    if (loaded.kind === 'ready') data.value = loaded.data;
    else if (loaded.kind === 'empty') {
      data.value = domain.sampleWorkspace();
      persist(data.value);
    } else if (loaded.kind === 'corrupt') {
      storageState.value = 'blocked';
      unreadableRaw.value = loaded.raw;
      storageMessage.value =
        'Data lokal tidak dapat dibaca dan belum ditimpa. Unduh data mentah atau pulihkan cadangan melalui Pengaturan.';
    } else {
      storageState.value = 'memory';
      storageMessage.value = loaded.message;
    }
  }

  function project(
    input: ProjectInput,
    id?: string,
    expected?: string,
  ): string {
    const key = id || 'project_' + crypto.randomUUID();
    commit(
      domain.saveProject(
        data.value,
        input,
        key,
        new Date().toISOString(),
        expected,
      ),
      id ? 'Perubahan proyek disimpan.' : 'Proyek baru dibuat.',
    );
    return key;
  }
  function task(input: TaskInput, id?: string, expected?: string): void {
    commit(
      domain.saveTask(
        data.value,
        input,
        id || 'task_' + crypto.randomUUID(),
        new Date().toISOString(),
        expected,
      ),
      id ? 'Perubahan tugas disimpan.' : 'Tugas baru ditambahkan.',
    );
  }
  function note(input: NoteInput, id?: string, expected?: string): string {
    const key = id || 'note_' + crypto.randomUUID();
    commit(
      domain.saveNote(
        data.value,
        input,
        key,
        new Date().toISOString(),
        expected,
      ),
      id ? 'Catatan diperbarui.' : 'Catatan baru dibuat.',
    );
    return key;
  }
  function archive(id: string, archived: boolean): void {
    commit(
      domain.setProjectArchived(
        data.value,
        id,
        archived,
        new Date().toISOString(),
      ),
      archived ? 'Proyek masuk arsip.' : 'Proyek kembali aktif.',
    );
  }
  function remove(kind: EntityKind, id: string): void {
    commit(
      domain.deleteEntity(data.value, kind, id, new Date().toISOString()),
      'Data dihapus. Anda dapat memulihkannya sebelum perubahan berikutnya.',
      true,
    );
  }
  function undo(): void {
    if (!canUndo.value || !undoSnapshot.value) return;
    commit(
      domain.replaceWorkspace(
        data.value,
        undoSnapshot.value.data,
        new Date().toISOString(),
      ),
      'Data berhasil dipulihkan.',
    );
  }
  function preferences(input: Preferences): void {
    commit(
      domain.savePreferences(data.value, input, new Date().toISOString()),
      'Pengaturan disimpan.',
    );
  }
  function replace(incoming: Workspace): void {
    commit(
      domain.replaceWorkspace(data.value, incoming, new Date().toISOString()),
      'Data ruang kerja berhasil diganti.',
      false,
      true,
    );
  }
  function retryStorage(): void {
    if (storageState.value === 'blocked') return;
    if (storageState.value === 'memory') storageState.value = 'ready';
    persist(data.value, false);
    if (storageState.value === 'ready')
      inform('Data sudah tersimpan pada perangkat.');
  }
  function reloadStorage(): void {
    const loaded = readWorkspace(storage);
    if (loaded.kind === 'ready') {
      data.value = loaded.data;
      expectedRaw = loaded.raw;
      storageState.value = 'ready';
      storageMessage.value = '';
      undoSnapshot.value = null;
      inform('Data terbaru dari perangkat sudah dimuat.');
    } else if (loaded.kind === 'corrupt') {
      unreadableRaw.value = loaded.raw;
      storageState.value = 'blocked';
      storageMessage.value =
        'Data perangkat belum dapat dibaca. Pulihkan cadangan melalui Pengaturan.';
    } else if (loaded.kind === 'empty') {
      storageState.value = 'conflict';
      storageMessage.value =
        'Data perangkat telah dihapus dari luar tab ini. Unduh backup, lalu pilih ruang kosong atau impor pada Pengaturan.';
    } else storageMessage.value = loaded.message;
  }
  function checkExternal(): void {
    if (storageState.value === 'memory' || storageState.value === 'blocked')
      return;
    try {
      if (storage.getItem(STORAGE_KEY) !== expectedRaw) {
        storageState.value = 'conflict';
        storageMessage.value =
          'Data di tab lain berubah. Muat perubahan sebelum melanjutkan.';
      }
    } catch {
      storageState.value = 'memory';
      storageMessage.value =
        'Penyimpanan perangkat sedang tidak tersedia. Unduh backup sebelum menutup tab.';
    }
  }

  return {
    data,
    storageState,
    storageMessage,
    unreadableRaw,
    notice,
    canUndo,
    undoSnapshot,
    inform,
    initialize,
    project,
    task,
    note,
    archive,
    remove,
    undo,
    preferences,
    replace,
    retryStorage,
    reloadStorage,
    checkExternal,
  };
});
