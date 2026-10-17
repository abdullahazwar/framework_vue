<script setup lang="ts">
import { ref } from 'vue';
import type { Task, TaskStatus } from '../../domain/models.ts';
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_STATUSES,
} from '../../domain/models.ts';
import { formatDate, isOverdue } from '../../domain/dates.ts';
import { useToday } from '../../composables/useToday.ts';
import { useWorkspaceStore } from '../workspace/store.ts';
import { useOverlayStore } from '../workspace/overlays.ts';
import AppIcon from '../../components/AppIcon.vue';

const props = defineProps<{ task: Task; readonly?: boolean }>();
const store = useWorkspaceStore();
const overlays = useOverlayStore();
const today = useToday();
const error = ref('');
function move(event: Event) {
  const target = event.target as HTMLSelectElement;
  const status = target.value as TaskStatus;
  try {
    store.task({ ...props.task, status }, props.task.id, props.task.updatedAt);
    error.value = '';
  } catch (value) {
    error.value =
      value instanceof Error ? value.message : 'Status belum dapat diubah.';
    target.value = props.task.status;
  }
}
</script>

<template>
  <article
    class="task-card"
    :data-status="task.status"
  >
    <div class="task-card-top">
      <span
        class="priority-label"
        :data-priority="task.priority"
        ><span aria-hidden="true" />{{ PRIORITY_LABELS[task.priority] }}</span
      ><button
        v-if="!readonly"
        class="icon-button"
        type="button"
        :aria-label="`Edit ${task.title}`"
        @click="overlays.open({ type: 'task', id: task.id })"
      >
        <AppIcon name="edit" />
      </button>
    </div>
    <h3>{{ task.title }}</h3>
    <p
      v-if="task.description"
      class="task-card-description"
    >
      {{ task.description }}
    </p>
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
    <label class="task-move"
      ><span class="sr-only">Status {{ task.title }}</span
      ><select
        :value="task.status"
        :disabled="readonly"
        @change="move"
      >
        <option
          v-for="status in TASK_STATUSES"
          :key="status"
          :value="status"
        >
          {{ STATUS_LABELS[status] }}
        </option>
      </select></label
    >
    <p
      v-if="error"
      class="field-error"
      role="alert"
    >
      {{ error }}
    </p>
  </article>
</template>
