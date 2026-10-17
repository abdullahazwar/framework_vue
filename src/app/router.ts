import { nextTick } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: () => import('../views/HomeView.vue'),
      meta: { title: 'Beranda' },
    },
    {
      path: '/projects',
      component: () => import('../views/ProjectsView.vue'),
      meta: { title: 'Proyek' },
    },
    {
      path: '/projects/:id',
      component: () => import('../views/ProjectView.vue'),
      meta: { title: 'Papan proyek' },
    },
    {
      path: '/tasks',
      component: () => import('../views/TasksView.vue'),
      meta: { title: 'Tugas' },
    },
    {
      path: '/agenda',
      component: () => import('../views/AgendaView.vue'),
      meta: { title: 'Agenda' },
    },
    {
      path: '/notes',
      component: () => import('../views/NotesView.vue'),
      meta: { title: 'Catatan' },
    },
    {
      path: '/settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { title: 'Pengaturan' },
    },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('../views/NotFoundView.vue'),
      meta: { title: 'Halaman tidak ditemukan' },
    },
  ],
  scrollBehavior(to, from, saved) {
    return saved || (to.path !== from.path ? { top: 0 } : false);
  },
});

router.afterEach(async (to, from) => {
  document.title = `${String(to.meta.title || 'Ruang pribadi')} · Ruang Kerja`;
  if (to.path !== from.path) {
    await nextTick();
    document.getElementById('page-title')?.focus({ preventScroll: true });
  }
});
