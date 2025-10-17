<template>
  <div class="w-full">
    <label v-if="label" :for="inputId" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <ClientOnly>
      <VueDatePicker
        :id="inputId"
        v-model="time"
        time-picker
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :min-time="minTimeObject"
        :clearable="!required"
        format="HH:mm"
        auto-apply
        :class="wrapperClasses"
      >
        <template #input-icon>
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
  modelValue?: string
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  hint?: string
  minTime?: string // HH:MM format
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Select time',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputId = `timepicker-${useId()}`
const time = ref<{ hours: number; minutes: number } | null>(null)

// Compute minimum time object from minTime prop
const minTimeObject = computed(() => {
  if (!props.minTime) return undefined

  const [hours, minutes] = props.minTime.split(':').map(Number)
  return { hours, minutes }
})

// Initialize time from modelValue (HH:MM format)
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    const [hours, minutes] = newValue.split(':').map(Number)
    time.value = { hours, minutes }
  } else {
    time.value = null
  }
}, { immediate: true })

// Emit changes in HH:MM format
watch(time, (newTime) => {
  if (newTime) {
    const hours = String(newTime.hours).padStart(2, '0')
    const minutes = String(newTime.minutes).padStart(2, '0')
    emit('update:modelValue', `${hours}:${minutes}`)
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
