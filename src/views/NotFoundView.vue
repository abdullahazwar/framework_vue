<script setup lang="ts">
import { RouterLink } from 'vue-router';
import PageHeading from '../components/PageHeading.vue';
import EmptyState from '../components/EmptyState.vue';
</script>

<template>
  <PageHeading
    title="Halaman belum ditemukan."
    eyebrow="404"
  /><EmptyState
    title="Mari kembali ke ruang utama"
    description="Alamat mungkin berubah atau tidak tersedia."
    icon="folder"
    ><RouterLink
      class="button"
      to="/"
      >Kembali ke beranda</RouterLink
    ></EmptyState
  >
</template>
