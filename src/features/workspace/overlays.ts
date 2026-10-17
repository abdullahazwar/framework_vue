import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { EntityKind, TaskStatus } from '../../domain/models.ts';

type Overlay =
  | { type: 'project'; id?: string }
  | {
      type: 'task';
      id?: string;
      projectId?: string;
      status?: TaskStatus;
      dueDate?: string;
    }
  | { type: 'note'; id?: string; projectId?: string }
  | { type: 'delete'; kind: EntityKind; id: string }
  | null;

export const useOverlayStore = defineStore('overlays', () => {
  const current = ref<Overlay>(null);
  function open(value: Exclude<Overlay, null>) {
    current.value = value;
  }
  function close() {
    current.value = null;
  }
  return { current, open, close };
});
