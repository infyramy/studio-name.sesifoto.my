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
    enter-active-class="transition-opacity duration-300"
    leave-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      @click="handleBackdropClick"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <Transition
        enter-active-class="transition-all duration-300"
        leave-active-class="transition-all duration-200"
        enter-from-class="opacity-0 scale-95 translate-y-4"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="show"
          @click.stop
          class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <!-- Header -->
          <div class="px-8 pt-8 pb-6">
            <h3 v-if="title" class="text-2xl font-bold text-gray-900 mb-3 font-serif leading-tight">
              {{ title }}
            </h3>
            <p class="text-sm text-gray-600 leading-relaxed">
              {{ message }}
            </p>
          </div>

          <!-- Footer -->
          <div class="px-8 pb-8 flex gap-3">
            <button
              v-if="showCancel"
              @click="handleCancel"
              class="flex-1 px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all hover:bg-gray-200 bg-gray-100 text-gray-900"
            >
              {{ cancelText }}
            </button>
            <button
              @click="handleConfirm"
              class="px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all hover:opacity-90 text-white"
              :class="showCancel ? 'flex-1' : 'w-full'"
              :style="{ backgroundColor: type === 'warning' || type === 'error' ? iconColor : '#111827' }"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>
