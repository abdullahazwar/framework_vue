<script setup lang="ts">
import AppIcon from './AppIcon.vue';
defineProps<{ title: string; description: string; icon?: string }>();
</script>

<template>
  <div class="empty-state">
    <span class="empty-symbol"><AppIcon :name="icon || 'inbox'" /></span>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <slot />
  </div>
</template>
