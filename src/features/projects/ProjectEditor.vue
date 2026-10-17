<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  PROJECT_KINDS,
  PROJECT_THEMES,
  THEME_LABELS,
} from '../../domain/models.ts';
import type { ProjectInput } from '../../domain/models.ts';
import { useWorkspaceStore } from '../workspace/store.ts';
import { useOverlayStore } from '../workspace/overlays.ts';
import BaseDialog from '../../components/BaseDialog.vue';

const props = defineProps<{ id?: string }>();
const store = useWorkspaceStore();
const overlays = useOverlayStore();
const router = useRouter();
const source = store.data.projects.find((project) => project.id === props.id);
const form = reactive<ProjectInput>({
  title: source?.title || '',
  description: source?.description || '',
  kind: source?.kind || 'Personal',
  theme: source?.theme || 'forest',
  deadline: source?.deadline || null,
});
const error = ref('');
function submit() {
  try {
    if (props.id && !source) throw new Error('Proyek tidak lagi tersedia.');
    const id = store.project(form, props.id, source?.updatedAt);
    overlays.close();
    if (!props.id) void router.push(`/projects/${id}`);
  } catch (value) {
    error.value =
      value instanceof Error ? value.message : 'Proyek belum dapat disimpan.';
  }
}
</script>

<template>
  <BaseDialog
    :title="id ? 'Edit proyek' : 'Proyek baru'"
    description="Mulai dari satu tujuan yang jelas, lalu pecah menjadi tugas kecil."
    @close="overlays.close"
  >
    <form
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
        >Nama proyek<input
          v-model="form.title"
          required
          maxlength="100"
          autofocus
          placeholder="Misalnya, portofolio pribadi"
      /></label>
      <label class="field"
        ><span>Deskripsi <span class="optional">opsional</span></span
        ><textarea
          v-model="form.description"
          rows="3"
          maxlength="2000"
          placeholder="Apa yang ingin diselesaikan?"
        />
      </label>
      <div class="form-grid">
        <label class="field"
          >Kategori<select v-model="form.kind">
            <option
              v-for="kind in PROJECT_KINDS"
              :key="kind"
            >
              {{ kind }}
            </option>
          </select></label
        ><label class="field"
          ><span>Tenggat <span class="optional">opsional</span></span
          ><input
            v-model="form.deadline"
            type="date"
            min="1900-01-01"
            max="2199-12-31"
        /></label>
      </div>
      <fieldset class="field">
        <legend>Penanda proyek</legend>
        <div class="theme-choices">
          <label
            v-for="theme in PROJECT_THEMES"
            :key="theme"
            class="theme-choice"
            :data-project-theme="theme"
            ><input
              v-model="form.theme"
              type="radio"
              name="project-theme"
              :value="theme"
            /><span
              class="project-dot"
              aria-hidden="true"
            />{{ THEME_LABELS[theme] }}</label
          >
        </div>
      </fieldset>
      <footer class="modal-actions">
        <button
          type="button"
          class="button secondary"
          @click="overlays.close"
        >
          Batal</button
        ><button
          class="button"
          type="submit"
        >
          {{ id ? 'Simpan perubahan' : 'Buat proyek' }}
        </button>
      </footer>
    </form>
  </BaseDialog>
</template>
