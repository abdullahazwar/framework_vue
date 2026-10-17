<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { PROJECT_KINDS } from '../domain/models.ts';
import { useWorkspaceStore } from '../features/workspace/store.ts';
import { useOverlayStore } from '../features/workspace/overlays.ts';
import { useQueryText } from '../composables/useQueryText.ts';
import PageHeading from '../components/PageHeading.vue';
import AppIcon from '../components/AppIcon.vue';
import EmptyState from '../components/EmptyState.vue';
import ProjectCard from '../features/projects/ProjectCard.vue';

const store = useWorkspaceStore();
const overlays = useOverlayStore();
const router = useRouter();
const search = useQueryText('q');
const kind = useQueryText('kind', 'all');
const archive = useQueryText('archive', '0');
const projects = computed(() =>
  store.data.projects
    .filter(
      (project) =>
        project.archived === (archive.value === '1') &&
        (kind.value === 'all' || project.kind === kind.value) &&
        `${project.title} ${project.description}`
          .toLocaleLowerCase('id-ID')
          .includes(search.value.trim().toLocaleLowerCase('id-ID')),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
);
function reset() {
  void router.replace({
    path: '/projects',
    query: archive.value === '1' ? { archive: '1' } : {},
  });
}
</script>

<template>
  <PageHeading
    title="Ruang untuk ide Anda."
    subtitle="Setiap proyek punya tujuan, langkah, dan catatannya sendiri."
    eyebrow="Proyek"
    ><button
      class="button"
      type="button"
      @click="overlays.open({ type: 'project' })"
    >
      <AppIcon name="plus" />Proyek baru
    </button></PageHeading
  >
  <div class="collection-toolbar">
    <div
      class="segmented"
      aria-label="Status proyek"
    >
      <button
        type="button"
        :aria-pressed="archive !== '1'"
        @click="archive = '0'"
      >
        Aktif
        <span>{{
          store.data.projects.filter((p) => !p.archived).length
        }}</span></button
      ><button
        type="button"
        :aria-pressed="archive === '1'"
        @click="archive = '1'"
      >
        Arsip
        <span>{{ store.data.projects.filter((p) => p.archived).length }}</span>
      </button>
    </div>
    <div class="filter-inline">
      <label class="search-field"
        ><AppIcon name="search" /><span class="sr-only">Cari proyek</span
        ><input
          v-model="search"
          type="search"
          placeholder="Cari proyek..." /></label
      ><label class="field compact"
        ><span class="sr-only">Kategori proyek</span
        ><select v-model="kind">
          <option value="all">Semua kategori</option>
          <option
            v-for="item in PROJECT_KINDS"
            :key="item"
          >
            {{ item }}
          </option>
        </select></label
      >
    </div>
  </div>
  <p
    class="result-count"
    role="status"
  >
    {{ projects.length }} proyek
    {{ archive === '1' ? 'dalam arsip' : 'aktif' }} ditampilkan
  </p>
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
    :title="
      search || kind !== 'all'
        ? 'Proyek belum ditemukan'
        : archive === '1'
          ? 'Arsip masih kosong'
          : 'Satu ide bisa jadi awal'
    "
    :description="
      search || kind !== 'all'
        ? 'Coba kata lain atau kembalikan filter.'
        : archive === '1'
          ? 'Proyek yang diarsipkan tetap dapat dibuka kembali.'
          : 'Buat proyek dan tambahkan langkah pertama Anda.'
    "
    icon="folder"
    ><button
      v-if="search || kind !== 'all'"
      class="button secondary"
      type="button"
      @click="reset"
    >
      Reset filter</button
    ><button
      v-else-if="archive !== '1'"
      class="button"
      type="button"
      @click="overlays.open({ type: 'project' })"
    >
      Buat proyek
    </button></EmptyState
  >
</template>
