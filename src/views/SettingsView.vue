<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { Appearance, Backup } from '../domain/models.ts';
import { dateKey, formatMoment } from '../domain/dates.ts';
import { parseBackup } from '../domain/validation.ts';
import { serializeBackup } from '../domain/backup.ts';
import { emptyWorkspace } from '../domain/workspace.ts';
import { downloadText } from '../composables/download.ts';
import { useWorkspaceStore } from '../features/workspace/store.ts';
import PageHeading from '../components/PageHeading.vue';
import AppIcon from '../components/AppIcon.vue';
import BaseDialog from '../components/BaseDialog.vue';

const store = useWorkspaceStore();
const form = reactive({ ...store.data.preferences });
const error = ref('');
const importing = ref(false);
const pending = ref<Backup | null>(null);
const showReset = ref(false);
const fileInput = ref<HTMLInputElement>();
const appearances: { id: Appearance; label: string; icon: string }[] = [
  { id: 'light', label: 'Terang', icon: 'sun' },
  { id: 'dark', label: 'Gelap', icon: 'moon' },
  { id: 'system', label: 'Ikuti perangkat', icon: 'device' },
];
const changed = computed(
  () =>
    form.workspaceName !== store.data.preferences.workspaceName ||
    form.appearance !== store.data.preferences.appearance,
);
watch(
  () => store.data.preferences,
  (value) => Object.assign(form, value),
);
function save() {
  try {
    store.preferences(form);
    error.value = '';
  } catch (value) {
    error.value =
      value instanceof Error
        ? value.message
        : 'Pengaturan belum dapat disimpan.';
  }
}
function backup() {
  try {
    downloadText(`ruang-kerja-${dateKey()}.json`, serializeBackup(store.data));
    error.value = '';
    store.inform('Cadangan JSON telah dibuat.');
  } catch (value) {
    error.value =
      value instanceof Error ? value.message : 'Cadangan belum dapat dibuat.';
  }
}
async function inspectFile(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  error.value = '';
  importing.value = true;
  try {
    if (file.size > 5 * 1024 * 1024)
      throw new Error('Berkas cadangan maksimal 5 MB.');
    pending.value = parseBackup(await file.text());
  } catch (value) {
    error.value =
      value instanceof Error ? value.message : 'Berkas belum dapat dibaca.';
  } finally {
    importing.value = false;
    target.value = '';
  }
}
function restore() {
  if (!pending.value) return;
  try {
    store.replace(pending.value.data);
    pending.value = null;
    error.value = '';
  } catch (value) {
    error.value =
      value instanceof Error ? value.message : 'Data belum dapat dipulihkan.';
  }
}
function reset() {
  try {
    store.replace(emptyWorkspace());
    showReset.value = false;
    error.value = '';
  } catch (value) {
    error.value =
      value instanceof Error ? value.message : 'Ruang belum dapat dikosongkan.';
  }
}
</script>

<template>
  <PageHeading
    title="Ruang yang terasa milik Anda."
    subtitle="Atur tampilan dan rawat cadangan data Anda."
    eyebrow="Pengaturan"
  />
  <p
    v-if="error && !pending && !showReset"
    class="form-error"
    role="alert"
  >
    {{ error }}
  </p>
  <div class="settings-layout">
    <section class="settings-section">
      <div>
        <p class="eyebrow">Preferensi</p>
        <h2>Ruang pribadi</h2>
        <p class="muted">Nama dan tampilan berlaku pada browser ini.</p>
      </div>
      <form
        class="settings-form"
        @submit.prevent="save"
      >
        <label class="field"
          >Nama ruang<input
            v-model="form.workspaceName"
            maxlength="50"
            required
        /></label>
        <fieldset class="field">
          <legend>Tampilan</legend>
          <div class="appearance-choices">
            <label
              v-for="appearance in appearances"
              :key="appearance.id"
              ><input
                v-model="form.appearance"
                type="radio"
                name="appearance"
                :value="appearance.id"
              /><AppIcon :name="appearance.icon" /><span>{{
                appearance.label
              }}</span></label
            >
          </div>
        </fieldset>
        <div>
          <button
            class="button"
            type="submit"
            :disabled="!changed"
          >
            Simpan pengaturan
          </button>
        </div>
      </form>
    </section>
    <section class="settings-section">
      <div>
        <p class="eyebrow">Data Anda</p>
        <h2>Cadangan & pemulihan</h2>
        <p class="muted">
          Data berada pada penyimpanan browser perangkat ini. Cadangan membantu
          memindahkannya ke perangkat lain.
        </p>
      </div>
      <div class="data-settings">
        <dl class="data-counts">
          <div>
            <dt>Proyek</dt>
            <dd>{{ store.data.projects.length }}</dd>
          </div>
          <div>
            <dt>Tugas</dt>
            <dd>{{ store.data.tasks.length }}</dd>
          </div>
          <div>
            <dt>Catatan</dt>
            <dd>{{ store.data.notes.length }}</dd>
          </div>
        </dl>
        <div class="backup-actions">
          <div>
            <h3>Unduh cadangan</h3>
            <p class="muted small">
              Satu file JSON berisi proyek, tugas, catatan, dan pengaturan ruang
              ini.
            </p>
            <button
              class="button secondary"
              type="button"
              @click="backup"
            >
              <AppIcon name="download" />Unduh backup JSON
            </button>
          </div>
          <div>
            <h3>Pulihkan cadangan</h3>
            <p class="muted small">
              Pilih cadangan Ruang Kerja. Anda dapat meninjau isinya sebelum
              mengganti data. Maksimal 5 MB.
            </p>
            <input
              ref="fileInput"
              class="sr-only"
              type="file"
              accept=".json,application/json"
              aria-label="Pilih cadangan JSON"
              @change="inspectFile"
            /><button
              class="button secondary"
              type="button"
              :disabled="importing"
              @click="fileInput?.click()"
            >
              <AppIcon name="upload" />{{
                importing ? 'Memeriksa berkas...' : 'Pilih cadangan JSON'
              }}
            </button>
          </div>
        </div>
        <div class="storage-explanation">
          <AppIcon name="device" />
          <p>
            Data tidak dikirim ke server dan belum tersinkron antarperangkat.
            Menghapus data browser dapat menghapus ruang ini. Data awal berlabel
            Contoh boleh diubah atau dihapus.
          </p>
        </div>
        <div
          v-if="store.unreadableRaw !== null"
          class="recovery-box"
        >
          <h3>Data lokal belum dapat dibaca</h3>
          <p class="muted">
            Unduh salinan mentah sebelum memilih cadangan lain atau ruang
            kosong.
          </p>
          <button
            class="button secondary"
            type="button"
            @click="
              downloadText(
                `ruang-kerja-data-mentah-${dateKey()}.txt`,
                store.unreadableRaw || '',
                'text/plain',
              )
            "
          >
            <AppIcon name="download" />Unduh data mentah
          </button>
        </div>
      </div>
    </section>
    <section class="settings-section reset-section">
      <div>
        <p class="eyebrow">Mulai kembali</p>
        <h2>Ruang kosong</h2>
        <p class="muted">
          Hapus seluruh proyek, tugas, catatan, dan pengaturan dari ruang ini.
          Unduh cadangan jika ingin menyimpannya.
        </p>
      </div>
      <div>
        <button
          class="button danger-ghost"
          type="button"
          @click="
            error = '';
            showReset = true;
          "
        >
          <AppIcon name="trash" />Kosongkan ruang kerja
        </button>
      </div>
    </section>
  </div>
  <BaseDialog
    v-if="pending"
    title="Pulihkan cadangan?"
    @close="
      pending = null;
      error = '';
    "
    ><div class="confirm-body">
      <p>Cadangan dibuat {{ formatMoment(pending.exportedAt) }}.</p>
      <dl class="data-counts">
        <div>
          <dt>Proyek</dt>
          <dd>{{ pending.data.projects.length }}</dd>
        </div>
        <div>
          <dt>Tugas</dt>
          <dd>{{ pending.data.tasks.length }}</dd>
        </div>
        <div>
          <dt>Catatan</dt>
          <dd>{{ pending.data.notes.length }}</dd>
        </div>
      </dl>
      <p>
        Data ruang ini akan diganti dengan isi cadangan di atas, termasuk
        pengaturannya.
      </p>
      <p
        v-if="error"
        class="form-error"
        role="alert"
      >
        {{ error }}
      </p>
      <footer class="modal-actions">
        <button
          class="button secondary"
          type="button"
          autofocus
          @click="pending = null"
        >
          Batal</button
        ><button
          class="button"
          type="button"
          @click="restore"
        >
          Ganti dengan cadangan
        </button>
      </footer>
    </div></BaseDialog
  >
  <BaseDialog
    v-if="showReset"
    title="Kosongkan ruang kerja?"
    @close="
      showReset = false;
      error = '';
    "
    ><div class="confirm-body">
      <p>
        {{ store.data.projects.length }} proyek,
        {{ store.data.tasks.length }} tugas, dan
        {{ store.data.notes.length }} catatan akan dihapus dari ruang ini.
        Pengaturan kembali ke awal.
      </p>
      <p class="muted">
        Tindakan ini tidak menyediakan tombol Pulihkan. Pastikan cadangan sudah
        diunduh bila masih diperlukan.
      </p>
      <p
        v-if="error"
        class="form-error"
        role="alert"
      >
        {{ error }}
      </p>
      <footer class="modal-actions">
        <button
          class="button secondary"
          type="button"
          autofocus
          @click="showReset = false"
        >
          Batal</button
        ><button
          class="button danger"
          type="button"
          @click="reset"
        >
          Ya, kosongkan ruang
        </button>
      </footer>
    </div></BaseDialog
  >
</template>
