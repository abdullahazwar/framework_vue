import type { Workspace } from './models.ts';
import { parseBackup, parseWorkspace } from './validation.ts';

export function serializeBackup(
  data: Workspace,
  exportedAt = new Date().toISOString(),
): string {
  const source = JSON.stringify(
    {
      application: 'ruang-kerja',
      version: 1,
      exportedAt,
      data: parseWorkspace(data),
    },
    null,
    2,
  );
  parseBackup(source);
  return source;
}
