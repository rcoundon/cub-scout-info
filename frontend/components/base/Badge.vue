<template>
  <span :class="badgeClasses">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'info'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
})

const badgeClasses = computed(() => {
  const base = 'badge'

  const variants = {
    primary: 'badge-primary',
    secondary: 'badge-secondary',
    accent: 'badge-accent',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  }

  return `${base} ${variants[props.variant]}`
})
</script>
