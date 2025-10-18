<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useEventsStore, type Event } from '~/stores/events'
import { useAnnouncementsStore, type Announcement } from '~/stores/announcements'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const eventsStore = useEventsStore()
const announcementsStore = useAnnouncementsStore()

const stats = ref({
  totalEvents: 0,
  publishedEvents: 0,
  draftEvents: 0,
  totalAnnouncements: 0,
  publishedAnnouncements: 0,
})

type ActivityItem = {
  id: string
  type: 'event' | 'announcement'
  title: string
  status: string
  updated_at: string
  link: string
}

const recentActivity = computed<ActivityItem[]>(() => {
  const activities: ActivityItem[] = []

  // Add events
  eventsStore.events.forEach((event: Event) => {
    activities.push({
      id: event.id,
      type: 'event',
      title: event.title,
      status: event.status,
      updated_at: event.updated_at || event.created_at,
      link: `/admin/events/${event.id}`,
    })
  })

  // Add announcements
  announcementsStore.announcements.forEach((announcement: Announcement) => {
    activities.push({
      id: announcement.id,
      type: 'announcement',
      title: announcement.title,
      status: announcement.status,
      updated_at: announcement.updated_at || announcement.created_at,
      link: `/admin/announcements/${announcement.id}`,
    })
  })

  // Sort by most recent and take top 5
  return activities
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5)
})

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'published': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
    case 'draft': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30'
    case 'cancelled': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30'
    case 'archived': return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700'
    default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700'
  }
}

onMounted(async () => {
  await Promise.all([
    eventsStore.fetchAllEvents(),
    announcementsStore.fetchAllAnnouncements(),
  ])

  // Calculate stats
  stats.value.totalEvents = eventsStore.events.length
  stats.value.publishedEvents = eventsStore.events.filter(e => e.status === 'published').length
  stats.value.draftEvents = eventsStore.events.filter(e => e.status === 'draft').length
  stats.value.totalAnnouncements = announcementsStore.announcements.length
  stats.value.publishedAnnouncements = announcementsStore.announcements.filter(a => a.status === 'published').length
})
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
      <p class="text-gray-600 dark:text-gray-300 mt-2">Welcome to the Cubs Scout admin portal</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Total Events -->
      <BaseCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-300">Total Events</p>
            <p class="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{{ stats.totalEvents }}</p>
          </div>
          <div class="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-primary-600 dark:text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </BaseCard>

      <!-- Published Events -->
      <BaseCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-300">Published Events</p>
            <p class="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{{ stats.publishedEvents }}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </BaseCard>

      <!-- Draft Events -->
      <BaseCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-300">Draft Events</p>
            <p class="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{{ stats.draftEvents }}</p>
          </div>
          <div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        </div>
      </BaseCard>

      <!-- Announcements -->
      <BaseCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-300">Active Announcements</p>
            <p class="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{{ stats.publishedAnnouncements }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <BaseCard>
        <template #header>
          <h2 class="text-xl font-semibold">Quick Actions</h2>
        </template>
        <div class="space-y-3">
          <NuxtLink to="/admin/events/new" class="block">
            <BaseButton variant="primary" class="w-full">
              Create New Event
            </BaseButton>
          </NuxtLink>
          <NuxtLink to="/admin/announcements/new" class="block">
            <BaseButton variant="secondary" class="w-full">
              Create New Announcement
            </BaseButton>
          </NuxtLink>
          <NuxtLink to="/admin/users" class="block">
            <BaseButton variant="outline" class="w-full">
              Manage Users
            </BaseButton>
          </NuxtLink>
        </div>
      </BaseCard>

      <BaseCard>
        <template #header>
          <h2 class="text-xl font-semibold">Recent Activity</h2>
        </template>
        <div v-if="recentActivity.length === 0" class="text-center py-8">
          <svg class="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm text-gray-600 dark:text-gray-300">No recent activity</p>
        </div>
        <div v-else class="space-y-3">
          <NuxtLink
            v-for="item in recentActivity"
            :key="item.id"
            :to="item.link"
            class="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {{ item.type }}
                  </span>
                  <span
                    class="px-2 py-0.5 text-xs font-medium rounded-full"
                    :class="getStatusColor(item.status)"
                  >
                    {{ item.status }}
                  </span>
                </div>
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {{ item.title }}
                </p>
              </div>
              <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {{ formatTimeAgo(item.updated_at) }}
              </span>
            </div>
          </NuxtLink>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
