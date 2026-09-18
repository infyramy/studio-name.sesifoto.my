<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-vue-next";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    minDate?: string;
    disabled?: boolean;
    invalid?: boolean;
    clearLabel?: string;
  }>(),
  {
    modelValue: "",
    placeholder: "Pick a date",
    disabled: false,
    invalid: false,
    clearLabel: "Clear date",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const open = ref(false);
const rootEl = ref<HTMLElement | null>(null);
const viewMonth = ref(startOfMonth(new Date()));

watch(
  () => props.modelValue,
  (value) => {
    if (!value) return;
    try {
      viewMonth.value = startOfMonth(parseISO(value));
    } catch {
      /* ignore bad dates */
    }
  },
  { immediate: true },
);

const selected = computed(() => {
  if (!props.modelValue) return null;
  try {
    return parseISO(props.modelValue);
  } catch {
    return null;
  }
});

const min = computed(() => {
  if (!props.minDate) return null;
  try {
    return startOfDay(parseISO(props.minDate));
  } catch {
    return null;
  }
});

const displayText = computed(() => {
  if (!selected.value) return props.placeholder;
  return format(selected.value, "d MMM yyyy");
});

const days = computed(() => {
  const start = startOfMonth(viewMonth.value);
  const end = endOfMonth(viewMonth.value);
  return eachDayOfInterval({ start, end });
});

const leadingBlankCount = computed(() => startOfMonth(viewMonth.value).getDay());

function toIso(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function isDisabledDay(day: Date): boolean {
  if (!min.value) return false;
  return isBefore(startOfDay(day), min.value);
}

function selectDay(day: Date) {
  if (isDisabledDay(day)) return;
  emit("update:modelValue", toIso(day));
  open.value = false;
}

function clearDate() {
  emit("update:modelValue", "");
  open.value = false;
}

function toggle() {
  if (props.disabled) return;
  open.value = !open.value;
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
    <div
      class="flex items-center gap-2 border-0 border-b"
      :class="
        invalid
          ? 'border-red-500'
          : 'border-[var(--border-color)] focus-within:border-[var(--text-main)]'
      "
    >
      <button
        type="button"
        class="flex min-w-0 flex-1 items-center justify-between gap-2 bg-transparent py-2 text-left text-sm outline-none"
        :class="[
          selected ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]',
          disabled ? 'cursor-not-allowed opacity-60' : '',
        ]"
        :disabled="disabled"
        :aria-expanded="open"
        aria-haspopup="dialog"
        @click="toggle"
      >
        <span class="truncate">{{ displayText }}</span>
        <CalendarIcon class="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
      </button>
      <button
        v-if="selected && !disabled"
        type="button"
        class="inline-flex h-6 w-6 shrink-0 items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)]"
        :aria-label="clearLabel"
        @click="clearDate"
      >
        <X class="h-3.5 w-3.5" />
      </button>
    </div>

    <div
      v-if="open"
      class="absolute left-0 right-0 z-[80] mt-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-3 shadow-lg"
      role="dialog"
    >
      <div class="mb-3 flex items-center justify-between">
        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-main)] hover:bg-[var(--icon-bg)]"
          aria-label="Previous month"
          @click="viewMonth = subMonths(viewMonth, 1)"
        >
          <ChevronLeft class="h-4 w-4" />
        </button>
        <p class="text-sm font-medium text-[var(--text-main)]">
          {{ format(viewMonth, "MMMM yyyy") }}
        </p>
        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-main)] hover:bg-[var(--icon-bg)]"
          aria-label="Next month"
          @click="viewMonth = addMonths(viewMonth, 1)"
        >
          <ChevronRight class="h-4 w-4" />
        </button>
      </div>

      <div class="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] text-[var(--text-muted)]">
        <span v-for="label in ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']" :key="label">
          {{ label }}
        </span>
      </div>

      <div class="grid grid-cols-7 gap-1">
        <span
          v-for="n in leadingBlankCount"
          :key="`blank-${n}`"
          class="h-8"
        />
        <button
          v-for="day in days"
          :key="toIso(day)"
          type="button"
          class="inline-flex h-8 items-center justify-center rounded-md text-xs transition-colors"
          :class="[
            isDisabledDay(day)
              ? 'cursor-not-allowed text-[var(--text-muted)] opacity-40'
              : 'hover:bg-[var(--icon-bg)] text-[var(--text-main)]',
            selected && isSameDay(day, selected)
              ? 'bg-[var(--text-main)] text-[var(--bg-main)] hover:bg-[var(--text-main)]'
              : '',
            !isSameMonth(day, viewMonth) ? 'opacity-40' : '',
          ]"
          :disabled="isDisabledDay(day)"
          @click="selectDay(day)"
        >
          {{ format(day, "d") }}
        </button>
      </div>
    </div>
  </div>
</template>
