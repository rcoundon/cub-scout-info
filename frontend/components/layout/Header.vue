<template>
  <header class="bg-white shadow-sm sticky top-0 z-50">
    <nav class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center space-x-2">
          <div class="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-xl">CS</span>
          </div>
          <span class="font-display font-semibold text-xl text-gray-900 hidden sm:block">
            Cub Scouts
          </span>
        </NuxtLink>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-6">
          <NuxtLink
            v-for="item in navigationItems"
            :key="item.path"
            :to="item.path"
            class="text-gray-700 hover:text-primary-600 transition-colors font-medium"
          >
            {{ item.label }}
          </NuxtLink>

          <!-- Auth Actions -->
          <div v-if="isAuthenticated" class="flex items-center space-x-4">
            <span class="text-sm text-gray-600">{{ userName }}</span>
            <NuxtLink v-if="canAccessAdmin" to="/admin">
              <BaseButton variant="secondary" size="sm">
                Admin
              </BaseButton>
            </NuxtLink>
            <BaseButton variant="outline" size="sm" @click="handleLogout">
              Logout
            </BaseButton>
          </div>
          <BaseButton v-else variant="primary" size="sm" @click="handleLogin">
            Login
          </BaseButton>
        </div>

        <!-- Mobile Menu Button -->
        <button
          class="md:hidden p-2 rounded-lg hover:bg-gray-100"
          @click="toggleMobileMenu"
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
        class="md:hidden py-4 border-t border-gray-200"
      >
        <div class="flex flex-col space-y-3">
          <NuxtLink
            v-for="item in navigationItems"
            :key="item.path"
            :to="item.path"
            class="text-gray-700 hover:text-primary-600 transition-colors font-medium py-2"
            @click="closeMobileMenu"
          >
            {{ item.label }}
          </NuxtLink>

          <div v-if="isAuthenticated" class="pt-3 border-t border-gray-200">
            <p class="text-sm font-medium text-gray-900 mb-1">{{ userName }}</p>
            <p class="text-xs text-gray-600 mb-2">{{ userEmail }}</p>
            <div class="space-y-2">
              <NuxtLink v-if="canAccessAdmin" to="/admin" @click="closeMobileMenu">
                <BaseButton variant="secondary" size="sm" class="w-full">
                  Admin Dashboard
                </BaseButton>
              </NuxtLink>
              <BaseButton variant="outline" size="sm" @click="handleLogout" class="w-full">
                Logout
              </BaseButton>
            </div>
          </div>
          <BaseButton v-else variant="primary" size="sm" @click="handleLogin">
            Login
          </BaseButton>
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
