<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { formatMoment } from '../domain/dates.ts';
import { useQueryText } from '../composables/useQueryText.ts';
import { useWorkspaceStore } from '../features/workspace/store.ts';
import { useOverlayStore } from '../features/workspace/overlays.ts';
import PageHeading from '../components/PageHeading.vue';
import AppIcon from '../components/AppIcon.vue';
import EmptyState from '../components/EmptyState.vue';

const store = useWorkspaceStore();
const overlays = useOverlayStore();
const router = useRouter();
const query = useQueryText('q');
const projectId = useQueryText('project', 'all');
const selection = useQueryText('note');
const notes = computed(() =>
  store.data.notes
    .filter(
      (note) =>
        `${note.title} ${note.body}`
          .toLocaleLowerCase('id-ID')
          .includes(query.value.trim().toLocaleLowerCase('id-ID')) &&
        (projectId.value === 'all' ||
          (projectId.value === 'general'
            ? !note.projectId
            : note.projectId === projectId.value)),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
);
const selected = computed(
  () =>
    notes.value.find((note) => note.id === selection.value) || notes.value[0],
);
const project = computed(() =>
  store.data.projects.find((item) => item.id === selected.value?.projectId),
);
function reset() {
  void router.replace({ path: '/notes' });
}
</script>

<template>
  <PageHeading
    title="Tempat pikiran berlabuh."
    subtitle="Simpan ide, keputusan, dan hal kecil yang layak diingat."
    eyebrow="Catatan"
    ><button
      class="button"
      type="button"
      @click="overlays.open({ type: 'note' })"
    >
      <AppIcon name="plus" />Catatan baru
    </button></PageHeading
  >
  <div class="collection-toolbar">
    <label class="search-field"
      ><AppIcon name="search" /><span class="sr-only">Cari catatan</span
      ><input
        v-model="query"
        type="search"
        placeholder="Cari judul atau isi catatan..." /></label
    ><label class="field compact"
      ><span class="sr-only">Proyek catatan</span
      ><select v-model="projectId">
        <option value="all">Semua catatan</option>
        <option value="general">Catatan umum</option>
        <option
          v-for="item in store.data.projects"
          :key="item.id"
          :value="item.id"
        >
          {{ item.title }}{{ item.archived ? ' (arsip)' : '' }}
        </option>
      </select></label
    >
  </div>
  <p
    class="result-count"
    role="status"
  >
    {{ notes.length }} catatan ditampilkan
  </p>
  <div
    v-if="selected"
    class="notes-layout"
  >
    <aside
      class="notes-index"
      aria-label="Daftar catatan"
    >
      <ul>
        <li
          v-for="note in notes"
          :key="note.id"
        >
          <button
            type="button"
            class="note-index-item"
            :aria-pressed="selected.id === note.id"
            @click="selection = note.id"
          >
            <span class="small muted">{{ formatMoment(note.updatedAt) }}</span
            ><strong>{{ note.title }}</strong
            ><span class="note-excerpt">{{
              note.body || 'Catatan kosong'
            }}</span>
          </button>
        </li>
      </ul>
    </aside>
    <article class="note-reader">
      <header>
        <div>
          <RouterLink
            v-if="project"
            class="text-link small"
            :to="`/projects/${project.id}`"
            ><AppIcon name="folder" />{{ project.title }}</RouterLink
          ><span
            v-else
            class="eyebrow"
            >Catatan umum</span
          >
          <h2>{{ selected.title }}</h2>
          <p class="small muted">
            Diperbarui {{ formatMoment(selected.updatedAt) }}
          </p>
        </div>
        <button
          class="button secondary"
          type="button"
          @click="overlays.open({ type: 'note', id: selected.id })"
        >
          <AppIcon name="edit" />Edit
        </button>
      </header>
      <p class="note-body">
        {{
          selected.body ||
          'Catatan ini masih kosong. Pilih Edit untuk mulai menulis.'
        }}
      </p>
    </article>
  </div>
  <EmptyState
    v-else
    :title="
      query || projectId !== 'all'
        ? 'Catatan belum ditemukan'
        : 'Ada ide yang ingin disimpan?'
    "
    :description="
      query || projectId !== 'all'
        ? 'Coba kata lain atau kembalikan filter catatan.'
        : 'Buat catatan umum atau tautkan catatan ke proyek.'
    "
    icon="note"
    ><button
      v-if="query || projectId !== 'all'"
      class="button secondary"
      type="button"
      @click="reset"
    >
      Reset filter</button
    ><button
      v-else
      class="button"
      type="button"
      @click="overlays.open({ type: 'note' })"
    >
      Buat catatan pertama
    </button></EmptyState
  >
</template>
