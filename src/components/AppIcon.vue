<script setup lang="ts">
import sprite from '../assets/icons.svg?url';
defineProps<{ name: string }>();
</script>

<template>
  <svg
    class="icon"
    aria-hidden="true"
    focusable="false"
  >
    <use :href="`${sprite}#${name}`" />
  </svg>
</template>
