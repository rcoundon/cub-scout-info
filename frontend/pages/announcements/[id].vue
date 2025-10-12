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
const attachments = ref<any[]>([])
const config = useRuntimeConfig()

onMounted(async () => {
  const announcementId = route.params.id as string
  const announcement = await announcementsStore.fetchAnnouncementById(announcementId)

  if (!announcement || announcement.status !== 'published') {
    notFound.value = true
  }

  // Load attachments
  if (announcement) {
    try {
      const response = await $fetch<{ attachments: any[] }>(
        `${config.public.apiUrl}/api/announcements/${announcementId}/attachments`
      )
      attachments.value = response.attachments
    } catch (error) {
      console.error('Failed to load attachments:', error)
    }
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
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-gray-100 text-gray-800 border-gray-200',
  }
  return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200'
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

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const downloadAttachment = async (attachment: any) => {
  try {
    const downloadUrlResponse = await $fetch<{ downloadUrl: string }>(
      `${config.public.apiUrl}/api/attachments/announcements/${route.params.id}/${attachment.id}/download-url`
    )
    if (typeof window !== 'undefined') {
      window.open(downloadUrlResponse.downloadUrl, '_blank')
    }
  } catch (error) {
    console.error('Failed to download attachment:', error)
  }
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
            <svg v-if="announcement.priority === 'high'" class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <svg v-else-if="announcement.priority === 'medium'" class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg v-else class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          <div>
            <p class="font-semibold">{{ getPriorityLabel(announcement.priority) }} Priority Announcement</p>
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

        <!-- Attachments -->
        <div v-if="attachments.length > 0" class="mt-6 pt-6 border-t border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">Downloads & Documents</h3>
          <div class="space-y-2">
            <a
              v-for="attachment in attachments"
              :key="attachment.id"
              @click.prevent="downloadAttachment(attachment)"
              href="#"
              class="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer group"
            >
              <div class="flex items-center space-x-3 flex-1 min-w-0">
                <svg
                  class="h-6 w-6 text-primary-600 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate group-hover:text-primary-600">
                    {{ attachment.original_name || attachment.file_name }}
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ formatFileSize(attachment.file_size) }}
                  </p>
                </div>
              </div>
              <svg
                class="h-5 w-5 text-gray-400 group-hover:text-primary-600 flex-shrink-0 ml-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </a>
          </div>
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
