<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAnnouncementsStore } from '~/stores/announcements'

definePageMeta({
  layout: 'default',
})

const announcementsStore = useAnnouncementsStore()
const searchQuery = ref('')

onMounted(async () => {
  await announcementsStore.fetchPublishedAnnouncements()
})

const filteredAnnouncements = computed(() => {
  let announcements = announcementsStore.announcements

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    announcements = announcements.filter(a =>
      a.title.toLowerCase().includes(query) ||
      a.content.toLowerCase().includes(query)
    )
  }

  // Sort by priority (high > medium > low) then by date (newer first)
  const priorityOrder = { high: 3, medium: 2, low: 1 }
  return announcements.sort((a, b) => {
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
    if (priorityDiff !== 0) return priorityDiff
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  }
  return labels[priority] || priority
}

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-800',
  }
  return colors[priority] || 'bg-gray-100 text-gray-800'
}

const isExpiringSoon = (expiresAt?: string) => {
  if (!expiresAt) return false
  const daysUntilExpiry = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return daysUntilExpiry <= 7 && daysUntilExpiry > 0
}

const getExpiryText = (expiresAt?: string) => {
  if (!expiresAt) return null
  const daysUntilExpiry = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  if (daysUntilExpiry < 0) return 'Expired'
  if (daysUntilExpiry === 0) return 'Expires today'
  if (daysUntilExpiry === 1) return 'Expires tomorrow'
  if (daysUntilExpiry <= 7) return `Expires in ${daysUntilExpiry} days`
  return null
}
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <!-- Header -->
    <div class="text-center mb-12">
      <h1 class="text-4xl font-display font-bold text-primary-900 mb-4">Announcements</h1>
      <p class="text-xl text-gray-600 max-w-2xl mx-auto">
        Stay informed with important updates, news, and information for Cubs families.
      </p>
    </div>

    <!-- Search -->
    <div class="mb-8 max-w-xl mx-auto">
      <BaseInput
        v-model="searchQuery"
        type="text"
        placeholder="Search announcements..."
      />
    </div>

    <!-- Loading State -->
    <div v-if="announcementsStore.loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      <p class="text-gray-600 mt-4">Loading announcements...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="announcementsStore.error" class="text-center py-12">
      <p class="text-red-600">{{ announcementsStore.error }}</p>
    </div>

    <!-- Announcements List -->
    <div v-else>
      <div v-if="filteredAnnouncements.length > 0" class="max-w-4xl mx-auto space-y-6">
        <NuxtLink
          v-for="announcement in filteredAnnouncements"
          :key="announcement.id"
          :to="`/announcements/${announcement.id}`"
          class="block"
        >
          <BaseCard hover>
            <div class="flex flex-col sm:flex-row sm:items-start gap-4">
              <!-- Priority Indicator -->
              <div class="flex-shrink-0">
                <div
                  :class="getPriorityColor(announcement.priority)"
                  class="w-12 h-12 rounded-full flex items-center justify-center"
                >
                  <svg v-if="announcement.priority === 'high'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <svg v-else-if="announcement.priority === 'medium'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <!-- Header -->
                <div class="flex flex-wrap items-center gap-2 mb-2">
                  <span :class="getPriorityColor(announcement.priority)" class="px-3 py-1 rounded-full text-xs font-medium">
                    {{ getPriorityLabel(announcement.priority) }}
                  </span>

                  <span v-if="announcement.attachment_url" class="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Attachment
                  </span>

                  <span v-if="isExpiringSoon(announcement.expires_at)" class="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    {{ getExpiryText(announcement.expires_at) }}
                  </span>
                </div>

                <!-- Title -->
                <h2 class="text-xl font-semibold text-gray-900 mb-2">
                  {{ announcement.title }}
                </h2>

                <!-- Content Preview -->
                <p class="text-gray-600 mb-3 line-clamp-2">
                  {{ announcement.content }}
                </p>

                <!-- Footer -->
                <div class="flex items-center justify-between text-sm">
                  <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-2 text-gray-500">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{{ formatDate(announcement.created_at) }}</span>
                    </div>
                    <div class="text-xs text-gray-400">
                      Created by {{ announcement.creator_name || 'Unknown' }}
                    </div>
                  </div>

                  <span class="text-primary-600 font-medium flex items-center gap-1">
                    Read more
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </BaseCard>
        </NuxtLink>
      </div>

      <!-- No Announcements -->
      <div v-else class="text-center py-12">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        <p class="text-gray-600 text-lg">No announcements found</p>
        <p class="text-gray-500 mt-2">Check back soon for updates and news!</p>
      </div>
    </div>
  </div>
</template>
