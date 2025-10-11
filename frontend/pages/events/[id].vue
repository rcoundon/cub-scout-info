<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useEventsStore } from '~/stores/events'
import { useRoute, useRouter } from 'vue-router'

definePageMeta({
  layout: 'default',
})

const eventsStore = useEventsStore()
const route = useRoute()
const router = useRouter()

const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
  const eventId = route.params.id as string
  const event = await eventsStore.fetchEventById(eventId)

  if (!event || (event.status !== 'published' && event.status !== 'cancelled')) {
    notFound.value = true
  }

  loading.value = false
})

const event = computed(() => eventsStore.currentEvent)

const config = useRuntimeConfig()

const downloadCalendar = () => {
  if (!event.value) return
  const eventId = route.params.id as string
  const exportUrl = `${config.public.apiUrl}/api/events/${eventId}/export.ics`
  window.open(exportUrl, '_blank')
}

const addToGoogleCalendar = () => {
  if (!event.value) return

  // Format dates for Google Calendar (YYYYMMDDTHHmmssZ format in UTC)
  const formatGoogleDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const startDate = formatGoogleDate(event.value.start_date)
  const endDate = formatGoogleDate(event.value.end_date)

  // Build description with extra details
  let description = event.value.description
  if (event.value.cost !== undefined && event.value.cost > 0) {
    description += `\n\nCost: £${event.value.cost}`
  }
  if (event.value.what_to_bring) {
    description += `\n\nWhat to bring: ${event.value.what_to_bring}`
  }
  if (event.value.organizer_name) {
    description += `\n\nOrganiser: ${event.value.organizer_name}`
    if (event.value.organizer_contact) {
      description += ` (${event.value.organizer_contact})`
    }
  }

  // Build Google Calendar URL
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.value.title,
    dates: `${startDate}/${endDate}`,
    details: description,
    location: event.value.location,
  })

  // Add recurrence rule if applicable
  if (event.value.is_recurring && event.value.recurrence_rule) {
    params.append('recur', event.value.recurrence_rule)
  }

  const googleCalUrl = `https://calendar.google.com/calendar/render?${params.toString()}`
  window.open(googleCalUrl, '_blank')
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatDateTime = (dateString: string) => {
  return `${formatDate(dateString)} at ${formatTime(dateString)}`
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

const isUpcoming = computed(() => {
  if (!event.value) return false
  return new Date(event.value.end_date) >= new Date()
})

const isPastDeadline = computed(() => {
  if (!event.value?.rsvp_deadline) return false
  return new Date(event.value.rsvp_deadline) < new Date()
})

const goBack = () => {
  router.push('/events')
}
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      <p class="text-gray-600 mt-4">Loading event...</p>
    </div>

    <!-- Not Found State -->
    <div v-else-if="notFound" class="text-center py-12">
      <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
      <p class="text-gray-600 mb-6">The event you're looking for doesn't exist or is no longer available.</p>
      <BaseButton @click="goBack" variant="primary">
        Back to Events
      </BaseButton>
    </div>

    <!-- Event Detail -->
    <div v-else-if="event">
      <!-- Back Button -->
      <div class="mb-6">
        <button @click="goBack" class="flex items-center gap-2 text-primary-600 hover:text-primary-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Events
        </button>
      </div>

      <!-- Cancellation Notice -->
      <BaseCard v-if="event.status === 'cancelled'" class="mb-8 bg-red-50 border-2 border-red-300">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-bold text-red-900 mb-2">⚠️ This Event Has Been Cancelled</h3>
            <p v-if="event.cancellation_reason" class="text-red-800">
              <strong>Reason:</strong> {{ event.cancellation_reason }}
            </p>
            <p v-else class="text-red-800">
              This event will not be taking place as scheduled. Please contact the organiser for more information.
            </p>
          </div>
        </div>
      </BaseCard>

      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-start gap-4 mb-4">
          <span :class="getEventTypeColor(event.event_type)" class="px-4 py-2 rounded-full text-sm font-medium">
            {{ getEventTypeLabel(event.event_type) }}
          </span>
          <span v-if="event.status === 'cancelled'" class="px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800 font-bold">
            ❌ Cancelled
          </span>
          <span v-else-if="!isUpcoming" class="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            Past Event
          </span>
        </div>
        <h1 class="text-4xl font-display font-bold text-gray-900 mb-4">{{ event.title }}</h1>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Description -->
          <BaseCard>
            <h2 class="text-2xl font-semibold text-gray-900 mb-4">About This Event</h2>
            <div class="prose prose-gray max-w-none">
              <p class="text-gray-700 whitespace-pre-wrap">{{ event.description }}</p>
            </div>
          </BaseCard>

          <!-- What to Bring -->
          <BaseCard v-if="event.what_to_bring">
            <h2 class="text-2xl font-semibold text-gray-900 mb-4">What to Bring</h2>
            <div class="prose prose-gray max-w-none">
              <p class="text-gray-700 whitespace-pre-wrap">{{ event.what_to_bring }}</p>
            </div>
          </BaseCard>

          <!-- Organiser Info -->
          <BaseCard v-if="event.organizer_name || event.organizer_contact">
            <h2 class="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div class="space-y-2">
              <div v-if="event.organizer_name" class="flex items-center gap-2 text-gray-700">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span><strong>Organiser:</strong> {{ event.organizer_name }}</span>
              </div>
              <div v-if="event.organizer_contact" class="flex items-center gap-2 text-gray-700">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span><strong>Contact:</strong> {{ event.organizer_contact }}</span>
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1">
          <div class="sticky top-6 space-y-6">
            <!-- Event Details Card -->
            <BaseCard>
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
              <div class="space-y-4">
                <!-- Start Date & Time -->
                <div>
                  <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p class="text-sm text-gray-500">Starts</p>
                      <p class="font-medium text-gray-900">{{ formatDate(event.start_date) }}</p>
                      <p class="text-sm text-gray-600">{{ formatTime(event.start_date) }}</p>
                    </div>
                  </div>
                </div>

                <!-- End Date & Time -->
                <div>
                  <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p class="text-sm text-gray-500">Ends</p>
                      <p class="font-medium text-gray-900">{{ formatDate(event.end_date) }}</p>
                      <p class="text-sm text-gray-600">{{ formatTime(event.end_date) }}</p>
                    </div>
                  </div>
                </div>

                <!-- Location -->
                <div>
                  <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p class="text-sm text-gray-500">Location</p>
                      <p class="font-medium text-gray-900">{{ event.location }}</p>
                    </div>
                  </div>
                </div>

                <!-- Cost -->
                <div>
                  <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p class="text-sm text-gray-500">Cost</p>
                      <p class="font-medium text-gray-900">
                        {{ event.cost !== undefined ? `£${event.cost.toFixed(2)}` : 'Free' }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- RSVP Deadline -->
                <div v-if="event.rsvp_deadline">
                  <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p class="text-sm text-gray-500">RSVP By</p>
                      <p class="font-medium" :class="isPastDeadline ? 'text-red-600' : 'text-gray-900'">
                        {{ formatDate(event.rsvp_deadline) }}
                      </p>
                      <p v-if="isPastDeadline" class="text-xs text-red-600 mt-1">
                        Deadline passed
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </BaseCard>

            <!-- Add to Calendar Buttons -->
            <BaseCard v-if="isUpcoming && event.status !== 'cancelled'">
              <h4 class="font-semibold text-gray-900 mb-2">Add This Event</h4>
              <p class="text-xs text-gray-600 mb-3">
                Add this single event to your calendar
              </p>

              <!-- Google Calendar Button -->
              <button
                @click="addToGoogleCalendar"
                class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium mb-3"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="#4285F4"/>
                  <path d="M20 10H10v4h10v-4z" fill="#34A853"/>
                  <path d="M20 14H4v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6z" fill="#FBBC04"/>
                  <path d="M10 10h10V5a2 2 0 0 0-2-2h-6v7z" fill="#EA4335"/>
                </svg>
                Google Calendar
              </button>

              <!-- Generic iCal Download Button -->
              <button
                @click="downloadCalendar"
                class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Other Calendars (.ics)
              </button>
              <p class="text-xs text-gray-500 text-center mt-3">
                💡 Want all events to auto-update? <NuxtLink to="/events" class="text-primary-600 hover:text-primary-700 underline">Subscribe to the calendar feed</NuxtLink>
              </p>
            </BaseCard>

            <!-- RSVP Notice -->
            <BaseCard v-if="isUpcoming && event.status !== 'cancelled'" class="bg-primary-50 border-primary-200">
              <div class="text-center">
                <svg class="w-12 h-12 mx-auto text-primary-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 class="font-semibold text-gray-900 mb-2">Interested in Attending?</h4>
                <p class="text-sm text-gray-700">
                  Please contact the organiser to confirm your attendance.
                </p>
              </div>
            </BaseCard>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
