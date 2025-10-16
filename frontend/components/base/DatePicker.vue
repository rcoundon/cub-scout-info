<template>
  <div class="w-full">
    <label v-if="label" :for="inputId" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <ClientOnly>
      <VDatePicker
        v-model="internalValue"
        :is-dark="false"
        :min-date="minDate"
        :max-date="maxDate"
        :is-required="required"
        :disabled="disabled"
        :attributes="attributes"
        color="teal"
        trim-weeks
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
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
import { computed } from 'vue'
import { DatePicker as VDatePicker } from 'v-calendar'

interface Props {
  modelValue?: string | Date | null
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  hint?: string
  mode?: 'date' | 'dateTime' | 'time'
  minDate?: Date
  maxDate?: Date
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  mode: 'date',
  placeholder: 'Select date',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputId = `datepicker-${useId()}`

// Highlight today's date
const attributes = [
  {
    key: 'today',
    highlight: {
      color: 'blue',
      fillMode: 'outline',
    },
    dates: new Date(),
  },
]

const internalValue = computed({
  get: () => props.modelValue ? new Date(props.modelValue) : null,
  set: (value: Date | null) => {
    if (value) {
      const year = value.getFullYear()
      const month = String(value.getMonth() + 1).padStart(2, '0')
      const day = String(value.getDate()).padStart(2, '0')
      emit('update:modelValue', `${year}-${month}-${day}`)
    } else {
      emit('update:modelValue', '')
    }
  }
})

const displayValue = computed(() => {
  if (!internalValue.value) return ''

  return internalValue.value.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
})

const inputClasses = computed(() => {
  const base = 'input cursor-pointer'
  const errorClass = props.error ? 'border-red-500 focus:ring-red-500' : ''
  const disabledClass = props.disabled ? 'bg-gray-100 cursor-not-allowed' : ''

  return `${base} ${errorClass} ${disabledClass}`
})
</script>
