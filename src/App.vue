<script setup lang="ts">
import { RouterView } from 'vue-router';
import AppUpdateBanner from '@/components/AppUpdateBanner.vue';
</script>

<template>
  <div id="app" class="min-h-screen">
    <RouterView />
    <AppUpdateBanner />
  </div>
</template>

<style>
/* Global styles are in style.css */
</style>
