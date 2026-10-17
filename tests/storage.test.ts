import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPinia, setActivePinia } from 'pinia';
import { emptyWorkspace, sampleWorkspace } from '../src/domain/workspace.ts';
import {
  readWorkspace,
  STORAGE_KEY,
  StorageConflict,
  writeWorkspace,
} from '../src/features/workspace/repository.ts';
import type { StoragePort } from '../src/features/workspace/repository.ts';
import { useWorkspaceStore } from '../src/features/workspace/store.ts';

type MemoryStorage = StoragePort & {
  raw: string | null;
  writes: number;
  failRead: boolean;
  failWrite: boolean;
};
function memory(raw: string | null = null): MemoryStorage {
  return {
    raw,
    writes: 0,
    failRead: false,
    failWrite: false,
    getItem() {
      if (this.failRead) throw new Error('Storage denied');
      return this.raw;
    },
    setItem(_key: string, value: string) {
      if (this.failWrite) throw new Error('Quota exceeded');
      this.writes++;
      this.raw = value;
    },
  };
}
function storeWith(storage: StoragePort) {
  Object.defineProperty(globalThis, 'window', {
    value: { localStorage: storage },
    configurable: true,
  });
  setActivePinia(createPinia());
  const store = useWorkspaceStore();
  store.initialize();
  return store;
}

test('pembacaan membedakan kosong, valid, rusak, dan tidak tersedia; tidak menulis', () => {
  const storage = memory();
  assert.equal(readWorkspace(storage).kind, 'empty');
  storage.raw = JSON.stringify(sampleWorkspace());
  assert.equal(readWorkspace(storage).kind, 'ready');
  storage.raw = '{invalid';
  assert.equal(readWorkspace(storage).kind, 'corrupt');
  assert.equal(storage.raw, '{invalid');
  storage.failRead = true;
  assert.equal(readWorkspace(storage).kind, 'unavailable');
  assert.equal(storage.writes, 0);
});

test('penulisan mendeteksi perubahan tab lain sebelum menimpa', () => {
  const storage = memory();
  const raw = writeWorkspace(storage, emptyWorkspace(), null);
  storage.raw = 'external';
  assert.throws(
    () => writeWorkspace(storage, sampleWorkspace(), raw),
    StorageConflict,
  );
  assert.equal(storage.raw, 'external');
  assert.equal(storage.writes, 1);
});

test('store hanya memberi contoh pada ruang baru dan reload mempertahankan data', () => {
  const storage = memory();
  const store = storeWith(storage);
  assert.equal(store.data.tasks.length, 12);
  assert.equal(storage.writes, 1);
  store.preferences({ workspaceName: 'Ruang belajar', appearance: 'dark' });
  const reloaded = storeWith(storage);
  assert.equal(reloaded.data.preferences.workspaceName, 'Ruang belajar');
  assert.equal(reloaded.data.preferences.appearance, 'dark');
  assert.equal(storage.writes, 2);
});

test('data rusak tetap utuh dan hanya reset eksplisit boleh menggantinya', () => {
  const storage = memory('{invalid');
  const store = storeWith(storage);
  assert.equal(store.storageState, 'blocked');
  assert.equal(store.unreadableRaw, '{invalid');
  assert.throws(
    () => store.preferences({ workspaceName: 'Baru', appearance: 'light' }),
    /belum dapat dibaca/,
  );
  assert.equal(storage.writes, 0);
  store.replace(emptyWorkspace());
  assert.equal(store.storageState, 'ready');
  assert.equal(store.unreadableRaw, null);
  assert.equal(readWorkspace(storage).kind, 'ready');
});

test('quota gagal tetap menyimpan di memori, kemudian retry dapat menyimpan', () => {
  const storage = memory();
  const store = storeWith(storage);
  storage.failWrite = true;
  store.preferences({ workspaceName: 'Draf memori', appearance: 'dark' });
  assert.equal(store.storageState, 'memory');
  assert.equal(store.data.preferences.workspaceName, 'Draf memori');
  assert.equal(
    JSON.parse(storage.raw!).preferences.workspaceName,
    'Ruang pribadi',
  );
  storage.failWrite = false;
  store.retryStorage();
  assert.equal(store.storageState, 'ready');
  assert.equal(
    JSON.parse(storage.raw!).preferences.workspaceName,
    'Draf memori',
  );
});

test('penyimpanan yang tidak tersedia tidak memaksa data contoh atau kehilangan perubahan memori', () => {
  const storage = memory();
  storage.failRead = true;
  const store = storeWith(storage);
  assert.equal(store.storageState, 'memory');
  assert.equal(store.data.tasks.length, 0);
  store.preferences({ workspaceName: 'Sementara', appearance: 'light' });
  storage.failRead = false;
  store.retryStorage();
  assert.equal(store.storageState, 'ready');
  assert.equal(JSON.parse(storage.raw!).preferences.workspaceName, 'Sementara');
});

test('konflik lintas tab tidak menimpa memori atau storage; reload eksplisit', () => {
  const storage = memory();
  const store = storeWith(storage);
  const old = structuredClone(JSON.parse(storage.raw!));
  const external = emptyWorkspace();
  external.preferences.workspaceName = 'Tab lain';
  storage.raw = JSON.stringify(external);
  store.checkExternal();
  assert.equal(store.storageState, 'conflict');
  assert.throws(
    () => store.preferences({ workspaceName: 'Tab ini', appearance: 'light' }),
    StorageConflict,
  );
  assert.equal(
    store.data.preferences.workspaceName,
    old.preferences.workspaceName,
  );
  assert.equal(JSON.parse(storage.raw).preferences.workspaceName, 'Tab lain');
  store.reloadStorage();
  assert.equal(store.data.preferences.workspaceName, 'Tab lain');
  assert.equal(store.storageState, 'ready');
});

test('undo memulihkan cascade hanya sebelum perubahan berikutnya', () => {
  const storage = memory();
  const store = storeWith(storage);
  store.remove('project', 'project_kampus');
  assert.equal(store.data.tasks.length, 8);
  assert.equal(store.canUndo, true);
  store.undo();
  assert.equal(store.data.tasks.length, 12);
  assert.equal(store.canUndo, false);
  store.remove('task', 'task_case');
  store.preferences({ workspaceName: 'Baru', appearance: 'light' });
  assert.equal(store.canUndo, false);
  store.undo();
  assert.equal(store.data.tasks.length, 11);
  assert.equal(STORAGE_KEY, 'ruang-kerja:workspace:v1');
});
