<script setup lang="ts">
import { ref } from "vue";
import { ChevronDown } from "lucide-vue-next";

defineProps<{
  question: string;
  answer: string;
}>();

const open = ref(false);
</script>

<template>
  <div
    class="border-b last:border-0"
    style="border-color: var(--border-color)"
  >
    <button
      type="button"
      class="group flex w-full items-center justify-between gap-4 py-4 text-left focus:outline-none"
      @click="open = !open"
    >
      <span
        class="break-words text-sm font-medium text-[var(--text-main)] opacity-90 transition-opacity group-hover:opacity-100 md:text-base"
      >
        {{ question }}
      </span>
      <ChevronDown
        class="h-[18px] w-[18px] shrink-0 text-[var(--text-muted)] transition-transform duration-300"
        :class="open ? 'rotate-180' : ''"
      />
    </button>
    <div v-show="open" class="overflow-hidden">
      <p class="pb-4 text-sm leading-relaxed text-[var(--text-muted)] break-words">
        {{ answer }}
      </p>
    </div>
  </div>
</template>
