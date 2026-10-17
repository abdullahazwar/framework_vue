<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useWorkspaceStore } from './store.ts';
import { useOverlayStore } from './overlays.ts';
import ProjectEditor from '../projects/ProjectEditor.vue';
import TaskEditor from '../tasks/TaskEditor.vue';
import NoteEditor from '../notes/NoteEditor.vue';
import BaseDialog from '../../components/BaseDialog.vue';

const store = useWorkspaceStore();
const overlays = useOverlayStore();
const router = useRouter();
const error = ref('');
watch(
  () => overlays.current,
  () => {
    error.value = '';
  },
);
const deletion = computed(() => {
  const item = overlays.current;
  if (item?.type !== 'delete') return null;
  const collection =
    item.kind === 'project'
      ? store.data.projects
      : item.kind === 'task'
        ? store.data.tasks
        : store.data.notes;
  const entity = collection.find((entity) => entity.id === item.id);
  return entity
    ? {
        ...item,
        title: entity.title,
        tasks: store.data.tasks.filter((task) => task.projectId === item.id)
          .length,
        notes: store.data.notes.filter((note) => note.projectId === item.id)
          .length,
      }
    : null;
});
function remove() {
  if (!deletion.value) return;
  try {
    const { kind, id } = deletion.value;
    store.remove(kind, id);
    overlays.close();
    if (kind === 'project' && router.currentRoute.value.params.id === id)
      void router.push('/projects');
  } catch (value) {
    error.value =
      value instanceof Error ? value.message : 'Data belum dapat dihapus.';
  }
}
</script>

<template>
  <ProjectEditor
    v-if="overlays.current?.type === 'project'"
    :key="`project-${overlays.current.id || 'new'}`"
    :id="overlays.current.id"
  />
  <TaskEditor
    v-else-if="overlays.current?.type === 'task'"
    :key="`task-${overlays.current.id || 'new'}`"
    :id="overlays.current.id"
    :project-id="overlays.current.projectId"
    :status="overlays.current.status"
    :due-date="overlays.current.dueDate"
  />
  <NoteEditor
    v-else-if="overlays.current?.type === 'note'"
    :key="`note-${overlays.current.id || 'new'}`"
    :id="overlays.current.id"
    :project-id="overlays.current.projectId"
  />
  <BaseDialog
    v-else-if="overlays.current?.type === 'delete'"
    title="Hapus data?"
    @close="overlays.close"
  >
    <div class="confirm-body">
      <template v-if="deletion"
        ><p>
          <strong>{{ deletion.title }}</strong> akan dihapus dari ruang ini.
        </p>
        <p
          v-if="deletion.kind === 'project'"
          class="muted"
        >
          Termasuk {{ deletion.tasks }} tugas dan {{ deletion.notes }} catatan
          yang terhubung. Catatan umum tetap tersedia.
        </p>
        <p class="small muted">
          Anda dapat memulihkannya melalui tombol Pulihkan sebelum membuat
          perubahan berikutnya atau menutup tab.
        </p>
        <p
          v-if="error"
          class="form-error"
          role="alert"
        >
          {{ error }}
        </p>
        <footer class="modal-actions">
          <button
            class="button secondary"
            type="button"
            autofocus
            @click="overlays.close"
          >
            Batal</button
          ><button
            class="button danger"
            type="button"
            @click="remove"
          >
            Hapus data
          </button>
        </footer></template
      ><template v-else
        ><p>Data sudah tidak tersedia.</p>
        <button
          class="button"
          type="button"
          @click="overlays.close"
        >
          Tutup
        </button></template
      >
    </div>
  </BaseDialog>
</template>
