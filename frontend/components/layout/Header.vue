<template>
  <header class="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50 transition-colors">
    <nav class="container mx-auto px-4">
      <div class="flex items-center justify-between h-24">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center space-x-2" active-class="" exact-active-class="">
          <img
            src="/assets/logo-purple.png"
            alt="Cubs Site Logo"
            class="h-20 w-auto"
          />
        </NuxtLink>

        <!-- Desktop Navigation - Hidden on mobile, shown on md and up -->
        <div class="hidden md:flex items-center space-x-8">
          <NuxtLink
            v-for="item in navigationItems"
            :key="item.path"
            :to="item.path"
            :exact="item.path === '/'"
            class="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium text-lg"
            active-class="!text-primary-600 dark:!text-primary-400 font-semibold border-b-2 border-primary-600 dark:border-primary-400"
          >
            {{ item.label }}
          </NuxtLink>

          <!-- Color Mode Toggle -->
          <ColorModeToggle />

          <!-- Auth Actions - Wrap in ClientOnly to prevent hydration mismatch -->
          <ClientOnly>
            <div v-if="isAuthenticated" class="flex items-center space-x-4">
              <span class="text-base text-gray-600 dark:text-gray-300">{{ userName }}</span>
              <NuxtLink v-if="canAccessAdmin" to="/admin">
                <BaseButton variant="secondary">
                  Admin
                </BaseButton>
              </NuxtLink>
              <BaseButton variant="outline" @click="handleLogout">
                Logout
              </BaseButton>
            </div>
            <BaseButton v-else variant="primary" @click="handleLogin">
              Admin Login
            </BaseButton>
            <template #fallback>
              <div class="w-20 h-10"></div>
            </template>
          </ClientOnly>
        </div>

        <!-- Mobile Menu Button -->
        <button
          class="md:hidden p-2 rounded-lg hover:bg-gray-100"
          @click="toggleMobileMenu"
          :aria-label="mobileMenuOpen ? 'Close menu' : 'Open menu'"
          :aria-expanded="mobileMenuOpen"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              v-if="!mobileMenuOpen"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
            <path
              v-else
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Mobile Menu -->
      <div
        v-if="mobileMenuOpen"
        class="md:hidden py-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="flex flex-col space-y-3">
          <NuxtLink
            v-for="item in navigationItems"
            :key="item.path"
            :to="item.path"
            :exact="item.path === '/'"
            class="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium py-2 text-lg"
            active-class="!text-primary-600 dark:!text-primary-400 font-semibold"
            @click="closeMobileMenu"
          >
            {{ item.label }}
          </NuxtLink>

          <!-- Color Mode Toggle -->
          <div class="py-2 flex items-center gap-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">Theme:</span>
            <ColorModeToggle />
          </div>

          <!-- Auth Actions - Wrap in ClientOnly to prevent hydration mismatch -->
          <ClientOnly>
            <div v-if="isAuthenticated" class="pt-3 border-t border-gray-200 dark:border-gray-700">
              <p class="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">{{ userName }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">{{ userEmail }}</p>
              <div class="space-y-2">
                <NuxtLink v-if="canAccessAdmin" to="/admin" @click="closeMobileMenu">
                  <BaseButton variant="secondary" class="w-full">
                    Admin Dashboard
                  </BaseButton>
                </NuxtLink>
                <BaseButton variant="outline" @click="handleLogout" class="w-full">
                  Logout
                </BaseButton>
              </div>
            </div>
            <BaseButton v-else variant="primary" @click="handleLogin">
              Admin Login
            </BaseButton>
          </ClientOnly>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const mobileMenuOpen = ref(false)

// Auth state from store
const isAuthenticated = computed(() => authStore.isAuthenticated)
const userName = computed(() => {
  if (!authStore.user) return ''
  return `${authStore.user.first_name} ${authStore.user.last_name}`
})
const userEmail = computed(() => authStore.user?.email || '')
const canAccessAdmin = computed(() => authStore.isEditor)

const navigationItems = [
  { label: 'Home', path: '/' },
  { label: 'Events', path: '/events' },
  { label: 'Announcements', path: '/announcements' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
  { label: 'Help', path: '/help' },
]

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

const handleLogin = () => {
  router.push('/login')
}

const handleLogout = async () => {
  await authStore.logout()
  closeMobileMenu()
  router.push('/')
}
</script>
