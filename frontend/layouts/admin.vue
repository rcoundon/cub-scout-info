<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <DevBanner />
    <ClientOnly>
      <SessionTimeoutWarning />
    </ClientOnly>
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <NuxtLink to="/" class="flex items-center space-x-2">
              <div class="w-10 h-10 bg-primary-600 dark:bg-primary-700 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-xl">CS</span>
              </div>
              <span class="font-display font-semibold text-xl text-gray-900 dark:text-gray-100">
                Admin
              </span>
            </NuxtLink>
          </div>

          <div class="flex items-center space-x-4">
            <NuxtLink to="/" class="text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
              Back to Site
            </NuxtLink>
            <ClientOnly>
              <span class="text-sm text-gray-600 dark:text-gray-300">{{ userName }}</span>
            </ClientOnly>
            <ColorModeToggle />
            <BaseButton variant="outline" size="sm" @click="handleLogout">
              Logout
            </BaseButton>
          </div>
        </div>
      </div>
    </header>

    <div class="flex">
      <!-- Sidebar -->
      <aside class="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-[calc(100vh-4rem)] sticky top-16">
        <nav class="p-4 space-y-1">
          <NuxtLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors"
            :class="isActivePath(item.path) ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'"
          >
            <component :is="item.icon" class="w-5 h-5" />
            <span>{{ item.label }}</span>
          </NuxtLink>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 p-8">
        <slot />
      </main>
    </div>

    <ClientOnly>
      <CookieConsent />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useRouter, useRoute } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const userName = computed(() => {
  if (!authStore.user) return ''
  return `${authStore.user.first_name} ${authStore.user.last_name}`
})

const navItems = [
  {
    label: 'Dashboard',
    path: '/admin',
    icon: 'svg',
  },
  {
    label: 'Events',
    path: '/admin/events',
    icon: 'svg',
  },
  {
    label: 'Announcements',
    path: '/admin/announcements',
    icon: 'svg',
  },
  {
    label: 'Contact Messages',
    path: '/admin/contact',
    icon: 'svg',
  },
  {
    label: 'External Links',
    path: '/admin/external-links',
    icon: 'svg',
  },
  {
    label: 'Users',
    path: '/admin/users',
    icon: 'svg',
  },
  {
    label: 'Help',
    path: '/admin/help',
    icon: 'svg',
  },
]

const isActivePath = (path: string) => {
  if (path === '/admin') {
    return route.path === '/admin'
  }
  return route.path.startsWith(path)
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
}
</script>
