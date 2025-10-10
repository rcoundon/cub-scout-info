<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAnnouncementsStore } from '~/stores/announcements'

definePageMeta({
  layout: 'admin',
  middleware: 'editor',
})

const announcementsStore = useAnnouncementsStore()
const searchQuery = ref('')
const statusFilter = ref<'all' | 'published' | 'draft'>('all')

onMounted(async () => {
  await announcementsStore.fetchAllAnnouncements()
})

const filteredAnnouncements = computed(() => {
  let announcements = announcementsStore.announcements

  // Filter by status
  if (statusFilter.value !== 'all') {
    announcements = announcements.filter(a => a.status === statusFilter.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    announcements = announcements.filter(a =>
      a.title.toLowerCase().includes(query) ||
      a.content.toLowerCase().includes(query)
    )
  }

  // Sort by priority (highest first), then by created date
  return announcements.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
})

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'published':
      return 'success'
    case 'draft':
      return 'warning'
    default:
      return 'primary'
  }
}

const getPriorityBadgeVariant = (priority: number) => {
  if (priority >= 8) return 'danger'
  if (priority >= 5) return 'warning'
  return 'primary'
}

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

const deleteAnnouncement = async (id: string, title: string) => {
  if (confirm(`Are you sure you want to delete "${title}"?`)) {
    const success = await announcementsStore.deleteAnnouncement(id)
    if (success) {
      // Announcement deleted successfully
    }
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-display font-bold text-gray-900">Announcements</h1>
        <p class="text-gray-600 mt-1">Manage important announcements for parents and scouts</p>
      </div>
      <NuxtLink to="/admin/announcements/new">
        <BaseButton variant="primary">
          Create Announcement
        </BaseButton>
      </NuxtLink>
    </div>

    <!-- Filters -->
    <BaseCard class="mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <BaseInput
            v-model="searchQuery"
            type="text"
            placeholder="Search announcements..."
          />
        </div>
        <div class="w-full sm:w-48">
          <select
            v-model="statusFilter"
            class="input"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>
    </BaseCard>

    <!-- Announcements List -->
    <div v-if="announcementsStore.loading" class="text-center py-12">
      <p class="text-gray-600">Loading announcements...</p>
    </div>

    <div v-else-if="filteredAnnouncements.length === 0" class="text-center py-12">
      <p class="text-gray-600">No announcements found</p>
    </div>

    <div v-else class="space-y-4">
      <BaseCard v-for="announcement in filteredAnnouncements" :key="announcement.id" :hover="true">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h3 class="text-lg font-semibold text-gray-900">{{ announcement.title }}</h3>
              <BaseBadge :variant="getStatusBadgeVariant(announcement.status)">
                {{ announcement.status }}
              </BaseBadge>
              <BaseBadge :variant="getPriorityBadgeVariant(announcement.priority)">
                Priority {{ announcement.priority }}
              </BaseBadge>
            </div>

            <p class="text-gray-600 mb-3 whitespace-pre-wrap">{{ announcement.content }}</p>

            <div class="flex flex-wrap gap-4 text-sm text-gray-500">
              <div class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Created {{ formatDate(announcement.created_at) }}</span>
              </div>

              <div v-if="announcement.expires_at" class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Expires {{ formatDateTime(announcement.expires_at) }}</span>
              </div>

              <div v-if="announcement.attachment_url" class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <a :href="announcement.attachment_url" target="_blank" class="text-primary-600 hover:text-primary-700 underline">
                  View attachment
                </a>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 ml-4">
            <NuxtLink :to="`/admin/announcements/${announcement.id}`">
              <BaseButton variant="outline" size="sm">
                Edit
              </BaseButton>
            </NuxtLink>
            <BaseButton
              variant="outline"
              size="sm"
              @click="deleteAnnouncement(announcement.id, announcement.title)"
            >
              Delete
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
