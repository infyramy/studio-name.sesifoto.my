<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { ChevronDown } from "lucide-vue-next";

export type LeadFormSelectOption = {
  value: string;
  label: string;
};

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    options: LeadFormSelectOption[];
    placeholder?: string;
    disabled?: boolean;
    invalid?: boolean;
  }>(),
  {
    modelValue: "",
    placeholder: "Select",
    disabled: false,
    invalid: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const open = ref(false);
const rootEl = ref<HTMLElement | null>(null);

const selectedLabel = computed(() => {
  const match = props.options.find((opt) => opt.value === props.modelValue);
  return match?.label ?? "";
});

function toggle() {
  if (props.disabled) return;
  open.value = !open.value;
}

function choose(value: string) {
  emit("update:modelValue", value);
  open.value = false;
}

function onDocPointer(event: MouseEvent) {
  if (!open.value || !rootEl.value) return;
  if (!rootEl.value.contains(event.target as Node)) {
    open.value = false;
  }
}

onMounted(() => document.addEventListener("mousedown", onDocPointer));
onBeforeUnmount(() => document.removeEventListener("mousedown", onDocPointer));
</script>

<template>
  <div ref="rootEl" class="relative">
    <button
      type="button"
      class="flex h-auto w-full items-center justify-between gap-2 border-0 border-b bg-transparent px-0 py-2 text-left text-sm outline-none transition-colors"
      :class="[
        invalid
          ? 'border-red-500 text-[var(--text-main)]'
          : 'border-[var(--border-color)] focus:border-[var(--text-main)]',
        selectedLabel ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]',
        disabled ? 'cursor-not-allowed opacity-60' : '',
      ]"
      :disabled="disabled"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <span class="truncate">{{ selectedLabel || placeholder }}</span>
      <ChevronDown
        class="h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <ul
      v-if="open"
      class="absolute left-0 right-0 z-[80] mt-2 max-h-56 overflow-auto rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] py-1 shadow-lg"
      role="listbox"
    >
      <li v-for="option in options" :key="option.value">
        <button
          type="button"
          class="flex w-full px-3 py-2 text-left text-sm text-[var(--text-main)] transition-colors hover:bg-[var(--icon-bg)]"
          :class="
            option.value === modelValue
              ? 'bg-[var(--icon-bg)] font-medium'
              : ''
          "
          role="option"
          :aria-selected="option.value === modelValue"
          @click="choose(option.value)"
        >
          {{ option.label }}
        </button>
      </li>
    </ul>
  </div>
</template>
