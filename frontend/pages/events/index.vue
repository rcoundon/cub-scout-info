<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useEventsStore } from '~/stores/events'

definePageMeta({
  layout: 'default',
})

const eventsStore = useEventsStore()
const searchQuery = ref('')
const eventTypeFilter = ref<'all' | 'meeting' | 'camp' | 'trip' | 'special' | 'other'>('all')
const viewMode = ref<'list' | 'calendar'>('list')

onMounted(async () => {
  await eventsStore.fetchPublishedEvents()
})

const filteredEvents = computed(() => {
  let events = eventsStore.events

  // Filter by event type
  if (eventTypeFilter.value !== 'all') {
    events = events.filter(e => e.event_type === eventTypeFilter.value)
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

  return events.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
})

const upcomingEvents = computed(() => {
  const now = new Date()
  return filteredEvents.value.filter(e => new Date(e.end_date) >= now)
})

const pastEvents = computed(() => {
  const now = new Date()
  return filteredEvents.value.filter(e => new Date(e.end_date) < now)
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getEventTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    meeting: 'Meeting',
    camp: 'Camp',
    trip: 'Trip',
    special: 'Special Event',
    other: 'Other',
  }
  return labels[type] || type
}

const getEventTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    meeting: 'bg-blue-100 text-blue-800',
    camp: 'bg-green-100 text-green-800',
    trip: 'bg-purple-100 text-purple-800',
    special: 'bg-yellow-100 text-yellow-800',
    other: 'bg-gray-100 text-gray-800',
  }
  return colors[type] || colors.other
}
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <!-- Header -->
    <div class="text-center mb-12">
      <h1 class="text-4xl font-display font-bold text-primary-900 mb-4">Upcoming Events</h1>
      <p class="text-xl text-gray-600 max-w-2xl mx-auto">
        Join us for exciting Cubs activities, camps, trips, and special events throughout the year.
      </p>
    </div>

    <!-- Filters and View Toggle -->
    <div class="mb-8">
      <div class="flex flex-col gap-4">
        <!-- Search and Filter Row -->
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
              v-model="eventTypeFilter"
              class="input"
            >
              <option value="all">All Types</option>
              <option value="meeting">Meetings</option>
              <option value="camp">Camps</option>
              <option value="trip">Trips</option>
              <option value="special">Special Events</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <!-- View Toggle -->
        <div class="flex justify-center">
          <div class="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            <button
              @click="viewMode = 'list'"
              :class="{
                'bg-white shadow-sm': viewMode === 'list',
                'text-gray-600 hover:text-gray-900': viewMode !== 'list',
              }"
              class="px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              List View
            </button>
            <button
              @click="viewMode = 'calendar'"
              :class="{
                'bg-white shadow-sm': viewMode === 'calendar',
                'text-gray-600 hover:text-gray-900': viewMode !== 'calendar',
              }"
              class="px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendar View
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="eventsStore.loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      <p class="text-gray-600 mt-4">Loading events...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="eventsStore.error" class="text-center py-12">
      <p class="text-red-600">{{ eventsStore.error }}</p>
    </div>

    <!-- Calendar View -->
    <div v-else-if="viewMode === 'calendar'">
      <EventsCalendar :events="filteredEvents" />
    </div>

    <!-- Events List -->
    <div v-else>
      <!-- Upcoming Events -->
      <div v-if="upcomingEvents.length > 0" class="mb-12">
        <h2 class="text-2xl font-display font-bold text-gray-900 mb-6">Upcoming Events</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NuxtLink
            v-for="event in upcomingEvents"
            :key="event.id"
            :to="`/events/${event.id}`"
            class="block"
          >
            <BaseCard hover class="h-full flex flex-col">
              <div class="flex-1">
                <!-- Event Type Badge -->
                <div class="mb-3 flex items-center gap-2 flex-wrap">
                  <span :class="getEventTypeColor(event.event_type)" class="px-3 py-1 rounded-full text-xs font-medium">
                    {{ getEventTypeLabel(event.event_type) }}
                  </span>
                  <span v-if="event.is_recurring" class="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Recurring
                  </span>
                </div>

                <!-- Title -->
                <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ event.title }}</h3>

                <!-- Date & Time -->
                <div class="flex items-center gap-2 text-gray-600 mb-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p class="font-medium">{{ formatDate(event.start_date) }}</p>
                    <p class="text-sm">{{ formatTime(event.start_date) }} - {{ formatTime(event.end_date) }}</p>
                  </div>
                </div>

                <!-- Location -->
                <div class="flex items-center gap-2 text-gray-600 mb-3">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{{ event.location }}</span>
                </div>

                <!-- Description -->
                <p class="text-gray-600 mb-4 line-clamp-3">{{ event.description }}</p>
              </div>

              <!-- Footer -->
              <div class="flex items-center justify-between pt-4 border-t border-gray-200">
                <div v-if="event.cost !== undefined" class="flex items-center gap-1 text-primary-600 font-semibold">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>£{{ event.cost.toFixed(2) }}</span>
                </div>
                <div v-else class="text-green-600 font-semibold">
                  Free
                </div>

                <span class="text-primary-600 text-sm font-medium">
                  View details →
                </span>
              </div>
            </BaseCard>
          </NuxtLink>
        </div>
      </div>

      <!-- Past Events -->
      <div v-if="pastEvents.length > 0">
        <h2 class="text-2xl font-display font-bold text-gray-900 mb-6">Past Events</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NuxtLink
            v-for="event in pastEvents"
            :key="event.id"
            :to="`/events/${event.id}`"
            class="block"
          >
            <BaseCard hover class="h-full flex flex-col opacity-75">
              <div class="flex-1">
                <!-- Event Type Badge -->
                <div class="mb-3 flex items-center gap-2 flex-wrap">
                  <span :class="getEventTypeColor(event.event_type)" class="px-3 py-1 rounded-full text-xs font-medium">
                    {{ getEventTypeLabel(event.event_type) }}
                  </span>
                  <span v-if="event.is_recurring" class="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Recurring
                  </span>
                </div>

                <!-- Title -->
                <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ event.title }}</h3>

                <!-- Date -->
                <div class="flex items-center gap-2 text-gray-600 mb-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{{ formatDate(event.start_date) }}</span>
                </div>

                <!-- Location -->
                <div class="flex items-center gap-2 text-gray-600 mb-3">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{{ event.location }}</span>
                </div>

                <!-- Description -->
                <p class="text-gray-600 line-clamp-2">{{ event.description }}</p>
              </div>
            </BaseCard>
          </NuxtLink>
        </div>
      </div>

      <!-- No Events -->
      <div v-if="upcomingEvents.length === 0 && pastEvents.length === 0" class="text-center py-12">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="text-gray-600 text-lg">No events found</p>
        <p class="text-gray-500 mt-2">Check back soon for upcoming Cubs activities!</p>
      </div>
    </div>
  </div>
</template>
