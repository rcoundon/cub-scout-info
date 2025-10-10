<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useEventsStore } from '~/stores/events'

definePageMeta({
  layout: 'admin',
  middleware: 'editor',
})

const eventsStore = useEventsStore()
const searchQuery = ref('')
const statusFilter = ref<'all' | 'published' | 'draft' | 'cancelled'>('all')

onMounted(async () => {
  await eventsStore.fetchAllEvents()
})

const filteredEvents = computed(() => {
  let events = eventsStore.events

  // Filter by status
  if (statusFilter.value !== 'all') {
    events = events.filter(e => e.status === statusFilter.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    events = events.filter(e =>
      e.title.toLowerCase().includes(query) ||
      e.description.toLowerCase().includes(query) ||
      e.location.toLowerCase().includes(query)
    )
  }

  return events.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
})

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'published':
      return 'success'
    case 'draft':
      return 'warning'
    case 'cancelled':
      return 'danger'
    default:
      return 'primary'
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const getRecurrenceInfo = (event: any) => {
  if (!event.is_recurring || !event.recurrence_rule) return null

  const freqMatch = event.recurrence_rule.match(/FREQ=(\w+)/)
  const untilMatch = event.recurrence_rule.match(/UNTIL=(\d{8})/)

  if (!freqMatch || !untilMatch) return null

  const frequency = freqMatch[1].toLowerCase()
  const untilStr = untilMatch[1]
  const untilDate = new Date(
    parseInt(untilStr.substring(0, 4)),
    parseInt(untilStr.substring(4, 6)) - 1,
    parseInt(untilStr.substring(6, 8))
  )

  // Calculate approximate number of occurrences
  const startDate = new Date(event.start_date)
  const diffTime = untilDate.getTime() - startDate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  let occurrences = 0
  if (frequency === 'daily') {
    occurrences = diffDays
  } else if (frequency === 'weekly') {
    occurrences = Math.floor(diffDays / 7)
  } else if (frequency === 'monthly') {
    occurrences = Math.floor(diffDays / 30)
  }

  return {
    frequency,
    until: untilDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    occurrences,
  }
}

const deleteEvent = async (id: string, title: string) => {
  if (confirm(`Are you sure you want to delete "${title}"?`)) {
    const success = await eventsStore.deleteEvent(id)
    if (success) {
      // Event deleted successfully
    }
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-display font-bold text-gray-900">Events</h1>
        <p class="text-gray-600 mt-1">Manage Cubs Scout events and activities</p>
      </div>
      <NuxtLink to="/admin/events/new">
        <BaseButton variant="primary">
          Create Event
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
            placeholder="Search events..."
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
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
    </BaseCard>

    <!-- Events List -->
    <div v-if="eventsStore.loading" class="text-center py-12">
      <p class="text-gray-600">Loading events...</p>
    </div>

    <div v-else-if="filteredEvents.length === 0" class="text-center py-12">
      <p class="text-gray-600">No events found</p>
    </div>

    <div v-else class="space-y-4">
      <BaseCard v-for="event in filteredEvents" :key="event.id" :hover="true">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2 flex-wrap">
              <h3 class="text-lg font-semibold text-gray-900">{{ event.title }}</h3>
              <BaseBadge variant="primary">
                {{ event.event_type }}
              </BaseBadge>
              <BaseBadge :variant="getStatusBadgeVariant(event.status)">
                {{ event.status }}
              </BaseBadge>
              <span v-if="event.is_recurring" class="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Recurring
              </span>
            </div>

            <p class="text-gray-600 mb-3">{{ event.description }}</p>

            <div v-if="event.is_recurring && getRecurrenceInfo(event)" class="mb-3 text-sm text-indigo-700 bg-indigo-50 rounded-lg p-2 inline-block">
              <span class="font-medium">Repeats {{ getRecurrenceInfo(event)?.frequency }}</span>
              · ~{{ getRecurrenceInfo(event)?.occurrences }} occurrences
              · Until {{ getRecurrenceInfo(event)?.until }}
            </div>

            <div class="flex flex-wrap gap-4 text-sm text-gray-500">
              <div class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{{ formatDate(event.start_date) }}</span>
              </div>

              <div class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{{ event.location }}</span>
              </div>

              <div v-if="event.cost" class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>£{{ event.cost }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 ml-4">
            <NuxtLink :to="`/admin/events/${event.id}`">
              <BaseButton variant="outline" size="sm">
                Edit
              </BaseButton>
            </NuxtLink>
            <BaseButton
              variant="outline"
              size="sm"
              @click="deleteEvent(event.id, event.title)"
            >
              Delete
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
