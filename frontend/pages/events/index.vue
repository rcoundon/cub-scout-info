<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useEventsStore } from '~/stores/events'

definePageMeta({
  layout: 'default',
})

const eventsStore = useEventsStore()
const searchQuery = ref('')
const eventTypeFilter = ref<'all' | 'meeting' | 'camp' | 'trip' | 'special' | 'fundraising' | 'other'>('all')
const viewMode = ref<'list' | 'calendar'>('list')
const config = useRuntimeConfig()
const showCalendarInstructions = ref(false)

// Age group filter with localStorage persistence
// Default to all groups for SSR
const selectedAgeGroups = ref<string[]>(['beavers', 'cubs', 'scouts'])

// Fetch events on server and client for proper hydration
await eventsStore.fetchPublishedEvents()

// Load saved age group preferences from localStorage on client mount
onMounted(() => {
  if (process.client) {
    const saved = localStorage.getItem('selectedAgeGroups')
    if (saved) {
      selectedAgeGroups.value = JSON.parse(saved)
    }
  }
})

// Save age group preferences to localStorage whenever they change (client only)
watch(selectedAgeGroups, (newGroups) => {
  if (process.client) {
    localStorage.setItem('selectedAgeGroups', JSON.stringify(newGroups))
  }
}, { deep: true })

const subscribeToCalendar = () => {
  const feedUrl = getCalendarFeedUrl()
  window.open(feedUrl, '_blank')
}

const getCalendarFeedUrl = () => {
  const baseUrl = `${config.public.apiUrl}/api/events/calendar.ics`

  // Add selected age groups as query parameters
  if (selectedAgeGroups.value.length > 0 && selectedAgeGroups.value.length < 3) {
    const params = new URLSearchParams()
    selectedAgeGroups.value.forEach(group => {
      params.append('age_group', group)
    })
    return `${baseUrl}?${params.toString()}`
  }

  return baseUrl
}

const copyFeedUrl = async () => {
  const url = getCalendarFeedUrl()
  try {
    await navigator.clipboard.writeText(url)
    alert('Calendar feed URL copied to clipboard!')
  } catch (err) {
    alert(`Calendar feed URL: ${url}`)
  }
}

// Helper function to expand recurring events for calendar view
const expandRecurringEvent = (event: any) => {
  if (!event.is_recurring || !event.recurrence_rule) {
    return [event]
  }

  const occurrences = []
  const startDate = new Date(event.start_date)
  const endDate = new Date(event.end_date)
  const duration = endDate.getTime() - startDate.getTime()

  // Parse recurrence rule (format: FREQ=WEEKLY;UNTIL=20260101)
  const freqMatch = event.recurrence_rule.match(/FREQ=(\w+)/)
  const untilMatch = event.recurrence_rule.match(/UNTIL=(\d{8})/)

  if (!freqMatch || !untilMatch) {
    return [event]
  }

  const frequency = freqMatch[1]
  const untilStr = untilMatch[1]
  const untilDate = new Date(
    parseInt(untilStr.substring(0, 4)),
    parseInt(untilStr.substring(4, 6)) - 1,
    parseInt(untilStr.substring(6, 8))
  )

  let currentDate = new Date(startDate)
  let occurrenceCount = 0
  const maxOccurrences = 1000 // Safety limit

  while (currentDate <= untilDate && occurrenceCount < maxOccurrences) {
    const occurrenceStart = new Date(currentDate)
    const occurrenceEnd = new Date(occurrenceStart.getTime() + duration)

    occurrences.push({
      ...event,
      id: `${event.id}_${occurrenceStart.toISOString().split('T')[0]}`,
      start_date: occurrenceStart.toISOString(),
      end_date: occurrenceEnd.toISOString(),
    })

    // Increment based on frequency
    switch (frequency) {
      case 'DAILY':
        currentDate.setDate(currentDate.getDate() + 1)
        break
      case 'WEEKLY':
        currentDate.setDate(currentDate.getDate() + 7)
        break
      case 'MONTHLY':
        currentDate.setMonth(currentDate.getMonth() + 1)
        break
      default:
        return [event]
    }

    occurrenceCount++
  }

  return occurrences
}

const filteredEvents = computed(() => {
  let events = eventsStore.events

  // Filter by age group
  if (selectedAgeGroups.value.length > 0) {
    events = events.filter(e => selectedAgeGroups.value.includes(e.age_group))
  }

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

// Expanded events for calendar view (with recurring events expanded)
const expandedEventsForCalendar = computed(() => {
  const expanded: any[] = []
  for (const event of filteredEvents.value) {
    expanded.push(...expandRecurringEvent(event))
  }
  return expanded.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
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
    fundraising: 'Fundraising',
    other: 'Other',
  }
  return labels[type] || type
}

// Age group colors (used for card backgrounds/borders)
const getAgeGroupColor = (ageGroup: string) => {
  const colors: Record<string, string> = {
    beavers: 'bg-primary-500 border-primary-600',
    cubs: 'bg-green-700 border-green-800',
    scouts: 'bg-teal-600 border-teal-700',
  }
  return colors[ageGroup] || colors.cubs
}

const getAgeGroupLabel = (ageGroup: string) => {
  const labels: Record<string, string> = {
    beavers: 'Beavers',
    cubs: 'Cubs',
    scouts: 'Scouts',
  }
  return labels[ageGroup] || ageGroup
}

// Event type icons (SVG paths)
const getEventTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    meeting: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', // Users/meeting icon
    camp: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', // Home/tent icon
    trip: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', // Map/location icon
    special: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', // Star icon
    fundraising: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', // Dollar/money icon
    other: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z', // Chat/other icon
  }
  return icons[type] || icons.other
}
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <!-- Header -->
    <div class="text-center mb-8 sm:mb-12 px-4">
      <h1 class="text-3xl sm:text-4xl font-display font-bold text-primary-900 mb-3 sm:mb-4">Upcoming Events</h1>
      <p class="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto mb-4 sm:mb-6">
        Join us for exciting Cubs activities, camps, trips, and special events throughout the year.
      </p>

      <!-- Subscribe to Calendar Buttons -->
      <div class="flex flex-col sm:flex-row justify-center gap-3 px-4 max-w-2xl mx-auto">
        <button
          @click="showCalendarInstructions = !showCalendarInstructions"
          class="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm text-sm sm:text-base"
        >
          <svg class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span class="whitespace-nowrap">Subscribe for Live Updates</span>
        </button>
        <button
          @click="subscribeToCalendar"
          class="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-secondary-100 border-2 border-secondary-600 text-secondary-900 rounded-lg hover:bg-secondary-200 transition-colors font-medium shadow-sm text-sm sm:text-base"
        >
          <svg class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span class="whitespace-nowrap">Download One-Time Snapshot</span>
        </button>
      </div>
      <div class="px-4 max-w-2xl mx-auto">
        <!-- Age group filter notice -->
        <div v-if="selectedAgeGroups.length > 0 && selectedAgeGroups.length < 3" class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p class="text-xs sm:text-sm text-blue-800 text-center flex items-center justify-center gap-2">
            <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Your calendar will include only
              <strong>{{ selectedAgeGroups.map(g => getAgeGroupLabel(g)).join(' and ') }}</strong>
              events. Change your selection below to include other age groups.
            </span>
          </p>
        </div>
        <p class="text-xs sm:text-sm text-gray-600 mt-3 text-center">
          <span class="font-medium text-primary-700">📅 Subscribe for automatic updates</span> - New events appear automatically in your calendar
        </p>
        <p class="text-xs text-gray-500 mt-1 text-center">
          Or download a one-time snapshot that won't update when events change
        </p>
        <p class="text-xs text-gray-600 mt-2 flex items-start sm:items-center justify-center gap-1">
          <svg class="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>You can also click on any event below to add it individually to Google Calendar or download as .ics</span>
        </p>
      </div>

      <!-- Calendar Instructions -->
      <div v-if="showCalendarInstructions" class="mt-6 max-w-2xl mx-auto">
        <BaseCard class="bg-blue-50 border-blue-200">
          <div class="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
            <p class="text-sm text-green-800 font-medium flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Subscribe once and get automatic updates forever!
            </p>
            <p class="text-xs text-green-700 mt-1 ml-7">
              When we add, update, or cancel events, they'll automatically sync to your calendar (usually within 24 hours).
            </p>
          </div>

          <div class="mb-4 p-3 bg-blue-100 border border-blue-200 rounded-lg">
            <p class="text-sm text-blue-800 font-medium mb-2">Two ways to add events:</p>
            <ul class="text-xs text-blue-700 space-y-1 ml-4">
              <li class="flex items-start gap-2">
                <span class="font-bold mt-0.5">1.</span>
                <span><strong>Subscribe to all events</strong> (recommended) - Follow the instructions below to get automatic updates for all Cubs events</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="font-bold mt-0.5">2.</span>
                <span><strong>Add individual events</strong> - Click on any event card below and use the "Add to Calendar" buttons on the event detail page</span>
              </li>
            </ul>
          </div>

          <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How to Subscribe to Cubs Events Calendar
          </h3>

          <!-- Google Calendar Instructions -->
          <div class="mb-4">
            <h4 class="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="#4285F4"/>
                <path d="M20 10H10v4h10v-4z" fill="#34A853"/>
                <path d="M20 14H4v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6z" fill="#FBBC04"/>
                <path d="M10 10h10V5a2 2 0 0 0-2-2h-6v7z" fill="#EA4335"/>
              </svg>
              Google Calendar
            </h4>
            <ol class="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-4">
              <li>Open Google Calendar on your computer</li>
              <li>On the left, next to "Other calendars," click the + button</li>
              <li>Click "From URL"</li>
              <li>Paste this URL:
                <div class="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    readonly
                    :value="getCalendarFeedUrl()"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded text-xs font-mono bg-white"
                  />
                  <button
                    @click="copyFeedUrl"
                    class="px-3 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </li>
              <li>Click "Add calendar"</li>
            </ol>
          </div>

          <!-- Apple Calendar Instructions -->
          <div class="mb-4">
            <h4 class="font-medium text-gray-900 mb-2">📅 Apple Calendar</h4>
            <ol class="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-4">
              <li>Open Calendar on your Mac</li>
              <li>Go to File → New Calendar Subscription</li>
              <li>Paste the URL above and click Subscribe</li>
              <li>Choose your preferred update frequency</li>
            </ol>
          </div>

          <!-- Outlook Instructions -->
          <div>
            <h4 class="font-medium text-gray-900 mb-2">📧 Outlook</h4>
            <ol class="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-4">
              <li>Open Outlook Calendar</li>
              <li>Click "Add Calendar" → "Subscribe from web"</li>
              <li>Paste the URL above and give it a name</li>
              <li>Click Import</li>
            </ol>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Filters and View Toggle -->
    <div class="mb-8">
      <div class="flex flex-col gap-4">
        <!-- Age Group Filter -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <label class="block text-sm font-semibold text-gray-700 mb-3">Show Events For:</label>
          <div class="flex flex-wrap gap-3">
            <label
              v-for="group in ['beavers', 'cubs', 'scouts']"
              :key="group"
              class="flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all"
              :class="
                selectedAgeGroups.includes(group)
                  ? getAgeGroupColor(group) + ' text-white border-transparent'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
              "
            >
              <input
                type="checkbox"
                :value="group"
                v-model="selectedAgeGroups"
                class="w-4 h-4 rounded"
                :class="
                  selectedAgeGroups.includes(group)
                    ? 'text-white bg-white/30 border-white/50'
                    : 'text-primary-600 border-gray-300'
                "
              />
              <span class="font-medium">{{ getAgeGroupLabel(group) }}</span>
              <span class="text-xs opacity-80">
                {{ group === 'beavers' ? '(6-8)' : group === 'cubs' ? '(8-10½)' : '(10½-14)' }}
              </span>
            </label>
          </div>
        </div>

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
              <option value="fundraising">Fundraising</option>
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
      <EventsCalendar :events="expandedEventsForCalendar" />
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
            <div :class="{ 'stacked-card': event.is_recurring }">
              <div :class="{ 'ring-2 ring-red-300 ring-offset-0 rounded-lg': event.status === 'cancelled' }">
                <!-- Cancelled Banner or Spacer -->
                <div v-if="event.status === 'cancelled'" class="bg-red-600 text-white text-center py-1 text-xs font-bold uppercase tracking-wide rounded-t-lg">
                  Event Cancelled
                </div>
                <div v-else class="h-[28px]"></div>
                <BaseCard hover :class="{ 'opacity-75': event.status === 'cancelled' }" class="h-full flex flex-col relative z-10 rounded-t-none">
              <div class="flex-1">
                <!-- Age Group and Event Type Badges -->
                <div class="mb-3 flex items-center gap-2 flex-wrap">
                  <!-- Age Group Badge (Primary) -->
                  <span :class="getAgeGroupColor(event.age_group)" class="px-3 py-1 rounded-full text-xs font-medium text-white">
                    {{ getAgeGroupLabel(event.age_group) }}
                  </span>
                  <!-- Event Type with Icon -->
                  <div class="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getEventTypeIcon(event.event_type)" />
                    </svg>
                    <span>{{ getEventTypeLabel(event.event_type) }}</span>
                  </div>
                  <!-- Recurring Badge -->
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
              </div>
            </div>
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
            <div :class="{ 'stacked-card': event.is_recurring }">
              <div :class="{ 'ring-2 ring-red-300 ring-offset-0 rounded-lg': event.status === 'cancelled' }">
                <!-- Cancelled Banner or Spacer -->
                <div v-if="event.status === 'cancelled'" class="bg-red-600 text-white text-center py-1 text-xs font-bold uppercase tracking-wide rounded-t-lg">
                  Event Cancelled
                </div>
                <div v-else class="h-[28px]"></div>
                <BaseCard hover class="h-full flex flex-col opacity-75 relative z-10 rounded-t-none">
              <div class="flex-1">
                <!-- Age Group and Event Type Badges -->
                <div class="mb-3 flex items-center gap-2 flex-wrap">
                  <!-- Age Group Badge (Primary) -->
                  <span :class="getAgeGroupColor(event.age_group)" class="px-3 py-1 rounded-full text-xs font-medium text-white">
                    {{ getAgeGroupLabel(event.age_group) }}
                  </span>
                  <!-- Event Type with Icon -->
                  <div class="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getEventTypeIcon(event.event_type)" />
                    </svg>
                    <span>{{ getEventTypeLabel(event.event_type) }}</span>
                  </div>
                  <!-- Recurring Badge -->
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
              </div>
            </div>
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

<style scoped>
.stacked-card {
  position: relative;
  padding-bottom: 8px;
}

/* First card behind */
.stacked-card::before {
  content: '';
  position: absolute;
  top: 32px;
  left: 4px;
  right: -4px;
  bottom: 4px;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

/* Second card behind */
.stacked-card::after {
  content: '';
  position: absolute;
  top: 36px;
  left: 8px;
  right: -8px;
  bottom: 0;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
  z-index: 0;
}

/* Adjust hover effect for stacked cards */
.stacked-card:hover::before {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
}

.stacked-card:hover::after {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
}
</style>
