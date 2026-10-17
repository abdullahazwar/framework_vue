<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { TaskInput, TaskStatus } from '../../domain/models.ts';
import {
  PRIORITIES,
  PRIORITY_LABELS,
  TASK_STATUSES,
  STATUS_LABELS,
} from '../../domain/models.ts';
import { useWorkspaceStore } from '../workspace/store.ts';
import { useOverlayStore } from '../workspace/overlays.ts';
import BaseDialog from '../../components/BaseDialog.vue';
import EmptyState from '../../components/EmptyState.vue';
import AppIcon from '../../components/AppIcon.vue';

const props = defineProps<{
  id?: string;
  projectId?: string;
  status?: TaskStatus;
  dueDate?: string;
}>();
const store = useWorkspaceStore();
const overlays = useOverlayStore();
const projects = computed(() =>
  store.data.projects.filter((project) => !project.archived),
);
const source = store.data.tasks.find((task) => task.id === props.id);
const form = reactive<TaskInput>({
  projectId:
    source?.projectId || props.projectId || projects.value[0]?.id || '',
  title: source?.title || '',
  description: source?.description || '',
  status: source?.status || props.status || 'todo',
  priority: source?.priority || 'normal',
  dueDate: source ? source.dueDate : props.dueDate || null,
});
const error = ref('');
function submit() {
  try {
    if (props.id && !source) throw new Error('Tugas tidak lagi tersedia.');
    store.task(form, props.id, source?.updatedAt);
    overlays.close();
  } catch (value) {
    error.value =
      value instanceof Error ? value.message : 'Tugas belum dapat disimpan.';
  }
}
</script>

<template>
  <BaseDialog
    :title="id ? 'Edit tugas' : 'Tugas baru'"
    description="Tulis tindakan yang jelas agar mudah dikerjakan."
    @close="overlays.close"
  >
    <EmptyState
      v-if="!projects.length"
      title="Buat proyek lebih dahulu"
      description="Setiap tugas berada dalam satu proyek. Mulai dengan proyek baru atau buka kembali proyek dari arsip."
      icon="folder"
      ><button
        class="button"
        type="button"
        @click="overlays.open({ type: 'project' })"
      >
        Buat proyek
      </button></EmptyState
    >
    <form
      v-else
      class="editor-form"
      @submit.prevent="submit"
    >
      <p
        v-if="error"
        class="form-error"
        role="alert"
      >
        {{ error }}
      </p>
      <label class="field"
        >Judul tugas<input
          v-model="form.title"
          required
          maxlength="160"
          autofocus
          placeholder="Misalnya, tulis draf pengantar"
      /></label>
      <label class="field"
        >Proyek<select
          v-model="form.projectId"
          required
        >
          <option
            v-for="project in projects"
            :key="project.id"
            :value="project.id"
          >
            {{ project.title }}
          </option>
        </select></label
      >
      <label class="field"
        ><span>Detail <span class="optional">opsional</span></span
        ><textarea
          v-model="form.description"
          rows="3"
          maxlength="5000"
          placeholder="Tambahkan konteks atau langkah yang diperlukan."
        />
      </label>
      <div class="form-grid">
        <label class="field"
          >Status<select v-model="form.status">
            <option
              v-for="status in TASK_STATUSES"
              :key="status"
              :value="status"
            >
              {{ STATUS_LABELS[status] }}
            </option>
          </select></label
        ><label class="field"
          >Prioritas<select v-model="form.priority">
            <option
              v-for="priority in PRIORITIES"
              :key="priority"
              :value="priority"
            >
              {{ PRIORITY_LABELS[priority] }}
            </option>
          </select></label
        >
      </div>
      <label class="field"
        ><span>Tenggat <span class="optional">opsional</span></span
        ><input
          v-model="form.dueDate"
          type="date"
          min="1900-01-01"
          max="2199-12-31"
      /></label>
      <footer class="modal-actions between">
        <button
          v-if="id"
          class="button danger-ghost"
          type="button"
          @click="overlays.open({ type: 'delete', kind: 'task', id })"
        >
          <AppIcon name="trash" />Hapus</button
        ><span v-else />
        <div class="button-group">
          <button
            class="button secondary"
            type="button"
            @click="overlays.close"
          >
            Batal</button
          ><button
            class="button"
            type="submit"
          >
            {{ id ? 'Simpan perubahan' : 'Tambah tugas' }}
          </button>
        </div>
      </footer>
    </form>
  </BaseDialog>
</template>
