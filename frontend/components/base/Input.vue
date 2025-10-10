<template>
  <div class="w-full">
    <label v-if="label" :for="inputId" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :min="min"
      :max="max"
      :step="step"
      :class="inputClasses"
      @input="handleInput"
      @blur="handleBlur"
    />

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

interface Props {
  modelValue?: string | number
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'datetime-local' | 'time'
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  hint?: string
  min?: string
  max?: string
  step?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  modelValue: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: []
}>()

const inputId = computed(() => `input-${Math.random().toString(36).substr(2, 9)}`)

const inputClasses = computed(() => {
  const base = 'input'
  const errorClass = props.error ? 'border-red-500 focus:ring-red-500' : ''
  const disabledClass = props.disabled ? 'bg-gray-100 cursor-not-allowed' : ''

  return `${base} ${errorClass} ${disabledClass}`
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const handleBlur = () => {
  emit('blur')
}
</script>
