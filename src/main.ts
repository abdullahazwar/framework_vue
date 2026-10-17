import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './app/App.vue';
import { router } from './app/router.ts';
import { useWorkspaceStore } from './features/workspace/store.ts';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
useWorkspaceStore(pinia).initialize();
app.use(router);
app.mount('#app');
