import type { Workspace } from '../../domain/models.ts';
import { parseWorkspace } from '../../domain/validation.ts';

export const STORAGE_KEY = 'ruang-kerja:workspace:v1';
export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export type LoadResult =
  | { kind: 'empty'; raw: null }
  | { kind: 'ready'; raw: string; data: Workspace }
  | { kind: 'corrupt'; raw: string; message: string }
  | { kind: 'unavailable'; raw: null; message: string };

export class StorageConflict extends Error {
  constructor() {
    super(
      'Data pada tab lain sudah berubah. Muat perubahan sebelum menyimpan.',
    );
  }
}

export function readWorkspace(storage: StoragePort): LoadResult {
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return {
      kind: 'unavailable',
      raw: null,
      message:
        'Penyimpanan perangkat tidak dapat dibaca. Data baru hanya berada di tab ini.',
    };
  }
  if (raw === null) return { kind: 'empty', raw: null };
  try {
    return { kind: 'ready', raw, data: parseWorkspace(JSON.parse(raw)) };
  } catch (error) {
    return {
      kind: 'corrupt',
      raw,
      message:
        error instanceof Error
          ? error.message
          : 'Data tersimpan tidak dapat dibaca.',
    };
  }
}

export function writeWorkspace(
  storage: StoragePort,
  data: Workspace,
  expected: string | null,
): string {
  if (storage.getItem(STORAGE_KEY) !== expected) throw new StorageConflict();
  const raw = JSON.stringify(data);
  storage.setItem(STORAGE_KEY, raw);
  return raw;
}
