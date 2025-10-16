<template>
  <Transition name="slide-up">
    <div
      v-if="showBanner"
      class="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-4 border-primary-600 shadow-2xl"
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div class="container mx-auto px-4 py-6 max-w-7xl">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <!-- Content -->
          <div class="flex-1">
            <h2 id="cookie-consent-title" class="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Cookie Consent
            </h2>
            <p id="cookie-consent-description" class="text-gray-700 text-sm md:text-base">
              We use essential cookies to make our website work properly. These cookies are necessary for authentication and basic functionality. We do not use tracking or advertising cookies.
              <NuxtLink to="/privacy" class="text-primary-600 hover:text-primary-700 font-medium underline ml-1">
                Learn more in our Privacy Policy
              </NuxtLink>
            </p>
          </div>

          <!-- Actions -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <button
              @click="handleDecline"
              class="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
              aria-label="Decline cookies"
            >
              Decline
            </button>
            <button
              @click="handleAccept"
              class="px-6 py-3 bg-primary-700 text-white rounded-lg font-medium hover:bg-primary-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md"
              aria-label="Accept cookies"
            >
              Accept Cookies
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

const { showBanner, acceptCookies, declineCookies, loadConsent } = useCookieConsent()

onMounted(() => {
  loadConsent()
})

const handleAccept = () => {
  acceptCookies()
}

const handleDecline = () => {
  declineCookies()
}
</script>

<style scoped>
/* Slide up transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease-out, opacity 0.3s ease-out;
}

.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-enter-to,
.slide-up-leave-from {
  transform: translateY(0);
  opacity: 1;
}
</style>
