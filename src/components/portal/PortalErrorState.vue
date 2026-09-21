<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    message?: string;
    actionLabel?: string;
    secondaryLabel?: string;
    fullscreen?: boolean;
  }>(),
  {
    title: "Something went wrong",
    message: "",
    actionLabel: "",
    secondaryLabel: "",
    fullscreen: true,
  },
);

defineEmits<{
  action: [];
  secondary: [];
}>();
</script>

<template>
  <div
    class="portal-error"
    :class="{ 'portal-error--full': fullscreen }"
    role="alert"
  >
    <div class="portal-error__inner">
      <p class="portal-error__title portal-display">{{ title }}</p>
      <p v-if="message" class="portal-error__message">{{ message }}</p>
      <div v-if="actionLabel || secondaryLabel" class="portal-error__actions">
        <button
          v-if="actionLabel"
          type="button"
          class="portal-btn-text"
          @click="$emit('action')"
        >
          {{ actionLabel }}
        </button>
        <button
          v-if="secondaryLabel"
          type="button"
          class="portal-error__secondary"
          @click="$emit('secondary')"
        >
          {{ secondaryLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.portal-error {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.portal-error--full {
  min-height: 100dvh;
}

.portal-error__inner {
  max-width: 22rem;
  text-align: center;
}

.portal-error__title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--p-text);
}

.portal-error__message {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--p-muted);
}

.portal-error__actions {
  margin-top: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.portal-error__secondary {
  border: none;
  background: transparent;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--p-muted);
  cursor: pointer;
}

.portal-error__secondary:hover {
  color: var(--p-text);
}
</style>
