<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { Project } from '../../domain/models.ts';
import { projectStats } from '../../domain/selectors.ts';
import { formatDate } from '../../domain/dates.ts';
import { useWorkspaceStore } from '../workspace/store.ts';
import AppIcon from '../../components/AppIcon.vue';

const props = defineProps<{ project: Project }>();
const store = useWorkspaceStore();
const stats = computed(() => projectStats(store.data, props.project.id));
</script>

<template>
  <article
    class="project-card"
    :data-project-theme="project.theme"
  >
    <div class="project-card-top">
      <span class="project-glyph"><AppIcon name="folder" /></span
      ><span class="subtle-badge">{{
        project.archived ? 'Arsip' : project.kind
      }}</span>
    </div>
    <h3>
      <RouterLink :to="`/projects/${project.id}`">{{
        project.title
      }}</RouterLink>
    </h3>
    <p class="project-excerpt">
      {{ project.description || 'Belum ada deskripsi proyek.' }}
    </p>
    <div class="progress-meta">
      <span>{{ stats.done }} dari {{ stats.total }} tugas</span
      ><span>{{ stats.progress }}%</span>
    </div>
    <progress
      :value="stats.progress"
      max="100"
      :aria-label="`Kemajuan ${project.title}: ${stats.done} dari ${stats.total} tugas selesai`"
    />
    <footer>
      <span><AppIcon name="calendar" />{{ formatDate(project.deadline) }}</span
      ><span
        v-if="project.isSample"
        class="sample-label"
        >Contoh</span
      ><AppIcon
        v-else
        name="arrow"
      />
    </footer>
  </article>
</template>
