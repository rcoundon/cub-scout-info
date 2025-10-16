import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

export type ExternalLinkParentType = 'event' | 'announcement' | 'global'

export interface ExternalLink {
  id: string
  parent_type: ExternalLinkParentType
  parent_id: string
  url: string
  label?: string
  display_order: number
  is_active: boolean
  created_by: string
  created_at: string
  updated_at?: string
}

export const useExternalLinksStore = defineStore('externalLinks', () => {
  const authStore = useAuthStore()

  // State
  const externalLinks = ref<ExternalLink[]>([])
  const currentExternalLink = ref<ExternalLink | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchActiveExternalLinks() {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      const response = await $fetch<{ links: ExternalLink[] }>(
        `${config.public.apiUrl}/api/external-links`
      )

      externalLinks.value = response.links
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch external links'
      console.error('Error fetching external links:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchEventExternalLinks(eventId: string) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      const response = await $fetch<{ links: ExternalLink[] }>(
        `${config.public.apiUrl}/api/external-links/event/${eventId}`
      )

      return response.links
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch event external links'
      console.error('Error fetching event external links:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchAnnouncementExternalLinks(announcementId: string) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      const response = await $fetch<{ links: ExternalLink[] }>(
        `${config.public.apiUrl}/api/external-links/announcement/${announcementId}`
      )

      return response.links
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch announcement external links'
      console.error('Error fetching announcement external links:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchAllExternalLinks() {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      const response = await $fetch<{ links: ExternalLink[] }>(
        `${config.public.apiUrl}/api/external-links/admin/all`,
        {
          headers: authStore.getAuthHeader(),
        }
      )

      externalLinks.value = response.links
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch external links'
      console.error('Error fetching external links:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchExternalLinkById(id: string) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      const response = await $fetch<{ link: ExternalLink }>(
        `${config.public.apiUrl}/api/external-links/${id}`
      )

      currentExternalLink.value = response.link
      return response.link
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch external link'
      console.error('Error fetching external link:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function createExternalLink(linkData: Omit<ExternalLink, 'id' | 'created_at' | 'updated_at' | 'created_by'>) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()

      const body = {
        parent_type: linkData.parent_type,
        parent_id: linkData.parent_id,
        url: linkData.url,
        label: linkData.label,
        display_order: linkData.display_order,
        is_active: linkData.is_active,
      }

      const response = await $fetch<{ link: ExternalLink }>(
        `${config.public.apiUrl}/api/external-links`,
        {
          method: 'POST',
          headers: {
            ...authStore.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body,
        }
      )

      externalLinks.value.push(response.link)
      return response.link
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to create external link'
      console.error('Error creating external link:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateExternalLink(id: string, updates: Partial<Omit<ExternalLink, 'id' | 'created_at' | 'created_by'>>) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()

      const body = {
        url: updates.url,
        label: updates.label,
        display_order: updates.display_order,
        is_active: updates.is_active,
      }

      const response = await $fetch<{ link: ExternalLink }>(
        `${config.public.apiUrl}/api/external-links/${id}`,
        {
          method: 'PUT',
          headers: {
            ...authStore.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body,
        }
      )

      const index = externalLinks.value.findIndex((l) => l.id === id)
      if (index !== -1) {
        externalLinks.value[index] = response.link
      }

      if (currentExternalLink.value?.id === id) {
        currentExternalLink.value = response.link
      }

      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to update external link'
      console.error('Error updating external link:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteExternalLink(id: string) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      await $fetch(`${config.public.apiUrl}/api/external-links/${id}`, {
        method: 'DELETE',
        headers: authStore.getAuthHeader(),
      })

      externalLinks.value = externalLinks.value.filter((l) => l.id !== id)

      if (currentExternalLink.value?.id === id) {
        currentExternalLink.value = null
      }

      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to delete external link'
      console.error('Error deleting external link:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function reorderExternalLinks(links: Array<{ id: string; display_order: number }>) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      await $fetch(`${config.public.apiUrl}/api/external-links/reorder`, {
        method: 'POST',
        headers: {
          ...authStore.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: { links },
      })

      // Update local state
      links.forEach(({ id, display_order }) => {
        const link = externalLinks.value.find((l) => l.id === id)
        if (link) {
          link.display_order = display_order
        }
      })

      // Re-sort the array
      externalLinks.value.sort((a, b) => a.display_order - b.display_order)

      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to reorder external links'
      console.error('Error reordering external links:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    externalLinks,
    currentExternalLink,
    loading,
    error,

    // Actions
    fetchActiveExternalLinks,
    fetchEventExternalLinks,
    fetchAnnouncementExternalLinks,
    fetchAllExternalLinks,
    fetchExternalLinkById,
    createExternalLink,
    updateExternalLink,
    deleteExternalLink,
    reorderExternalLinks,
  }
})
