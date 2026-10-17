<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useWorkspaceStore } from '../workspace/store.ts';
import { useOverlayStore } from '../workspace/overlays.ts';
import BaseDialog from '../../components/BaseDialog.vue';
import AppIcon from '../../components/AppIcon.vue';

const props = defineProps<{ id?: string; projectId?: string }>();
const store = useWorkspaceStore();
const overlays = useOverlayStore();
const route = useRoute();
const router = useRouter();
const source = store.data.notes.find((note) => note.id === props.id);
const form = reactive({
  title: source?.title || '',
  body: source?.body || '',
  projectId: source?.projectId || props.projectId || '',
});
const error = ref('');
function submit() {
  try {
    if (props.id && !source) throw new Error('Catatan tidak lagi tersedia.');
    const key = store.note(
      { ...form, projectId: form.projectId || null },
      props.id,
      source?.updatedAt,
    );
    overlays.close();
    if (route.path === '/notes')
      void router.replace({ path: '/notes', query: { note: key } });
  } catch (value) {
    error.value =
      value instanceof Error ? value.message : 'Catatan belum dapat disimpan.';
  }
}
</script>

<template>
  <BaseDialog
    :title="id ? 'Edit catatan' : 'Catatan baru'"
    description="Simpan ide, keputusan, atau hal yang ingin diingat."
    wide
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
        >Judul catatan<input
          v-model="form.title"
          required
          maxlength="140"
          autofocus
          placeholder="Beri judul yang mudah ditemukan"
      /></label>
      <label class="field"
        >Tautkan ke proyek<select v-model="form.projectId">
          <option value="">Catatan umum</option>
          <option
            v-for="project in store.data.projects"
            :key="project.id"
            :value="project.id"
          >
            {{ project.title }}{{ project.archived ? ' (arsip)' : '' }}
          </option>
        </select></label
      >
      <label class="field"
        >Isi catatan<textarea
          v-model="form.body"
          class="note-textarea"
          rows="10"
          maxlength="50000"
          placeholder="Mulai menulis di sini..."
        /><span class="field-help"
          >Teks biasa · {{ form.body.length.toLocaleString('id-ID') }} / 50.000
          karakter</span
        ></label
      >
      <footer class="modal-actions between">
        <button
          v-if="id"
          class="button danger-ghost"
          type="button"
          @click="overlays.open({ type: 'delete', kind: 'note', id })"
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
            Simpan catatan
          </button>
        </div>
      </footer>
    </form>
  </BaseDialog>
</template>
