<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { TASK_STATUSES, STATUS_LABELS } from '../domain/models.ts';
import { filterTasks, projectStats } from '../domain/selectors.ts';
import { formatDate } from '../domain/dates.ts';
import { useToday } from '../composables/useToday.ts';
import { useWorkspaceStore } from '../features/workspace/store.ts';
import { useOverlayStore } from '../features/workspace/overlays.ts';
import PageHeading from '../components/PageHeading.vue';
import EmptyState from '../components/EmptyState.vue';
import AppIcon from '../components/AppIcon.vue';
import TaskCard from '../features/tasks/TaskCard.vue';

const route = useRoute();
const store = useWorkspaceStore();
const overlays = useOverlayStore();
const today = useToday();
const query = ref('');
const error = ref('');
watch(
  () => route.params.id,
  () => {
    query.value = '';
    error.value = '';
  },
);
const project = computed(() =>
  store.data.projects.find((item) => item.id === route.params.id),
);
const stats = computed(() => projectStats(store.data, project.value?.id || ''));
const tasks = computed(() =>
  filterTasks(
    store.data,
    {
      projectId: project.value?.id,
      query: query.value,
      includeArchived: true,
      status: 'all',
    },
    today.value,
  ),
);
const notes = computed(() =>
  store.data.notes.filter((note) => note.projectId === project.value?.id),
);
function archive() {
  if (!project.value) return;
  try {
    store.archive(project.value.id, !project.value.archived);
    error.value = '';
  } catch (value) {
    error.value =
      value instanceof Error ? value.message : 'Proyek belum dapat diubah.';
  }
}
</script>

<template>
  <template v-if="project">
    <RouterLink
      class="back-link"
      to="/projects"
      ><AppIcon name="left" />Semua proyek</RouterLink
    >
    <PageHeading
      :title="project.title"
      :subtitle="project.description"
      :eyebrow="project.kind"
      ><button
        class="button secondary"
        type="button"
        @click="overlays.open({ type: 'project', id: project.id })"
      >
        <AppIcon name="edit" />Edit proyek</button
      ><button
        v-if="!project.archived"
        class="button"
        type="button"
        @click="overlays.open({ type: 'task', projectId: project.id })"
      >
        <AppIcon name="plus" />Tambah tugas
      </button></PageHeading
    >
    <div
      class="project-detail-meta"
      :data-project-theme="project.theme"
    >
      <div class="project-progress">
        <div class="progress-meta">
          <span>Kemajuan proyek</span
          ><strong>{{ stats.done }} / {{ stats.total }} tugas</strong>
        </div>
        <progress
          :value="stats.progress"
          max="100"
          :aria-label="`${stats.progress}% tugas selesai`"
        />
      </div>
      <span class="task-date"
        ><AppIcon name="calendar" />{{
          formatDate(project.deadline, { year: 'numeric' })
        }}</span
      ><span
        v-if="project.isSample"
        class="subtle-badge"
        >Proyek contoh</span
      >
      <div class="button-group">
        <button
          class="button text-button"
          type="button"
          @click="archive"
        >
          <AppIcon name="archive" />{{
            project.archived ? 'Buka kembali' : 'Arsipkan'
          }}</button
        ><button
          class="icon-button danger-ghost"
          type="button"
          aria-label="Hapus proyek"
          @click="
            overlays.open({ type: 'delete', kind: 'project', id: project.id })
          "
        >
          <AppIcon name="trash" />
        </button>
      </div>
    </div>
    <p
      v-if="error"
      class="form-error"
      role="alert"
    >
      {{ error }}
    </p>
    <div
      v-if="project.archived"
      class="information-banner"
    >
      <AppIcon name="archive" />
      <p>
        Proyek diarsipkan. Buka kembali untuk menambah atau mengubah tugas. Data
        proyek tetap tersedia.
      </p>
    </div>
    <div class="section-heading board-heading">
      <h2>Papan tugas</h2>
      <label class="search-field"
        ><AppIcon name="search" /><span class="sr-only"
          >Cari tugas dalam proyek</span
        ><input
          v-model="query"
          type="search"
          placeholder="Cari tugas dalam proyek..."
      /></label>
    </div>
    <p
      class="result-count"
      role="status"
    >
      {{ tasks.length }} tugas {{ query ? 'sesuai pencarian' : 'dalam proyek' }}
    </p>
    <div class="board">
      <section
        v-for="status in TASK_STATUSES"
        :key="status"
        class="board-column"
        :data-status="status"
        :aria-labelledby="`column-${status}`"
      >
        <header>
          <h2 :id="`column-${status}`">
            <span
              class="status-dot"
              aria-hidden="true"
            />{{ STATUS_LABELS[status]
            }}<span class="column-count">{{
              tasks.filter((task) => task.status === status).length
            }}</span>
          </h2>
          <button
            v-if="!project.archived"
            class="icon-button"
            type="button"
            :aria-label="`Tambah tugas ${STATUS_LABELS[status]}`"
            @click="
              overlays.open({ type: 'task', projectId: project.id, status })
            "
          >
            <AppIcon name="plus" />
          </button>
        </header>
        <TaskCard
          v-for="task in tasks.filter((task) => task.status === status)"
          :key="task.id"
          :task="task"
          :readonly="project.archived"
        />
        <p
          v-if="!tasks.some((task) => task.status === status)"
          class="column-empty"
        >
          {{
            query ? 'Tidak ada hasil yang cocok.' : 'Belum ada tugas di sini.'
          }}
        </p>
      </section>
    </div>
    <section class="content-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Keputusan & hal yang diingat</p>
          <h2>Catatan proyek</h2>
        </div>
        <button
          class="button secondary"
          type="button"
          @click="overlays.open({ type: 'note', projectId: project.id })"
        >
          <AppIcon name="plus" />Catatan baru
        </button>
      </div>
      <div
        v-if="notes.length"
        class="project-notes"
      >
        <RouterLink
          v-for="note in notes"
          :key="note.id"
          class="project-note-link"
          :to="{ path: '/notes', query: { note: note.id } }"
          ><AppIcon name="note" /><span>{{ note.title }}</span
          ><AppIcon name="arrow"
        /></RouterLink>
      </div>
      <p
        v-else
        class="muted"
      >
        Simpan ide atau hasil diskusi yang berkaitan dengan proyek ini.
      </p>
    </section>
  </template>
  <template v-else
    ><PageHeading
      title="Proyek tidak ditemukan."
      eyebrow="Proyek"
    /><EmptyState
      title="Mungkin sudah dihapus"
      description="Kembali ke daftar proyek untuk melanjutkan."
      icon="folder"
      ><RouterLink
        class="button"
        to="/projects"
        >Lihat proyek</RouterLink
      ></EmptyState
    ></template
  >
</template>
