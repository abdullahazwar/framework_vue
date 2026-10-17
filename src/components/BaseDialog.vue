<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import AppIcon from './AppIcon.vue';

defineProps<{ title: string; description?: string; wide?: boolean }>();
const emit = defineEmits<{ close: [] }>();
const dialog = ref<HTMLDialogElement>();
let opener: HTMLElement | null = null;
onMounted(() => {
  opener =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  dialog.value?.showModal();
});
onUnmounted(() => opener?.isConnected && opener.focus());
</script>

<template>
  <dialog
    ref="dialog"
    class="modal"
    :class="{ 'modal-wide': wide }"
    aria-labelledby="dialog-heading"
    @cancel.prevent="emit('close')"
  >
    <header class="modal-header">
      <div>
        <h2 id="dialog-heading">{{ title }}</h2>
        <p
          v-if="description"
          class="muted small"
        >
          {{ description }}
        </p>
      </div>
      <button
        type="button"
        class="icon-button"
        aria-label="Tutup dialog"
        @click="emit('close')"
      >
        <AppIcon name="close" />
      </button>
    </header>
    <slot />
  </dialog>
</template>
