<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import VueCal from 'vue-cal'
import 'vue-cal/dist/vuecal.css'
import type { Event } from '~/stores/events'

interface Props {
  events: Event[]
}

const props = defineProps<Props>()
const route = useRoute()

// Transform events into VueCal format
const calendarEvents = computed(() => {
  return props.events.map(event => ({
    start: new Date(event.start_date),
    end: new Date(event.end_date),
    title: event.title,
    content: event.description,
    class: `event-${event.age_group}`,
    event_type: event.event_type,
    age_group: event.age_group,
    id: event.id,
  }))
})

const getAgeGroupColor = (ageGroup: string) => {
  const colors: Record<string, string> = {
    beavers: '#6366f1', // primary-500
    cubs: '#15803d', // green-700
    scouts: '#0d9488', // teal-600
  }
  return colors[ageGroup] || colors.cubs
}

const getEventTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    meeting: '👥',
    camp: '🏕️',
    trip: '🚌',
    special: '⭐',
    fundraising: '💰',
    other: '📅',
  }
  return icons[type] || icons.other
}

// Handle event click
const onEventClick = (event: any) => {
  // Navigate to event detail page, preserving query parameters
  navigateTo({
    path: `/events/${event.id}`,
    query: { ...route.query },
  })
}

// Custom event rendering
const customEventContent = (event: any) => {
  const icon = getEventTypeIcon(event.event_type)
  return `
    <div class="vuecal-event-content">
      <span class="event-icon">${icon}</span>
      <span class="event-title">${event.title}</span>
    </div>
  `
}
</script>

<template>
  <div class="events-calendar-vuecal">
    <VueCal
      :events="calendarEvents"
      :time="false"
      :disable-views="['years', 'year']"
      active-view="month"
      :on-event-click="onEventClick"
      events-on-month-view="short"
      :snap-to-time="15"
      hide-view-selector
      class="vuecal--rounded"
      :twelve-hour="true"
      style="height: 600px"
    >
      <template #event="{ event }">
        <div class="custom-event" :style="{ backgroundColor: getAgeGroupColor(event.age_group) }">
          <span class="event-icon">{{ getEventTypeIcon(event.event_type) }}</span>
          <span class="event-title">{{ event.title }}</span>
        </div>
      </template>
    </VueCal>

    <!-- Legend -->
    <div class="calendar-legend px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
      <div class="grid md:grid-cols-2 gap-6">
        <!-- Age Groups -->
        <div>
          <span class="text-gray-600 font-medium text-sm block mb-2">Age Groups:</span>
          <div class="flex flex-wrap items-center gap-3 text-sm">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded" :style="{ backgroundColor: getAgeGroupColor('beavers') }"></span>
              <span class="text-gray-700">Beavers</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded" :style="{ backgroundColor: getAgeGroupColor('cubs') }"></span>
              <span class="text-gray-700">Cubs</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded" :style="{ backgroundColor: getAgeGroupColor('scouts') }"></span>
              <span class="text-gray-700">Scouts</span>
            </div>
          </div>
        </div>

        <!-- Event Type Icons -->
        <div>
          <span class="text-gray-600 font-medium text-sm block mb-2">Event Types:</span>
          <div class="flex flex-wrap items-center gap-3 text-sm">
            <div class="flex items-center gap-1.5">
              <span>{{ getEventTypeIcon('meeting') }}</span>
              <span class="text-gray-700">Meeting</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span>{{ getEventTypeIcon('camp') }}</span>
              <span class="text-gray-700">Camp</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span>{{ getEventTypeIcon('trip') }}</span>
              <span class="text-gray-700">Trip</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span>{{ getEventTypeIcon('special') }}</span>
              <span class="text-gray-700">Special</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span>{{ getEventTypeIcon('fundraising') }}</span>
              <span class="text-gray-700">Fundraising</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span>{{ getEventTypeIcon('other') }}</span>
              <span class="text-gray-700">Other</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.events-calendar-vuecal {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden;
}

.vuecal--rounded {
  @apply rounded-t-lg;
}

:deep(.vuecal__event) {
  @apply cursor-pointer transition-opacity;
}

:deep(.vuecal__event:hover) {
  @apply opacity-80;
}

.custom-event {
  @apply text-white text-xs px-2 py-1 rounded flex items-center gap-1 h-full;
}

.event-icon {
  @apply flex-shrink-0;
}

.event-title {
  @apply font-medium truncate flex-1;
}

/* Today highlight */
:deep(.vuecal__cell--today) {
  @apply bg-blue-50;
}

:deep(.vuecal__cell--today .vuecal__cell-date) {
  @apply bg-primary-600 text-white rounded-full w-7 h-7 flex items-center justify-center;
}

/* Header styling */
:deep(.vuecal__title) {
  @apply text-xl font-semibold text-gray-900;
}

:deep(.vuecal__arrow) {
  @apply text-gray-600 hover:bg-gray-100 rounded-lg transition-colors;
}

/* Weekday headers */
:deep(.vuecal__heading) {
  @apply text-sm font-semibold text-gray-600 bg-white border-b border-gray-200;
}

/* Cell styling */
:deep(.vuecal__cell) {
  @apply border-gray-200;
}

/* Event styling based on age group */
:deep(.vuecal__event.event-beavers) {
  background-color: #6366f1 !important;
}

:deep(.vuecal__event.event-cubs) {
  background-color: #15803d !important;
}

:deep(.vuecal__event.event-scouts) {
  background-color: #0d9488 !important;
}
</style>
