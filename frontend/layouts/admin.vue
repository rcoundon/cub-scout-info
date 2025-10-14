<template>
  <div class="min-h-screen bg-gray-50">
    <SessionTimeoutWarning />
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <NuxtLink to="/" class="flex items-center space-x-2">
              <div class="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-xl">CS</span>
              </div>
              <span class="font-display font-semibold text-xl text-gray-900">
                Admin
              </span>
            </NuxtLink>
          </div>

          <div class="flex items-center space-x-4">
            <NuxtLink to="/" class="text-sm text-gray-600 hover:text-primary-600">
              Back to Site
            </NuxtLink>
            <span class="text-sm text-gray-600">{{ userName }}</span>
            <BaseButton variant="outline" size="sm" @click="handleLogout">
              Logout
            </BaseButton>
          </div>
        </div>
      </div>
    </header>

    <div class="flex">
      <!-- Sidebar -->
      <aside class="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] sticky top-16">
        <nav class="p-4 space-y-1">
          <NuxtLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors"
            :class="isActivePath(item.path) ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'"
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
