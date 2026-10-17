<script setup lang="ts">
defineProps<{ title: string; subtitle?: string; eyebrow?: string }>();
</script>

<template>
  <header class="page-heading">
    <div>
      <p
        v-if="eyebrow"
        class="eyebrow"
      >
        {{ eyebrow }}
      </p>
      <h1
        tabindex="-1"
        id="page-title"
      >
        {{ title }}
      </h1>
      <p
        v-if="subtitle"
        class="page-description"
      >
        {{ subtitle }}
      </p>
    </div>
    <div class="page-actions"><slot /></div>
  </header>
</template>
