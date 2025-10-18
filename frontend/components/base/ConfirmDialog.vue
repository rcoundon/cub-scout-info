<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      @click.self="cancel"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div class="p-6">
          <h2 class="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 mb-4">
            {{ title }}
          </h2>

          <div class="space-y-4">
            <!-- Warning Message -->
            <div :class="[
              'flex items-start gap-3 p-4 border rounded-lg',
              variant === 'danger' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
            ]">
              <svg
                class="w-6 h-6 flex-shrink-0 mt-0.5"
                :class="variant === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p
                  class="text-sm font-medium"
                  :class="variant === 'danger' ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'"
                >
                  {{ warningTitle || 'This action cannot be undone' }}
                </p>
                <p
                  class="text-sm mt-1"
                  :class="variant === 'danger' ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'"
                >
                  {{ message }}
                </p>
              </div>
            </div>

            <!-- Custom Content Slot -->
            <div v-if="$slots.default" class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <slot />
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-4">
              <BaseButton
                type="button"
                variant="outline"
                @click="cancel"
                :disabled="loading"
              >
                {{ cancelText }}
              </BaseButton>
              <BaseButton
                type="button"
                variant="outline"
                @click="confirm"
                :disabled="loading"
                :class="[
                  variant === 'danger'
                    ? '!border-red-600 !text-red-600 hover:!bg-red-50 dark:!border-red-500 dark:!text-red-500 dark:hover:!bg-red-900/20'
                    : '!border-yellow-600 !text-yellow-600 hover:!bg-yellow-50 dark:!border-yellow-500 dark:!text-yellow-500 dark:hover:!bg-yellow-900/20'
                ]"
              >
                {{ loading ? loadingText : confirmText }}
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'

interface Props {
  modelValue: boolean
  title: string
  message: string
  warningTitle?: string
  confirmText?: string
  cancelText?: string
  loadingText?: string
  loading?: boolean
  variant?: 'danger' | 'warning'
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  loadingText: 'Processing...',
  loading: false,
  variant: 'danger',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
  'cancel': []
}>()

const confirm = () => {
  emit('confirm')
}

const cancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.modelValue) {
    cancel()
  }
}

// Add/remove keyboard listener when modal opens/closes
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', handleEscape)
  } else {
    document.removeEventListener('keydown', handleEscape)
  }
})

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>
