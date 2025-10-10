import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

export interface Event {
  id: string
  title: string
  event_type: 'meeting' | 'camp' | 'trip' | 'special' | 'other'
  start_date: string
  end_date: string
  location: string
  description: string
  cost?: number
  what_to_bring?: string
  rsvp_deadline?: string
  organizer_name?: string
  organizer_contact?: string
  is_recurring: boolean
  recurrence_rule?: string
  status: 'draft' | 'published' | 'cancelled' | 'archived'
  created_by: string
  created_at: string
  updated_at: string
}

export const useEventsStore = defineStore('events', () => {
  const authStore = useAuthStore()

  // State
  const events = ref<Event[]>([])
  const currentEvent = ref<Event | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchPublishedEvents() {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      const response = await $fetch<{ events: Event[] }>(
        `${config.public.apiUrl}/api/events`
      )

      events.value = response.events
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch events'
      console.error('Error fetching events:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchAllEvents() {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      const response = await $fetch<{ events: Event[] }>(
        `${config.public.apiUrl}/api/events/admin/all`,
        {
          headers: authStore.getAuthHeader(),
        }
      )

      events.value = response.events
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch events'
      console.error('Error fetching events:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchEventById(id: string) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      const response = await $fetch<{ event: Event }>(
        `${config.public.apiUrl}/api/events/${id}`,
        {
          headers: authStore.getAuthHeader(),
        }
      )

      currentEvent.value = response.event
      return response.event
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch event'
      console.error('Error fetching event:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function createEvent(eventData: Partial<Event>) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      const response = await $fetch<{ event: Event }>(
        `${config.public.apiUrl}/api/events`,
        {
          method: 'POST',
          headers: authStore.getAuthHeader(),
          body: eventData,
        }
      )

      events.value.push(response.event)
      return response.event
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to create event'
      console.error('Error creating event:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateEvent(id: string, updates: Partial<Event>) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      const response = await $fetch<{ event: Event }>(
        `${config.public.apiUrl}/api/events/${id}`,
        {
          method: 'PUT',
          headers: authStore.getAuthHeader(),
          body: updates,
        }
      )

      const index = events.value.findIndex((e) => e.id === id)
      if (index !== -1) {
        events.value[index] = response.event
      }

      if (currentEvent.value?.id === id) {
        currentEvent.value = response.event
      }

      return response.event
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to update event'
      console.error('Error updating event:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function deleteEvent(id: string) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      await $fetch(`${config.public.apiUrl}/api/events/${id}`, {
        method: 'DELETE',
        headers: authStore.getAuthHeader(),
      })

      events.value = events.value.filter((e) => e.id !== id)

      if (currentEvent.value?.id === id) {
        currentEvent.value = null
      }

      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to delete event'
      console.error('Error deleting event:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    events,
    currentEvent,
    loading,
    error,

    // Actions
    fetchPublishedEvents,
    fetchAllEvents,
    fetchEventById,
    createEvent,
    updateEvent,
    deleteEvent,
  }
})
