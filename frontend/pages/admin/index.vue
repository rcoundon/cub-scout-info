<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEventsStore } from '~/stores/events'
import { useAnnouncementsStore } from '~/stores/announcements'

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
      <h1 class="text-3xl font-display font-bold text-gray-900">Dashboard</h1>
      <p class="text-gray-600 mt-2">Welcome to the Cubs Scout admin portal</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Total Events -->
      <BaseCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Total Events</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats.totalEvents }}</p>
          </div>
          <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </BaseCard>

      <!-- Published Events -->
      <BaseCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Published Events</p>
            <p class="text-3xl font-bold text-green-600 mt-1">{{ stats.publishedEvents }}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </BaseCard>

      <!-- Draft Events -->
      <BaseCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Draft Events</p>
            <p class="text-3xl font-bold text-yellow-600 mt-1">{{ stats.draftEvents }}</p>
          </div>
          <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        </div>
      </BaseCard>

      <!-- Announcements -->
      <BaseCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Active Announcements</p>
            <p class="text-3xl font-bold text-blue-600 mt-1">{{ stats.publishedAnnouncements }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div class="space-y-3">
          <p class="text-sm text-gray-600">Latest events and announcements will appear here</p>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
