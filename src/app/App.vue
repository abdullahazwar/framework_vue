<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { navigation } from './navigation.ts';
import { useWorkspaceStore } from '../features/workspace/store.ts';
import { useOverlayStore } from '../features/workspace/overlays.ts';
import { STORAGE_KEY } from '../features/workspace/repository.ts';
import EditorHost from '../features/workspace/EditorHost.vue';
import AppIcon from '../components/AppIcon.vue';

const store = useWorkspaceStore();
const overlays = useOverlayStore();
const route = useRoute();
const mobileMenu = ref<HTMLDetailsElement>();
function active(path: string) {
  return path === '/' ? route.path === '/' : route.path.startsWith(path);
}
function focusMain() {
  const main = document.getElementById('main-content');
  main?.focus();
  main?.scrollIntoView({ behavior: 'instant' });
}
function storageChanged(event: StorageEvent) {
  if (event.key === STORAGE_KEY || event.key === null) store.checkExternal();
}
function retry() {
  try {
    store.retryStorage();
  } catch (value) {
    store.inform(
      value instanceof Error ? value.message : 'Penyimpanan belum tersedia.',
    );
  }
}
function undo() {
  try {
    store.undo();
  } catch (value) {
    store.inform(
      value instanceof Error ? value.message : 'Data belum dapat dipulihkan.',
    );
  }
}
function closeMenu(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !mobileMenu.value?.open) return;
  mobileMenu.value.open = false;
  mobileMenu.value.querySelector('summary')?.focus();
  event.preventDefault();
}
watch(
  () => route.fullPath,
  () => mobileMenu.value?.removeAttribute('open'),
);
watch(
  () => overlays.current,
  (value) => {
    if (value) mobileMenu.value?.removeAttribute('open');
  },
);
onMounted(() => window.addEventListener('storage', storageChanged));
onUnmounted(() => window.removeEventListener('storage', storageChanged));
</script>

<template>
  <div
    class="app-shell"
    :data-appearance="store.data.preferences.appearance"
  >
    <a
      class="skip-link"
      href="#main-content"
      @click.prevent="focusMain"
      >Lewati ke konten</a
    >
    <aside class="app-sidebar">
      <RouterLink
        class="brand"
        to="/"
        ><span class="brand-mark">r/</span
        ><span>ruang<span class="brand-second">kerja</span></span></RouterLink
      >
      <p class="sidebar-eyebrow">Ruang pribadi</p>
      <nav
        class="sidebar-nav"
        aria-label="Navigasi utama"
      >
        <RouterLink
          v-for="item in navigation"
          :key="item.path"
          :to="item.path"
          :class="{ 'is-current': active(item.path) }"
          :aria-current="active(item.path) ? 'page' : undefined"
          ><AppIcon :name="item.icon" /><span>{{ item.label }}</span
          ><span
            v-if="item.path === '/projects'"
            class="nav-count"
            >{{ store.data.projects.filter((p) => !p.archived).length }}</span
          ></RouterLink
        >
      </nav>
      <footer class="sidebar-footer">
        <span class="workspace-avatar">{{
          store.data.preferences.workspaceName
            .charAt(0)
            .toLocaleUpperCase('id-ID')
        }}</span>
        <div>
          <strong>{{ store.data.preferences.workspaceName }}</strong
          ><span><AppIcon name="device" />Perangkat ini</span>
        </div>
      </footer>
    </aside>
    <div class="workspace-shell">
      <header class="app-header">
        <div class="desktop-context">
          <span class="context-dot" />{{ store.data.preferences.workspaceName
          }}<span class="context-divider">/</span
          ><strong>{{ route.meta.title }}</strong>
        </div>
        <RouterLink
          class="mobile-brand"
          to="/"
          ><span class="brand-mark">r/</span>Ruang Kerja</RouterLink
        >
        <div class="header-actions">
          <span class="local-indicator"
            ><AppIcon name="device" />{{
              store.storageState === 'ready'
                ? 'Tersimpan di perangkat'
                : 'Periksa penyimpanan'
            }}</span
          ><button
            class="button header-add"
            type="button"
            aria-label="Tugas baru"
            @click="overlays.open({ type: 'task' })"
          >
            <AppIcon name="plus" /><span>Tugas baru</span>
          </button>
          <details
            ref="mobileMenu"
            class="mobile-menu"
            @keydown="closeMenu"
          >
            <summary aria-label="Buka menu navigasi">
              <AppIcon name="menu" />
            </summary>
            <nav aria-label="Menu tambahan">
              <RouterLink
                v-for="item in navigation"
                :key="item.path"
                :to="item.path"
                :aria-current="active(item.path) ? 'page' : undefined"
                ><AppIcon :name="item.icon" />{{ item.label }}</RouterLink
              >
            </nav>
          </details>
        </div>
      </header>
      <div
        v-if="store.storageState !== 'ready'"
        class="storage-banner"
        role="status"
      >
        <AppIcon name="alert" />
        <p>{{ store.storageMessage }}</p>
        <div class="button-group">
          <button
            v-if="store.storageState === 'memory'"
            class="button secondary small-button"
            type="button"
            @click="retry"
          >
            Coba simpan</button
          ><button
            v-if="store.storageState === 'conflict'"
            class="button secondary small-button"
            type="button"
            @click="store.reloadStorage"
          >
            Muat perubahan</button
          ><RouterLink
            class="text-link"
            to="/settings"
            >Pengaturan <AppIcon name="arrow"
          /></RouterLink>
        </div>
      </div>
      <main
        id="main-content"
        class="workspace-content"
        tabindex="-1"
      >
        <RouterView />
      </main>
      <footer class="workspace-footer">
        <span>Ruang Kerja</span
        ><span>Sedikit demi sedikit, tetap bergerak.</span>
      </footer>
    </div>
    <nav
      class="mobile-bottom-nav"
      aria-label="Navigasi cepat"
    >
      <RouterLink
        v-for="item in navigation.slice(0, 4)"
        :key="item.path"
        :to="item.path"
        :class="{ 'is-current': active(item.path) }"
        :aria-current="active(item.path) ? 'page' : undefined"
        ><AppIcon :name="item.icon" /><span>{{ item.label }}</span></RouterLink
      >
    </nav>
    <EditorHost />
    <div
      v-if="store.notice"
      class="toast"
      role="status"
    >
      <AppIcon name="check" />
      <p>{{ store.notice }}</p>
      <button
        v-if="store.canUndo"
        class="toast-undo"
        type="button"
        @click="undo"
      >
        Pulihkan</button
      ><button
        class="icon-button"
        type="button"
        aria-label="Tutup pemberitahuan"
        @click="store.inform('')"
      >
        <AppIcon name="close" />
      </button>
    </div>
  </div>
</template>
