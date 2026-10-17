<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  PRIORITIES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_STATUSES,
} from '../domain/models.ts';
import type { TaskFilters } from '../domain/selectors.ts';
import { filterTasks } from '../domain/selectors.ts';
import { useQueryText } from '../composables/useQueryText.ts';
import { useToday } from '../composables/useToday.ts';
import { useWorkspaceStore } from '../features/workspace/store.ts';
import { useOverlayStore } from '../features/workspace/overlays.ts';
import PageHeading from '../components/PageHeading.vue';
import EmptyState from '../components/EmptyState.vue';
import AppIcon from '../components/AppIcon.vue';
import TaskRow from '../features/tasks/TaskRow.vue';

const store = useWorkspaceStore();
const overlays = useOverlayStore();
const router = useRouter();
const today = useToday();
const query = useQueryText('q');
const projectId = useQueryText('project');
const status = useQueryText('status', 'open');
const priority = useQueryText('priority', 'all');
const due = useQueryText('due', 'all');
const limit = ref(50);
const filters = computed<TaskFilters>(() => ({
  query: query.value,
  projectId: projectId.value,
  status: ['all', 'open', ...TASK_STATUSES].includes(status.value)
    ? (status.value as TaskFilters['status'])
    : 'open',
  priority: ['all', ...PRIORITIES].includes(priority.value)
    ? (priority.value as TaskFilters['priority'])
    : 'all',
  due: ['all', 'today', 'week', 'overdue', 'undated'].includes(due.value)
    ? (due.value as TaskFilters['due'])
    : 'all',
}));
const tasks = computed(() =>
  filterTasks(store.data, filters.value, today.value),
);
const filtered = computed(() =>
  Boolean(
    query.value ||
      projectId.value ||
      status.value !== 'open' ||
      priority.value !== 'all' ||
      due.value !== 'all',
  ),
);
watch(filters, () => {
  limit.value = 50;
});
function reset() {
  void router.replace({ path: '/tasks' });
}
</script>

<template>
  <PageHeading
    title="Langkah kecil, kemajuan nyata."
    subtitle="Temukan tugas dari seluruh proyek aktif. Proyek arsip tetap dapat dibaca dari halaman proyek."
    eyebrow="Tugas"
    ><button
      class="button"
      type="button"
      @click="overlays.open({ type: 'task' })"
    >
      <AppIcon name="plus" />Tambah tugas
    </button></PageHeading
  >
  <div class="task-filters">
    <label class="search-field"
      ><AppIcon name="search" /><span class="sr-only">Cari tugas</span
      ><input
        v-model="query"
        type="search"
        placeholder="Cari tugas atau proyek..." /></label
    ><label class="field compact"
      >Proyek<select v-model="projectId">
        <option value="">Semua proyek</option>
        <option
          v-for="project in store.data.projects.filter((p) => !p.archived)"
          :key="project.id"
          :value="project.id"
        >
          {{ project.title }}
        </option>
      </select></label
    ><label class="field compact"
      >Status<select v-model="status">
        <option value="open">Belum selesai</option>
        <option value="all">Semua status</option>
        <option
          v-for="item in TASK_STATUSES"
          :key="item"
          :value="item"
        >
          {{ STATUS_LABELS[item] }}
        </option>
      </select></label
    ><label class="field compact"
      >Prioritas<select v-model="priority">
        <option value="all">Semua prioritas</option>
        <option
          v-for="item in PRIORITIES"
          :key="item"
          :value="item"
        >
          {{ PRIORITY_LABELS[item] }}
        </option>
      </select></label
    ><label class="field compact"
      >Tenggat<select v-model="due">
        <option value="all">Semua tenggat</option>
        <option value="overdue">Terlambat</option>
        <option value="today">Hari ini</option>
        <option value="week">7 hari ke depan</option>
        <option value="undated">Tanpa tenggat</option>
      </select></label
    >
  </div>
  <div class="results-heading">
    <p
      class="result-count"
      role="status"
    >
      {{ tasks.length }} tugas ditemukan
    </p>
    <button
      v-if="filtered"
      class="text-link"
      type="button"
      @click="reset"
    >
      Reset filter
    </button>
  </div>
  <section
    v-if="tasks.length"
    class="task-surface"
    aria-label="Daftar tugas"
  >
    <ul class="task-list">
      <TaskRow
        v-for="task in tasks.slice(0, limit)"
        :key="task.id"
        :task="task"
        show-project
      />
    </ul>
    <div
      v-if="tasks.length > limit"
      class="load-more"
    >
      <p class="muted small">
        {{ limit }} dari {{ tasks.length }} tugas ditampilkan
      </p>
      <button
        class="button secondary"
        type="button"
        @click="limit += 50"
      >
        Tampilkan 50 tugas berikutnya
      </button>
    </div>
  </section>
  <EmptyState
    v-else
    :title="filtered ? 'Belum ada tugas yang cocok' : 'Belum ada tugas terbuka'"
    :description="
      filtered
        ? 'Coba kata pencarian lain atau kembalikan filter.'
        : 'Mulai dengan satu tindakan kecil pada proyek Anda.'
    "
    icon="tasks"
    ><button
      v-if="filtered"
      class="button secondary"
      type="button"
      @click="reset"
    >
      Reset pencarian</button
    ><button
      v-else
      class="button"
      type="button"
      @click="overlays.open({ type: 'task' })"
    >
      Tambah tugas
    </button></EmptyState
  >
</template>
