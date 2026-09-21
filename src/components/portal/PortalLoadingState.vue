<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    fullscreen?: boolean;
  }>(),
  {
    label: "Loading",
    fullscreen: true,
  },
);
</script>

<template>
  <div
    class="portal-loading"
    :class="{ 'portal-loading--full': fullscreen }"
    role="status"
    aria-live="polite"
    :aria-label="label"
  >
    <div class="portal-spinner" />
    <p class="portal-loading__label">{{ label }}</p>
  </div>
</template>

<style scoped>
.portal-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  text-align: center;
  padding: 1.5rem;
}

.portal-loading--full {
  min-height: 100dvh;
}

.portal-loading__label {
  margin: 0;
  font-size: 0.8125rem;
  letter-spacing: 0.02em;
  color: var(--p-muted);
}
</style>
