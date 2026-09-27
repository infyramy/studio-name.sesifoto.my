<script setup lang="ts">
import { computed } from "vue";
import {
  Lock,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
} from "lucide-vue-next";
import { useSanitize } from "@/composables/useSanitize";

const { sanitize } = useSanitize();

interface Props {
  show: boolean;
  title?: string;
  message: string;
  type?: "info" | "success" | "error" | "warning";
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: "info",
  confirmText: "OK",
  cancelText: "Cancel",
  showCancel: false,
});

const emit = defineEmits<{
  confirm: [];
  cancel: [];
  close: [];
}>();

const handleConfirm = () => {
  emit("confirm");
  emit("close");
};

const handleCancel = () => {
  emit("cancel");
  emit("close");
};

const handleBackdropClick = () => {
  if (!props.showCancel) {
    emit("close");
  }
};
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-200"
    leave-active-class="transition-opacity duration-150"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      class="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      @click="handleBackdropClick"
    >
      <Transition
        enter-active-class="transition duration-200 ease-out"
        leave-active-class="transition duration-150 ease-in"
        enter-from-class="opacity-0 translate-y-2"
        leave-to-class="opacity-0"
      >
        <div
          v-if="show"
          class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          @click.stop
        >
          <div
            class="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
          >
            <Lock v-if="type === 'info'" class="h-5 w-5 text-gray-900" />
            <AlertTriangle
              v-else-if="type === 'warning'"
              class="h-5 w-5 text-amber-600"
            />
            <CheckCircle
              v-else-if="type === 'success'"
              class="h-5 w-5 text-green-600"
            />
            <XCircle
              v-else-if="type === 'error'"
              class="h-5 w-5 text-red-600"
            />
            <Info v-else class="h-5 w-5 text-gray-900" />
          </div>

          <h3 class="text-lg font-semibold text-gray-900">
            {{ title }}
          </h3>
          <p
            class="mt-2 text-sm leading-relaxed text-gray-600"
            v-html="sanitize(message.replace(/\n/g, '<br>'))"
          ></p>

          <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
            <button
              v-if="showCancel"
              type="button"
              class="bk-cta-secondary flex-1"
              @click="handleCancel"
            >
              {{ cancelText }}
            </button>
            <button
              type="button"
              class="bk-cta-primary flex-1"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>
