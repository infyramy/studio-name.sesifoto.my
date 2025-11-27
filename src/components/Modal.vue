<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  show: boolean;
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  brandColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  confirmText: 'OK',
  cancelText: 'Cancel',
  showCancel: false,
  brandColor: '',
});

const emit = defineEmits<{
  confirm: [];
  cancel: [];
  close: [];
}>();

const iconColor = computed(() => {
  // Use brand color for success and info types if provided
  if (props.brandColor && (props.type === 'success' || props.type === 'info')) {
    return props.brandColor;
  }

  switch (props.type) {
    case 'success':
      return '#10B981';
    case 'error':
      return '#EF4444';
    case 'warning':
      return '#F59E0B';
    default:
      return '#3B82F6';
  }
});

const handleConfirm = () => {
  emit('confirm');
  emit('close');
};

const handleCancel = () => {
  emit('cancel');
  emit('close');
};

const handleBackdropClick = () => {
  if (!props.showCancel) {
    emit('close');
  }
};
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-200"
    leave-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      @click="handleBackdropClick"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <Transition
        enter-active-class="transition-all duration-200"
        leave-active-class="transition-all duration-200"
        enter-from-class="opacity-0 scale-95"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="show"
          @click.stop
          class="bg-white shadow-lg w-full max-w-md border border-gray-200"
        >
          <!-- Header -->
          <div v-if="title" class="px-6 py-4 border-b border-gray-100">
            <h3 class="text-lg font-medium text-gray-900">{{ title }}</h3>
          </div>

          <!-- Body -->
          <div class="px-6 py-6">
            <div class="flex gap-4">
              <!-- Icon -->
              <div class="flex-shrink-0">
                <svg
                  v-if="type === 'success'"
                  class="w-6 h-6"
                  :style="{ color: iconColor }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <svg
                  v-else-if="type === 'error'"
                  class="w-6 h-6"
                  :style="{ color: iconColor }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <svg
                  v-else-if="type === 'warning'"
                  class="w-6 h-6"
                  :style="{ color: iconColor }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <svg
                  v-else
                  class="w-6 h-6"
                  :style="{ color: iconColor }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <!-- Message -->
              <div class="flex-1">
                <p class="text-sm text-gray-700 font-light leading-relaxed">
                  {{ message }}
                </p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              v-if="showCancel"
              @click="handleCancel"
              class="px-4 py-2 font-medium text-xs uppercase tracking-wider transition-all hover:shadow-lg bg-gray-100 text-gray-900"
            >
              {{ cancelText }}
            </button>
            <button
              @click="handleConfirm"
              class="px-4 py-2 font-medium text-xs uppercase tracking-wider transition-all hover:shadow-lg text-white"
              :style="{ backgroundColor: iconColor }"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>
