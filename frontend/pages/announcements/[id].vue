<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAnnouncementsStore } from '~/stores/announcements'
import { useRoute, useRouter } from 'vue-router'

definePageMeta({
  layout: 'default',
})

const announcementsStore = useAnnouncementsStore()
const route = useRoute()
const router = useRouter()

const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
  const announcementId = route.params.id as string
  const announcement = await announcementsStore.fetchAnnouncementById(announcementId)

  if (!announcement || announcement.status !== 'published') {
    notFound.value = true
  }

  loading.value = false
})

const announcement = computed(() => announcementsStore.currentAnnouncement)

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getPriorityLabel = (priority: number) => {
  if (priority >= 80) return 'Urgent'
  if (priority >= 50) return 'Important'
  return 'Normal'
}

const getPriorityColor = (priority: number) => {
  if (priority >= 80) return 'bg-red-100 text-red-800 border-red-200'
  if (priority >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  return 'bg-blue-100 text-blue-800 border-blue-200'
}

const getPriorityIcon = (priority: number) => {
  if (priority >= 80) return 'warning'
  if (priority >= 50) return 'info'
  return 'message'
}

const isExpired = computed(() => {
  if (!announcement.value?.expires_at) return false
  return new Date(announcement.value.expires_at) < new Date()
})

const isExpiringSoon = computed(() => {
  if (!announcement.value?.expires_at) return false
  const daysUntilExpiry = Math.ceil((new Date(announcement.value.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return daysUntilExpiry <= 7 && daysUntilExpiry > 0
})

const getExpiryText = computed(() => {
  if (!announcement.value?.expires_at) return null
  const daysUntilExpiry = Math.ceil((new Date(announcement.value.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  if (daysUntilExpiry < 0) return 'Expired'
  if (daysUntilExpiry === 0) return 'Expires today'
  if (daysUntilExpiry === 1) return 'Expires tomorrow'
  if (daysUntilExpiry <= 7) return `Expires in ${daysUntilExpiry} days`
  return `Expires on ${formatDate(announcement.value.expires_at)}`
})

const getAttachmentFilename = (url: string) => {
  const parts = url.split('/')
  return decodeURIComponent(parts[parts.length - 1])
}

const goBack = () => {
  router.push('/announcements')
}
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      <p class="text-gray-600 mt-4">Loading announcement...</p>
    </div>

    <!-- Not Found State -->
    <div v-else-if="notFound" class="text-center py-12">
      <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Announcement Not Found</h1>
      <p class="text-gray-600 mb-6">The announcement you're looking for doesn't exist or is no longer available.</p>
      <BaseButton @click="goBack" variant="primary">
        Back to Announcements
      </BaseButton>
    </div>

    <!-- Announcement Detail -->
    <div v-else-if="announcement" class="max-w-4xl mx-auto">
      <!-- Back Button -->
      <div class="mb-6">
        <button @click="goBack" class="flex items-center gap-2 text-primary-600 hover:text-primary-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Announcements
        </button>
      </div>

      <!-- Priority Banner -->
      <div :class="getPriorityColor(announcement.priority)" class="border-l-4 p-4 mb-6 rounded-r-lg">
        <div class="flex items-center gap-3">
          <div class="flex-shrink-0">
            <svg v-if="announcement.priority >= 80" class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <svg v-else-if="announcement.priority >= 50" class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg v-else class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          <div>
            <p class="font-semibold">{{ getPriorityLabel(announcement.priority) }} Announcement</p>
            <p class="text-sm">Posted on {{ formatDate(announcement.created_at) }}</p>
          </div>
        </div>
      </div>

      <!-- Main Content Card -->
      <BaseCard class="mb-6">
        <!-- Title -->
        <h1 class="text-3xl font-display font-bold text-gray-900 mb-6">
          {{ announcement.title }}
        </h1>

        <!-- Expiry Warning -->
        <div v-if="isExpired" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center gap-2 text-red-800">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="font-medium">This announcement has expired</p>
          </div>
        </div>

        <div v-else-if="isExpiringSoon" class="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div class="flex items-center gap-2 text-orange-800">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="font-medium">{{ getExpiryText }}</p>
          </div>
        </div>

        <!-- Content -->
        <div class="prose prose-gray max-w-none mb-6">
          <p class="text-gray-700 text-lg whitespace-pre-wrap">{{ announcement.content }}</p>
        </div>

        <!-- Attachment -->
        <div v-if="announcement.attachment_url" class="mt-6 pt-6 border-t border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">Attachment</h3>
          <a
            :href="announcement.attachment_url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <div class="flex-1">
              <p class="font-medium text-gray-900">{{ getAttachmentFilename(announcement.attachment_url) }}</p>
              <p class="text-sm text-gray-500">Click to download or view</p>
            </div>
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </BaseCard>

      <!-- Metadata Card -->
      <BaseCard class="bg-gray-50">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Announcement Details</h3>
        <div class="space-y-3 text-sm">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <p class="text-gray-500">Posted</p>
              <p class="text-gray-900 font-medium">{{ formatDateTime(announcement.created_at) }}</p>
            </div>
          </div>

          <div v-if="announcement.expires_at" class="flex items-start gap-3">
            <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="text-gray-500">Expires</p>
              <p class="text-gray-900 font-medium" :class="{ 'text-red-600': isExpired, 'text-orange-600': isExpiringSoon }">
                {{ formatDateTime(announcement.expires_at) }}
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <div>
              <p class="text-gray-500">Priority</p>
              <p class="text-gray-900 font-medium">{{ getPriorityLabel(announcement.priority) }}</p>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
