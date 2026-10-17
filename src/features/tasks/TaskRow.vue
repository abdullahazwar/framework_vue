<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import type { Task } from '../../domain/models.ts';
import { PRIORITY_LABELS } from '../../domain/models.ts';
import { formatDate, isOverdue } from '../../domain/dates.ts';
import { useToday } from '../../composables/useToday.ts';
import { useWorkspaceStore } from '../workspace/store.ts';
import { useOverlayStore } from '../workspace/overlays.ts';
import AppIcon from '../../components/AppIcon.vue';

const props = defineProps<{
  task: Task;
  showProject?: boolean;
  readonly?: boolean;
}>();
const store = useWorkspaceStore();
const overlays = useOverlayStore();
const today = useToday();
const project = computed(() =>
  store.data.projects.find((item) => item.id === props.task.projectId),
);
const error = ref('');
function toggle(event: Event) {
  error.value = '';
  try {
    store.task(
      { ...props.task, status: props.task.status === 'done' ? 'todo' : 'done' },
      props.task.id,
      props.task.updatedAt,
    );
  } catch (value) {
    error.value =
      value instanceof Error ? value.message : 'Tugas belum dapat diperbarui.';
    (event.target as HTMLInputElement).checked = props.task.status === 'done';
  }
}
</script>

<template>
  <li
    class="task-row"
    :class="{ 'task-complete': task.status === 'done' }"
  >
    <input
      class="task-checkbox"
      type="checkbox"
      :checked="task.status === 'done'"
      :disabled="readonly || project?.archived"
      :aria-label="`${task.status === 'done' ? 'Buka kembali' : 'Selesaikan'} ${task.title}`"
      @change="toggle"
    />
    <div class="task-row-main">
      <button
        class="task-title"
        type="button"
        :disabled="readonly || project?.archived"
        @click="overlays.open({ type: 'task', id: task.id })"
      >
        {{ task.title }}</button
      ><RouterLink
        v-if="showProject && project"
        class="task-project"
        :to="`/projects/${project.id}`"
        >{{ project.title }}</RouterLink
      >
      <p
        v-if="error"
        class="field-error"
        role="alert"
      >
        {{ error }}
      </p>
    </div>
    <span
      class="priority-label"
      :data-priority="task.priority"
      ><span aria-hidden="true" />{{ PRIORITY_LABELS[task.priority] }}</span
    >
    <span
      class="task-date"
      :class="{ overdue: isOverdue(task.dueDate, task.status, today) }"
      ><AppIcon name="calendar" />{{ formatDate(task.dueDate)
      }}<span
        v-if="isOverdue(task.dueDate, task.status, today)"
        class="sr-only"
        >, terlambat</span
      ></span
    >
    <button
      v-if="!readonly && !project?.archived"
      type="button"
      class="icon-button"
      :aria-label="`Edit ${task.title}`"
      @click="overlays.open({ type: 'task', id: task.id })"
    >
      <AppIcon name="edit" />
    </button>
  </li>
</template>
