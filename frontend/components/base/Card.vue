<template>
  <div :class="cardClasses">
    <div v-if="$slots.header" class="px-6 py-4 border-b border-gray-200">
      <slot name="header" />
    </div>

    <div :class="bodyClasses">
      <slot />
    </div>

    <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-200 bg-gray-50">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  hover?: boolean
  padding?: boolean
  stacked?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hover: false,
  padding: true,
  stacked: false,
})

const cardClasses = computed(() => {
  if (props.stacked) return 'card-stacked'
  return props.hover ? 'card-hover' : 'card'
})

const bodyClasses = computed(() => {
  return props.padding ? 'p-6' : ''
})
</script>
