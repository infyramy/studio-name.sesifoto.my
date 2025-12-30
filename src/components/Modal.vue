<script setup lang="ts">
import { computed } from "vue";
import {
  Lock,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
} from "lucide-vue-next";

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
    enter-active-class="transition-opacity duration-300"
    leave-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      @click="handleBackdropClick"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 font-sans"
      style="font-family: 'Bricolage Grotesque', sans-serif"
    >
      <Transition
        enter-active-class="transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1)"
        leave-active-class="transition-all duration-200 ease-in"
        enter-from-class="opacity-0 scale-95 translate-y-4"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="show"
          @click.stop
          class="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center"
        >
          <!-- Icon -->
          <div
            class="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-6"
          >
            <Lock v-if="type === 'info'" class="w-8 h-8 text-gray-900" />
            <AlertTriangle
              v-else-if="type === 'warning'"
              class="w-8 h-8 text-amber-500"
            />
            <CheckCircle
              v-else-if="type === 'success'"
              class="w-8 h-8 text-green-500"
            />
            <XCircle
              v-else-if="type === 'error'"
              class="w-8 h-8 text-red-500"
            />
            <Info v-else class="w-8 h-8 text-gray-900" />
          </div>

          <!-- Content -->
          <h3 class="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
            {{ title }}
          </h3>
          <p class="text-[15px] text-gray-500 leading-relaxed mb-8">
            {{ message }}
          </p>

          <!-- Buttons -->
          <div class="flex gap-3">
            <button
              v-if="showCancel"
              @click="handleCancel"
              class="flex-1 px-6 py-3.5 rounded-xl font-bold text-sm bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 transition-colors"
            >
              {{ cancelText }}
            </button>
            <button
              @click="handleConfirm"
              class="flex-1 px-6 py-3.5 rounded-xl font-bold text-sm bg-gray-900 text-white hover:bg-black transition-colors shadow-lg shadow-gray-200"
              :class="{ 'w-full': !showCancel }"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>
