<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEventsStore } from '~/stores/events'

definePageMeta({
  layout: 'default',
})

const eventsStore = useEventsStore()

// Fetch events on server and client for proper hydration
await eventsStore.fetchPublishedEvents()

// Capture the current time once during SSR to avoid hydration mismatches
const currentTime = ref(new Date())

const meetingInfo = [
  {
    ageGroup: 'beavers' as const,
    label: 'Beavers',
    ageRange: '6-8 years',
    meetings: [
      { day: 'Monday', time: '6:00 PM - 7:15 PM' }
    ],
    location: 'Scout Hut',
    address: 'Parish Piece, HP15 6SP',
    color: 'bg-primary-500',
    borderColor: 'border-primary-600',
  },
  {
    ageGroup: 'cubs' as const,
    label: 'Cubs',
    ageRange: '8-10½ years',
    meetings: [
      { day: 'Monday', time: '6:45 PM - 8:15 PM' },
      { day: 'Thursday', time: '6:45 PM - 8:15 PM' }
    ],
    location: 'Scout Hut',
    address: 'Parish Piece, HP15 6SP',
    color: 'bg-green-700',
    borderColor: 'border-green-800',
  },
  {
    ageGroup: 'scouts' as const,
    label: 'Scouts',
    ageRange: '10½-14 years',
    meetings: [
      { day: 'Thursday', time: '7:00 PM - 9:00 PM' }
    ],
    location: 'Scout Hut',
    address: 'Parish Piece, HP15 6SP',
    color: 'bg-teal-600',
    borderColor: 'border-teal-700',
  },
]

// Get 2 upcoming events for each age group
const eventsByAgeGroup = computed(() => {
  const upcomingEvents = eventsStore.events
    .filter(e => new Date(e.end_date) >= currentTime.value && e.status === 'published')
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())

  return {
    beavers: upcomingEvents.filter(e => e.age_group === 'beavers').slice(0, 2),
    cubs: upcomingEvents.filter(e => e.age_group === 'cubs').slice(0, 2),
    scouts: upcomingEvents.filter(e => e.age_group === 'scouts').slice(0, 2),
  }
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'short' })
  const day = date.getDate()
  const month = date.toLocaleDateString('en-GB', { month: 'short' })
  return `${weekday}, ${day} ${month}`
}

const getEventTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    meeting: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    camp: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    trip: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    special: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
    fundraising: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    other: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
  }
  return icons[type] || icons.other
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
</script>

<template>
  <div class="bg-gradient-to-br from-primary-50 to-secondary-50">
    <!-- Hero Section -->
    <div class="container mx-auto px-4 py-16">
      <div class="text-center mb-12">
        <h1 class="text-5xl md:text-6xl font-display font-bold text-primary-900 mb-4">
          1st Holmer Green Cub Scout Group
        </h1>
        <p class="text-xl text-gray-700 mb-8">
          Welcome to our events and information portal
        </p>
        <div class="flex gap-4 justify-center">
          <NuxtLink to="/events">
            <button class="btn-primary">View Events</button>
          </NuxtLink>
          <NuxtLink to="/about">
            <button class="btn-outline">Learn More</button>
          </NuxtLink>
        </div>
      </div>

      <!-- Feature Cards -->
      <div class="grid md:grid-cols-3 gap-6 mt-16">
        <NuxtLink to="/events" class="block">
          <div class="card-hover p-6 h-full">
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-2">Upcoming Events</h3>
            <p class="text-gray-600">
              Stay updated with all Cubs activities, camps, and special events
            </p>
          </div>
        </NuxtLink>

        <NuxtLink to="/announcements" class="block">
          <div class="card-hover p-6 h-full">
            <div class="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-2">Announcements</h3>
            <p class="text-gray-600">
              Important updates and news for Cubs families
            </p>
          </div>
        </NuxtLink>

        <NuxtLink to="/about" class="block">
          <div class="card-hover p-6 h-full">
            <div class="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-2">Resources</h3>
            <p class="text-gray-600">
              Access forms, guides, and important documents
            </p>
          </div>
        </NuxtLink>
      </div>

      <!-- When We Meet Section -->
      <div class="mt-20">
        <h2 class="text-4xl font-display font-bold text-center text-primary-900 mb-12">When We Meet</h2>
        <div class="grid md:grid-cols-3 gap-6">
          <div
            v-for="meeting in meetingInfo"
            :key="meeting.ageGroup"
            class="bg-white rounded-lg shadow-md overflow-hidden border-t-4"
            :class="meeting.borderColor"
          >
            <div class="p-6">
              <!-- Age Group Badge -->
              <div class="mb-4">
                <span
                  :class="[meeting.color, meeting.borderColor]"
                  class="inline-block px-4 py-2 rounded-full text-sm font-semibold text-white border-2"
                >
                  {{ meeting.label }} ({{ meeting.ageRange }})
                </span>
              </div>

              <!-- Meeting Details -->
              <div class="space-y-4">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="font-semibold text-gray-900 mb-1">Meeting Times</p>
                    <div class="space-y-1">
                      <p v-for="(meet, idx) in meeting.meetings" :key="idx" class="text-gray-600 text-sm">
                        {{ meet.day }}s: {{ meet.time }}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p class="font-semibold text-gray-900">{{ meeting.location }}</p>
                    <p class="text-gray-600 text-sm">{{ meeting.address }}</p>
                  </div>
                </div>
              </div>

              <!-- Upcoming Events Preview -->
              <div class="mt-6 pt-6 border-t border-gray-200">
                <h3 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Next Events
                </h3>
                <div v-if="eventsByAgeGroup[meeting.ageGroup].length > 0" class="space-y-2">
                  <NuxtLink
                    v-for="event in eventsByAgeGroup[meeting.ageGroup]"
                    :key="event.id"
                    :to="`/events/${event.id}`"
                    class="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                  >
                    <div class="flex items-center gap-2 mb-1">
                      <svg class="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getEventTypeIcon(event.event_type)" />
                      </svg>
                      <p class="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                        {{ event.title }}
                      </p>
                    </div>
                    <p class="text-xs text-gray-600 ml-5">{{ formatDate(event.start_date) }}</p>
                  </NuxtLink>
                </div>
                <div v-else class="text-sm text-gray-500 italic">
                  No upcoming events
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
