import { onMounted, onUnmounted, readonly, ref } from 'vue';
import { dateKey } from '../domain/dates.ts';

const today = ref(dateKey());
let subscribers = 0;
let timer: ReturnType<typeof setInterval> | undefined;
function update() {
  today.value = dateKey();
}

export function useToday() {
  onMounted(() => {
    update();
    if (subscribers++ === 0) {
      timer = setInterval(update, 60000);
      document.addEventListener('visibilitychange', update);
    }
  });
  onUnmounted(() => {
    if (--subscribers === 0) {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
    }
  });
  return readonly(today);
}
