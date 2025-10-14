<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { computed } from 'vue'

const authStore = useAuthStore()

const timeRemaining = computed(() => {
  if (!authStore.tokenExpiry) return ''

  const remaining = authStore.tokenExpiry - Date.now()
  const minutes = Math.floor(remaining / (60 * 1000))
  const seconds = Math.floor((remaining % (60 * 1000)) / 1000)

  if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }
  return `${seconds} second${seconds !== 1 ? 's' : ''}`
})

const handleExtendSession = async () => {
  await authStore.refreshTokens()
}

const handleLogout = () => {
  authStore.logout()
  navigateTo('/login')
}
</script>

<template>
  <Transition name="slide-down">
    <div
      v-if="authStore.sessionTimeoutWarning && authStore.isAuthenticated"
      class="fixed top-0 left-0 right-0 z-50 bg-yellow-50 border-b-2 border-yellow-400 shadow-lg"
    >
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0">
              <svg
                class="w-6 h-6 text-yellow-600"
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
            </div>
            <div>
              <p class="font-semibold text-yellow-900">Session Expiring Soon</p>
              <p class="text-sm text-yellow-800">
                Your session will expire in {{ timeRemaining }}. Click "Stay Logged In" to continue.
              </p>
            </div>
          </div>

          <div class="flex gap-3 flex-shrink-0">
            <BaseButton
              variant="secondary"
              size="sm"
              @click="handleLogout"
            >
              Logout
            </BaseButton>
            <BaseButton
              variant="primary"
              size="sm"
              @click="handleExtendSession"
            >
              Stay Logged In
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease-out, opacity 0.3s ease-out;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
