<script lang="ts">
let bodyLockCount = 0;
let bodyOverflow = "";
const openOverlayStack: symbol[] = [];

export default {
  inheritAttrs: false,
};

function lockBody() {
  if (typeof document === "undefined") return;
  if (bodyLockCount === 0) {
    bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  bodyLockCount += 1;
}

function unlockBody() {
  if (typeof document === "undefined" || bodyLockCount === 0) return;
  bodyLockCount -= 1;
  if (bodyLockCount === 0) {
    document.body.style.overflow = bodyOverflow;
    bodyOverflow = "";
  }
}
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { X } from "lucide-vue-next";
import {
  deriveAccessiblePortalAccent,
  portalHexToRgba,
  readablePortalAccentText,
} from "@/utils/portal-color";

const props = withDefaults(defineProps<{
  open: boolean;
  dismissible?: boolean;
  showClose?: boolean;
  accentColor?: string | null;
  titleId?: string;
  descriptionId?: string;
  viewportClass?: string;
  containerClass?: string;
  panelClass?: string;
}>(), {
  dismissible: true,
  showClose: true,
  accentColor: null,
  titleId: undefined,
  descriptionId: undefined,
  viewportClass: "",
  containerClass: "",
  panelClass: "",
});

const emit = defineEmits<{
  "update:open": [open: boolean];
}>();

const panel = ref<HTMLElement | null>(null);
const overlayId = Symbol("portal-overlay");
let locked = false;
let restoreFocusTo: HTMLElement | null = null;

const accent = computed(() =>
  deriveAccessiblePortalAccent(
    props.accentColor,
    ["#111412", "#090B0A"],
    0.14,
  ),
);

const overlayStyle = computed(() => ({
  "--portal-overlay-accent": accent.value,
  "--portal-overlay-accent-text": readablePortalAccentText(accent.value),
  "--portal-overlay-accent-soft": portalHexToRgba(accent.value, 0.14),
  "--portal-overlay-accent-ring": portalHexToRgba(accent.value, 0.32),
}));

function isTopOverlay() {
  return openOverlayStack[openOverlayStack.length - 1] === overlayId;
}

function requestClose() {
  if (props.dismissible && isTopOverlay()) emit("update:open", false);
}

function focusInitialElement() {
  void nextTick(() => {
    const target =
      panel.value?.querySelector<HTMLElement>(
        "[autofocus], [data-portal-initial-focus]",
      )
      ?? panel.value?.querySelector<HTMLElement>(
        "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
      );
    (target ?? panel.value)?.focus({ preventScroll: true });
  });
}

function getFocusableElements() {
  if (!panel.value) return [];
  return Array.from(panel.value.querySelectorAll<HTMLElement>(
    "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex='-1'])",
  )).filter((element) => !element.hasAttribute("hidden"));
}

function handleKeydown(event: KeyboardEvent) {
  if (!isTopOverlay()) return;
  if (event.key === "Escape") {
    if (!props.dismissible) return;
    event.preventDefault();
    requestClose();
    return;
  }
  if (event.key !== "Tab") return;

  const focusable = getFocusableElements();
  if (!focusable.length) {
    event.preventDefault();
    panel.value?.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !panel.value?.contains(active))) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first?.focus();
  }
}

function activate() {
  if (locked || typeof document === "undefined") return;
  locked = true;
  restoreFocusTo = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;
  openOverlayStack.push(overlayId);
  lockBody();
  document.addEventListener("keydown", handleKeydown);
  focusInitialElement();
}

function deactivate() {
  if (!locked || typeof document === "undefined") return;
  locked = false;
  const stackIndex = openOverlayStack.lastIndexOf(overlayId);
  if (stackIndex >= 0) openOverlayStack.splice(stackIndex, 1);
  document.removeEventListener("keydown", handleKeydown);
  unlockBody();
  if (restoreFocusTo?.isConnected) restoreFocusTo.focus({ preventScroll: true });
  restoreFocusTo = null;
}

watch(
  () => props.open,
  (open) => {
    if (open) activate();
    else deactivate();
  },
  { immediate: true },
);

onBeforeUnmount(deactivate);
</script>

<template>
  <Teleport to="body">
    <Transition name="portal-overlay">
      <div
        v-if="open"
        class="portal-overlay fixed inset-0 z-[300] overflow-y-auto bg-black/80 backdrop-blur-sm"
        :class="viewportClass"
        :style="overlayStyle"
        @mousedown.self="requestClose"
      >
        <div
          class="flex min-h-full items-center justify-center p-4 sm:p-6"
          :class="containerClass"
          @mousedown.self="requestClose"
        >
          <section
            ref="panel"
            v-bind="$attrs"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="titleId"
            :aria-describedby="descriptionId"
            tabindex="-1"
            class="portal-overlay-panel relative flex w-full max-w-lg flex-col overflow-hidden rounded-[18px] border border-white/15 bg-[#111412] text-white shadow-[0_24px_70px_rgba(0,0,0,0.48)] outline-none"
            :class="panelClass"
          >
            <button
              v-if="showClose"
              type="button"
              class="portal-overlay-close absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/25 text-white/65 transition hover:bg-white/10 hover:text-white focus:outline-none"
              aria-label="Close"
              @click="requestClose"
            >
              <X class="h-4 w-4" />
            </button>
            <slot />
          </section>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.portal-overlay-enter-active,
.portal-overlay-leave-active {
  transition: opacity 180ms ease;
}

.portal-overlay-enter-active .portal-overlay-panel,
.portal-overlay-leave-active .portal-overlay-panel {
  transition: transform 220ms ease, opacity 180ms ease;
}

.portal-overlay-enter-from,
.portal-overlay-leave-to {
  opacity: 0;
}

.portal-overlay-enter-from .portal-overlay-panel,
.portal-overlay-leave-to .portal-overlay-panel {
  opacity: 0;
  transform: translateY(10px) scale(0.985);
}

.portal-overlay-panel :deep(.portal-primary) {
  background: var(--portal-overlay-accent);
  color: var(--portal-overlay-accent-text);
}

.portal-overlay-panel :deep(.portal-focus:focus-visible),
.portal-overlay-close:focus-visible {
  box-shadow: 0 0 0 3px var(--portal-overlay-accent-ring);
}

@media (prefers-reduced-motion: reduce) {
  .portal-overlay-enter-active,
  .portal-overlay-leave-active,
  .portal-overlay-enter-active .portal-overlay-panel,
  .portal-overlay-leave-active .portal-overlay-panel {
    transition-duration: 1ms;
  }
}
</style>
