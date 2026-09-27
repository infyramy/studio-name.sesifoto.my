<script setup lang="ts">
import { Check } from "lucide-vue-next";

defineProps<{
  title: string;
  body: string;
  againLabel: string;
  primaryColor: string;
  primaryTextColor: string;
  buttonRadiusClass?: string;
}>();

const emit = defineEmits<{
  again: [];
}>();
</script>

<template>
  <div
    class="lead-form-success flex flex-col items-center px-2 py-10 text-center md:py-14"
    role="status"
    aria-live="polite"
  >
    <div
      class="lead-form-success__icon mb-6 flex h-16 w-16 items-center justify-center rounded-full md:h-20 md:w-20"
      :style="{
        backgroundColor: primaryColor,
        color: primaryTextColor,
      }"
      aria-hidden="true"
    >
      <Check class="h-8 w-8 md:h-10 md:w-10" stroke-width="2.5" />
    </div>

    <h2
      class="lead-form-success__title mb-3 font-title text-2xl tracking-tight text-[var(--text-main)] md:text-3xl"
    >
      {{ title }}
    </h2>
    <p
      class="lead-form-success__body mb-8 max-w-sm text-sm leading-relaxed text-[var(--text-muted)]"
    >
      {{ body }}
    </p>

    <button
      type="button"
      class="inline-flex items-center justify-center border px-6 py-3 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-main)] transition-opacity hover:opacity-70"
      :class="buttonRadiusClass"
      :style="{ borderColor: 'var(--border-color)' }"
      @click="emit('again')"
    >
      {{ againLabel }}
    </button>
  </div>
</template>

<style scoped>
.lead-form-success__icon {
  animation: lead-form-success-pop 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.lead-form-success__title,
.lead-form-success__body {
  animation: lead-form-success-fade 0.4s ease-out 0.08s both;
}

@media (prefers-reduced-motion: reduce) {
  .lead-form-success__icon,
  .lead-form-success__title,
  .lead-form-success__body {
    animation: none;
  }
}

@keyframes lead-form-success-pop {
  from {
    opacity: 0;
    transform: scale(0.7);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes lead-form-success-fade {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
