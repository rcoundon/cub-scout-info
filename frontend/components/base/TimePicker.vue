<template>
  <div class="w-full">
    <label v-if="label" :for="inputId" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <ClientOnly>
      <VDatePicker
        v-model="time"
        mode="time"
        :is-dark="false"
        :is-required="required"
        :disabled="disabled"
        color="teal"
        :is24hr="true"
        hide-time-header
      >
        <template #default="{ togglePopover }">
          <div class="relative">
            <input
              :id="inputId"
              type="text"
              :value="displayValue"
              :placeholder="placeholder"
              :required="required"
              :disabled="disabled"
              :class="inputClasses"
              readonly
              @click="togglePopover"
            />
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </template>
      </VDatePicker>
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
import { DatePicker as VDatePicker } from 'v-calendar'

interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Select time',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputId = `timepicker-${useId()}`
const time = ref<Date | null>(null)

// Initialize time from modelValue (HH:MM format)
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    const [hours, minutes] = newValue.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    time.value = date
  } else {
    time.value = null
  }
}, { immediate: true })

// Emit changes in HH:MM format
watch(time, (newTime) => {
  if (newTime) {
    const hours = String(newTime.getHours()).padStart(2, '0')
    const minutes = String(newTime.getMinutes()).padStart(2, '0')
    emit('update:modelValue', `${hours}:${minutes}`)
  } else {
    emit('update:modelValue', '')
  }
})

const displayValue = computed(() => {
  if (!time.value) return ''

  const hours = String(time.value.getHours()).padStart(2, '0')
  const minutes = String(time.value.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
})

const inputClasses = computed(() => {
  const base = 'input cursor-pointer'
  const errorClass = props.error ? 'border-red-500 focus:ring-red-500' : ''
  const disabledClass = props.disabled ? 'bg-gray-100 cursor-not-allowed' : ''

  return `${base} ${errorClass} ${disabledClass}`
})
</script>
