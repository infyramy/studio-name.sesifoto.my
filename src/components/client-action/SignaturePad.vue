<template>
  <div class="sig">
    <div
      ref="wrapEl"
      class="sig__canvas-wrap"
    >
      <canvas
        ref="canvasEl"
        class="sig__canvas"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @pointerleave="onPointerUp"
      />
      <p
        v-if="!hasInk"
        class="sig__hint"
      >
        Draw your signature here
      </p>
    </div>
    <div class="sig__actions">
      <button
        type="button"
        class="sig__clear"
        :style="{ color: 'var(--p-muted)' }"
        :disabled="!hasInk"
        @click="clear"
      >
        Clear
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

/** Always dark ink on white pad so PNG stays readable in any theme. */
const INK_COLOR = "#1c1c1a";
const PAD_COLOR = "#ffffff";

const emit = defineEmits<{
  (e: "change", payload: { empty: boolean; dataUrl: string | null }): void;
}>();

const wrapEl = ref<HTMLElement | null>(null);
const canvasEl = ref<HTMLCanvasElement | null>(null);
const hasInk = ref(false);

let drawing = false;
let lastX = 0;
let lastY = 0;
let resizeObserver: ResizeObserver | null = null;

function emitChange() {
  const canvas = canvasEl.value;
  if (!canvas || !hasInk.value) {
    emit("change", { empty: true, dataUrl: null });
    return;
  }
  emit("change", {
    empty: false,
    dataUrl: canvas.toDataURL("image/png"),
  });
}

function prepareContext(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.fillStyle = PAD_COLOR;
  ctx.fillRect(0, 0, width, height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = INK_COLOR;
}

function resizeCanvas() {
  const canvas = canvasEl.value;
  const wrap = wrapEl.value;
  if (!canvas || !wrap) return;
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  const width = wrap.clientWidth;
  const height = Math.max(160, Math.round(wrap.clientWidth * 0.36));
  const prev = canvas.toDataURL("image/png");
  const hadInk = hasInk.value;

  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  prepareContext(ctx, width, height);

  if (hadInk) {
    const img = new Image();
    img.onload = () => {
      prepareContext(ctx, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      hasInk.value = true;
      emitChange();
    };
    img.src = prev;
  }
}

function pointFromEvent(event: PointerEvent) {
  const canvas = canvasEl.value;
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function onPointerDown(event: PointerEvent) {
  const canvas = canvasEl.value;
  if (!canvas) return;
  canvas.setPointerCapture(event.pointerId);
  drawing = true;
  const point = pointFromEvent(event);
  lastX = point.x;
  lastY = point.y;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.strokeStyle = INK_COLOR;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(lastX + 0.01, lastY + 0.01);
  ctx.stroke();
  hasInk.value = true;
}

function onPointerMove(event: PointerEvent) {
  if (!drawing) return;
  const canvas = canvasEl.value;
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;
  const point = pointFromEvent(event);
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(point.x, point.y);
  ctx.stroke();
  lastX = point.x;
  lastY = point.y;
  hasInk.value = true;
}

function onPointerUp() {
  if (!drawing) return;
  drawing = false;
  emitChange();
}

function clear() {
  const canvas = canvasEl.value;
  const wrap = wrapEl.value;
  const ctx = canvas?.getContext("2d");
  if (!canvas || !wrap || !ctx) return;
  const width = wrap.clientWidth;
  const height = Math.max(160, Math.round(wrap.clientWidth * 0.36));
  prepareContext(ctx, width, height);
  hasInk.value = false;
  emitChange();
}

onMounted(() => {
  resizeCanvas();
  emitChange();
  if (wrapEl.value && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => resizeCanvas());
    resizeObserver.observe(wrapEl.value);
  }
  window.addEventListener("resize", resizeCanvas);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  window.removeEventListener("resize", resizeCanvas);
});

defineExpose({ clear, hasInk });
</script>

<style scoped>
.sig {
  display: grid;
  gap: 0.65rem;
}

.sig__canvas-wrap {
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 2px;
  background: #ffffff;
  touch-action: none;
}

.sig__canvas {
  display: block;
  width: 100%;
  cursor: crosshair;
  touch-action: none;
  background: #ffffff;
}

.sig__hint {
  pointer-events: none;
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  font-size: 0.82rem;
  letter-spacing: 0.04em;
  color: #8a8a86;
}

.sig__actions {
  display: flex;
  justify-content: flex-end;
}

.sig__clear {
  border: 0;
  background: transparent;
  padding: 0;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  cursor: pointer;
}

.sig__clear:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
