import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

export interface Announcement {
  id: string
  title: string
  content: string
  priority: number
  status: 'draft' | 'published' | 'expired'
  expires_at?: string
  attachment_url?: string
  created_by: string
  created_at: string
  updated_at: string
}

export const useAnnouncementsStore = defineStore('announcements', () => {
  const authStore = useAuthStore()

  // State
  const announcements = ref<Announcement[]>([])
  const currentAnnouncement = ref<Announcement | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchPublishedAnnouncements() {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      const response = await $fetch<{ announcements: Announcement[] }>(
        `${config.public.apiUrl}/api/announcements`
      )

      announcements.value = response.announcements
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch announcements'
      console.error('Error fetching announcements:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchAllAnnouncements() {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      const response = await $fetch<{ announcements: Announcement[] }>(
        `${config.public.apiUrl}/api/announcements/admin/all`,
        {
          headers: authStore.getAuthHeader(),
        }
      )

      announcements.value = response.announcements
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch announcements'
      console.error('Error fetching announcements:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchAnnouncementById(id: string) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      const response = await $fetch<{ announcement: Announcement }>(
        `${config.public.apiUrl}/api/announcements/${id}`
      )

      currentAnnouncement.value = response.announcement
      return response.announcement
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch announcement'
      console.error('Error fetching announcement:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function createAnnouncement(announcementData: any) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()

      // Create FormData if there's an attachment
      let body: any
      let headers: any = authStore.getAuthHeader()

      if (announcementData.attachment) {
        const formData = new FormData()
        formData.append('title', announcementData.title)
        formData.append('content', announcementData.content)
        formData.append('priority', announcementData.priority.toString())
        formData.append('status', announcementData.status)
        if (announcementData.expires_at) {
          formData.append('expires_at', announcementData.expires_at)
        }
        formData.append('attachment', announcementData.attachment)
        body = formData
        // Don't set Content-Type header for FormData - browser will set it with boundary
      } else {
        body = {
          title: announcementData.title,
          content: announcementData.content,
          priority: announcementData.priority,
          status: announcementData.status,
          expires_at: announcementData.expires_at,
        }
      }

      const response = await $fetch<{ announcement: Announcement }>(
        `${config.public.apiUrl}/api/announcements`,
        {
          method: 'POST',
          headers,
          body,
        }
      )

      announcements.value.push(response.announcement)
      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to create announcement'
      console.error('Error creating announcement:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateAnnouncement(id: string, updates: any) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()

      // Create FormData if there's an attachment
      let body: any
      let headers: any = authStore.getAuthHeader()

      if (updates.attachment) {
        const formData = new FormData()
        formData.append('title', updates.title)
        formData.append('content', updates.content)
        formData.append('priority', updates.priority.toString())
        formData.append('status', updates.status)
        if (updates.expires_at) {
          formData.append('expires_at', updates.expires_at)
        }
        formData.append('attachment', updates.attachment)
        body = formData
        // Don't set Content-Type header for FormData - browser will set it with boundary
      } else {
        body = {
          title: updates.title,
          content: updates.content,
          priority: updates.priority,
          status: updates.status,
          expires_at: updates.expires_at,
        }
      }

      const response = await $fetch<{ announcement: Announcement }>(
        `${config.public.apiUrl}/api/announcements/${id}`,
        {
          method: 'PUT',
          headers,
          body,
        }
      )

      const index = announcements.value.findIndex((a) => a.id === id)
      if (index !== -1) {
        announcements.value[index] = response.announcement
      }

      if (currentAnnouncement.value?.id === id) {
        currentAnnouncement.value = response.announcement
      }

      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to update announcement'
      console.error('Error updating announcement:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteAnnouncement(id: string) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      await $fetch(`${config.public.apiUrl}/api/announcements/${id}`, {
        method: 'DELETE',
        headers: authStore.getAuthHeader(),
      })

      announcements.value = announcements.value.filter((a) => a.id !== id)

      if (currentAnnouncement.value?.id === id) {
        currentAnnouncement.value = null
      }

      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to delete announcement'
      console.error('Error deleting announcement:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    announcements,
    currentAnnouncement,
    loading,
    error,

    // Actions
    fetchPublishedAnnouncements,
    fetchAllAnnouncements,
    fetchAnnouncementById,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
  }
})
