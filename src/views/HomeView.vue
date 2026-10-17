<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useWorkspaceStore } from '../features/workspace/store.ts';
import { useOverlayStore } from '../features/workspace/overlays.ts';
import { filterTasks, workspaceStats } from '../domain/selectors.ts';
import { formatDate } from '../domain/dates.ts';
import { useToday } from '../composables/useToday.ts';
import PageHeading from '../components/PageHeading.vue';
import AppIcon from '../components/AppIcon.vue';
import EmptyState from '../components/EmptyState.vue';
import ProjectCard from '../features/projects/ProjectCard.vue';
import TaskRow from '../features/tasks/TaskRow.vue';

const store = useWorkspaceStore();
const overlays = useOverlayStore();
const today = useToday();
const stats = computed(() => workspaceStats(store.data, today.value));
const projects = computed(() =>
  store.data.projects
    .filter((project) => !project.archived)
    .slice(-3)
    .reverse(),
);
const attention = computed(() =>
  filterTasks(store.data, { status: 'open' }, today.value).slice(0, 5),
);
const notes = computed(() =>
  [...store.data.notes]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 2),
);
</script>

<template>
  <PageHeading
    title="Satu langkah lebih dekat."
    subtitle="Lihat yang sedang berjalan, lalu pilih pekerjaan berikutnya."
    :eyebrow="formatDate(today, { weekday: 'long', year: 'numeric' })"
    ><button
      class="button secondary"
      type="button"
      @click="overlays.open({ type: 'project' })"
    >
      <AppIcon name="plus" />Proyek baru
    </button></PageHeading
  >
  <section
    class="overview-strip"
    aria-label="Ringkasan proyek aktif"
  >
    <RouterLink to="/projects"
      ><span>Proyek aktif</span><strong>{{ stats.projects }}</strong
      ><small>Ruang untuk ide Anda</small></RouterLink
    >
    <RouterLink to="/tasks"
      ><span>Tugas terbuka</span><strong>{{ stats.open }}</strong
      ><small>Belum mulai & dikerjakan</small></RouterLink
    >
    <RouterLink to="/tasks?due=today"
      ><span>Tenggat hari ini</span><strong>{{ stats.today }}</strong
      ><small>Prioritaskan satu per satu</small></RouterLink
    >
    <RouterLink to="/tasks?status=done"
      ><span>Sudah selesai</span><strong>{{ stats.done }}</strong
      ><small>Dari seluruh proyek aktif</small></RouterLink
    >
  </section>
  <section class="content-section">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Ruang untuk dikerjakan</p>
        <h2>Proyek Anda</h2>
      </div>
      <RouterLink
        class="text-link"
        to="/projects"
        >Lihat semua <AppIcon name="arrow"
      /></RouterLink>
    </div>
    <div
      v-if="projects.length"
      class="project-grid"
    >
      <ProjectCard
        v-for="project in projects"
        :key="project.id"
        :project="project"
      />
    </div>
    <EmptyState
      v-else
      title="Mulai dari satu proyek"
      description="Kumpulkan ide dan langkah kecilnya dalam satu tempat."
      icon="folder"
      ><button
        class="button"
        type="button"
        @click="overlays.open({ type: 'project' })"
      >
        Buat proyek pertama
      </button></EmptyState
    >
  </section>
  <div class="home-columns">
    <section class="content-section attention-section">
      <div class="section-heading">
        <h2>Langkah berikutnya</h2>
        <RouterLink
          class="text-link"
          to="/tasks"
          >Semua tugas <AppIcon name="arrow"
        /></RouterLink>
      </div>
      <RouterLink
        v-if="stats.overdue"
        class="due-callout"
        to="/tasks?due=overdue"
        ><AppIcon name="alert" /><span
          >{{ stats.overdue }} tugas melewati tenggat.</span
        ><span class="text-link">Tinjau <AppIcon name="arrow" /></span
      ></RouterLink>
      <ul
        v-if="attention.length"
        class="task-list"
      >
        <TaskRow
          v-for="task in attention"
          :key="task.id"
          :task="task"
          show-project
        />
      </ul>
      <EmptyState
        v-else
        title="Ruang untuk bernapas"
        description="Tidak ada tugas terbuka pada proyek aktif. Tambahkan langkah berikutnya ketika sudah siap."
        icon="check"
      />
    </section>
    <section class="content-section recent-notes">
      <div class="section-heading">
        <h2>Catatan terakhir</h2>
        <RouterLink
          class="text-link"
          to="/notes"
          >Buka catatan <AppIcon name="arrow"
        /></RouterLink>
      </div>
      <RouterLink
        v-for="note in notes"
        :key="note.id"
        class="note-preview"
        :to="{ path: '/notes', query: { note: note.id } }"
        ><AppIcon name="note" />
        <h3>{{ note.title }}</h3>
        <p>{{ note.body || 'Catatan ini masih kosong.' }}</p></RouterLink
      ><EmptyState
        v-if="!notes.length"
        title="Simpan pikiran yang lewat"
        description="Tulis ide atau keputusan sebelum terlupa."
        icon="note"
        ><button
          class="button secondary"
          type="button"
          @click="overlays.open({ type: 'note' })"
        >
          Buat catatan
        </button></EmptyState
      >
    </section>
  </div>
</template>
