<template>
  <div class="w-full">
    <label v-if="label" :for="inputId" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <ClientOnly>
      <VueDatePicker
        :id="inputId"
        v-model="date"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :min-date="effectiveMinDate"
        :max-date="maxDate"
        :clearable="!required"
        format="dd MMM yyyy"
        auto-apply
        :class="wrapperClasses"
      >
        <template #input-icon>
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </template>
      </VueDatePicker>
    </ClientOnly>

    <p v-if="error" class="mt-1 text-sm text-red-600">
      {{ error }}
    </p>

    <p v-else-if="hint" class="mt-1 text-sm text-gray-500">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

interface Props {
  modelValue?: string | Date | null
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  hint?: string
  minDate?: Date
  maxDate?: Date
  allowPastDates?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: 'Select date',
  allowPastDates: false,
})

// Set minimum date to today unless explicitly allowed or overridden
const effectiveMinDate = computed(() => {
  if (props.minDate) return props.minDate
  if (props.allowPastDates) return undefined

  // Default to today at midnight
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputId = `datepicker-${useId()}`
const date = ref<Date | null>(null)

// Initialize date from modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    date.value = new Date(newValue)
  } else {
    date.value = null
  }
}, { immediate: true })

// Emit changes in YYYY-MM-DD format
watch(date, (newDate) => {
  if (newDate) {
    const year = newDate.getFullYear()
    const month = String(newDate.getMonth() + 1).padStart(2, '0')
    const day = String(newDate.getDate()).padStart(2, '0')
    emit('update:modelValue', `${year}-${month}-${day}`)
  } else {
    emit('update:modelValue', '')
  }
})

const wrapperClasses = computed(() => {
  const classes = []
  if (props.error) classes.push('dp-error')
  if (props.disabled) classes.push('dp-disabled')
  return classes.join(' ')
})
</script>

<style scoped>
/* Style the input wrapper to match the design system */
:deep(.dp__input_wrap) {
  width: 100%;
}

:deep(.dp__input) {
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem 0.5rem 2.5rem;
  width: 100%;
  font-size: 1rem;
  line-height: 1.5;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

:deep(.dp__input:focus) {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

:deep(.dp__input:disabled) {
  background-color: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Error state */
:deep(.dp-error .dp__input) {
  border-color: #ef4444;
}

:deep(.dp-error .dp__input:focus) {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* Disabled state */
:deep(.dp-disabled .dp__input) {
  background-color: #f3f4f6;
  cursor: not-allowed;
}
</style>
