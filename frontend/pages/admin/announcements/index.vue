<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAnnouncementsStore } from '~/stores/announcements'

definePageMeta({
  layout: 'admin',
  middleware: 'editor',
})

const announcementsStore = useAnnouncementsStore()
const toast = useToast()
const searchQuery = ref('')
const statusFilter = ref<'all' | 'published' | 'draft'>('all')
const showDeleteModal = ref(false)
const deletingAnnouncement = ref<any | null>(null)
const deleting = ref(false)

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

  // Sort by priority (high > medium > low) then by date (newer first)
  const priorityOrder = { high: 3, medium: 2, low: 1 }
  return announcements.sort((a, b) => {
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
    if (priorityDiff !== 0) return priorityDiff
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

const getPriorityBadgeVariant = (priority: string) => {
  const variants: Record<string, string> = {
    high: 'danger',
    medium: 'warning',
    low: 'primary',
  }
  return variants[priority] || 'primary'
}

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  }
  return labels[priority] || priority
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

const openDeleteModal = (announcement: any) => {
  deletingAnnouncement.value = announcement
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  deletingAnnouncement.value = null
}

const confirmDelete = async () => {
  if (!deletingAnnouncement.value) return

  deleting.value = true
  const announcementTitle = deletingAnnouncement.value.title

  try {
    const success = await announcementsStore.deleteAnnouncement(deletingAnnouncement.value.id)
    if (success) {
      toast.add({
        title: 'Announcement deleted',
        description: `"${announcementTitle}" has been deleted successfully.`,
        color: 'success',
      })
      closeDeleteModal()
    } else {
      toast.add({
        title: 'Error',
        description: 'Failed to delete announcement. Please try again.',
        color: 'error',
      })
    }
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">Announcements</h1>
        <p class="text-gray-600 dark:text-gray-300 mt-1">Manage important announcements for parents and scouts</p>
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
      <p class="text-gray-600 dark:text-gray-300">Loading announcements...</p>
    </div>

    <div v-else-if="filteredAnnouncements.length === 0" class="text-center py-12">
      <p class="text-gray-600 dark:text-gray-300">No announcements found</p>
    </div>

    <div v-else class="space-y-4">
      <BaseCard v-for="announcement in filteredAnnouncements" :key="announcement.id" :hover="true">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ announcement.title }}</h3>
              <BaseBadge :variant="getStatusBadgeVariant(announcement.status)">
                {{ announcement.status }}
              </BaseBadge>
              <BaseBadge :variant="getPriorityBadgeVariant(announcement.priority)">
                Priority {{ getPriorityLabel(announcement.priority) }}
              </BaseBadge>
            </div>

            <p class="text-gray-600 dark:text-gray-300 mb-3 whitespace-pre-wrap">{{ announcement.content }}</p>

            <div class="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Created {{ formatDate(announcement.created_at) }} by {{ announcement.creator_name || 'Unknown' }}</span>
              </div>

              <div v-if="announcement.updated_at && announcement.updated_at !== announcement.created_at" class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Updated {{ formatDateTime(announcement.updated_at) }}</span>
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
                <a :href="announcement.attachment_url" target="_blank" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline">
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
              @click="openDeleteModal(announcement)"
            >
              Delete
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Delete Confirmation Modal -->
    <BaseConfirmDialog
      v-model="showDeleteModal"
      title="Delete Announcement"
      message="This will permanently delete the announcement."
      confirm-text="Delete Announcement"
      :loading="deleting"
      loading-text="Deleting..."
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    >
      <div v-if="deletingAnnouncement">
        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
          {{ deletingAnnouncement.title }}
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ deletingAnnouncement.content.substring(0, 100) }}{{ deletingAnnouncement.content.length > 100 ? '...' : '' }}
        </p>
      </div>
    </BaseConfirmDialog>
  </div>
</template>
