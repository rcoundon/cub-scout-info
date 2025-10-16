<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Event } from '~/stores/events'

interface Props {
  events: Event[]
}

const props = defineProps<Props>()

const currentDate = ref(new Date())

// Calendar logic
const currentMonth = computed(() => currentDate.value.getMonth())
const currentYear = computed(() => currentDate.value.getFullYear())

const monthName = computed(() => {
  return currentDate.value.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
})

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
})

const firstDayOfMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 1).getDay()
})

const calendarDays = computed(() => {
  const days = []

  // Add empty cells for days before month starts (0 = Sunday, 1 = Monday, etc.)
  // Adjust to make Monday first day (subtract 1, handle Sunday as 6)
  const firstDay = firstDayOfMonth.value === 0 ? 6 : firstDayOfMonth.value - 1
  for (let i = 0; i < firstDay; i++) {
    days.push({ day: null, events: [] })
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth.value; day++) {
    const date = new Date(currentYear.value, currentMonth.value, day)
    const dayEvents = getEventsForDate(date)
    days.push({ day, date, events: dayEvents })
  }

  return days
})

const getEventsForDate = (date: Date) => {
  return props.events.filter(event => {
    const eventStart = new Date(event.start_date)
    const eventEnd = new Date(event.end_date)

    // Check if date falls within event date range
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const startOnly = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate())
    const endOnly = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate())

    return dateOnly >= startOnly && dateOnly <= endOnly
  })
}

const isToday = (day: number) => {
  const today = new Date()
  return (
    day === today.getDate() &&
    currentMonth.value === today.getMonth() &&
    currentYear.value === today.getFullYear()
  )
}

const previousMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
}

const goToToday = () => {
  currentDate.value = new Date()
}

const getAgeGroupColor = (ageGroup: string) => {
  const colors: Record<string, string> = {
    beavers: 'bg-primary-700',
    cubs: 'bg-green-700',
    scouts: 'bg-primary-800',
  }
  return colors[ageGroup] || colors.cubs
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

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <!-- Calendar Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
      <h2 class="text-xl font-semibold text-gray-900">{{ monthName }}</h2>
      <div class="flex items-center gap-2">
        <button
          @click="previousMonth"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          @click="goToToday"
          class="px-3 py-1 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        >
          Today
        </button>
        <button
          @click="nextMonth"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Next month"
        >
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Weekday Headers -->
    <div class="grid grid-cols-7 border-b border-gray-200">
      <div
        v-for="day in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']"
        :key="day"
        class="px-2 py-3 text-center text-sm font-semibold text-gray-600"
      >
        {{ day }}
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="grid grid-cols-7">
      <div
        v-for="(cell, index) in calendarDays"
        :key="index"
        class="min-h-[120px] border-b border-r border-gray-200 p-2"
        :class="{
          'bg-gray-50': !cell.day,
          'bg-blue-50': cell.day && isToday(cell.day),
        }"
      >
        <div v-if="cell.day" class="h-full flex flex-col">
          <!-- Day Number -->
          <div class="flex items-center justify-between mb-2">
            <span
              class="text-sm font-medium"
              :class="{
                'bg-primary-600 text-white rounded-full w-7 h-7 flex items-center justify-center': isToday(cell.day),
                'text-gray-900': !isToday(cell.day),
              }"
            >
              {{ cell.day }}
            </span>
          </div>

          <!-- Events -->
          <div class="flex-1 space-y-1 overflow-y-auto">
            <NuxtLink
              v-for="event in cell.events.slice(0, 3)"
              :key="event.id"
              :to="`/events/${event.id}`"
              class="block"
            >
              <div
                :class="getAgeGroupColor(event.age_group)"
                class="text-white text-xs px-2 py-1 rounded hover:opacity-80 transition-opacity"
                :title="`${event.title} - ${formatTime(event.start_date)} - ${formatTime(event.end_date)}`"
              >
                <div class="flex items-center gap-1">
                  <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getEventTypeIcon(event.event_type)" />
                  </svg>
                  <div class="font-medium truncate flex-1">{{ event.title }}</div>
                </div>
                <div class="text-[10px] opacity-90 mt-0.5 ml-4">{{ formatTime(event.start_date) }} - {{ formatTime(event.end_date) }}</div>
              </div>
            </NuxtLink>
            <div
              v-if="cell.events.length > 3"
              class="text-xs text-gray-600 px-2"
            >
              +{{ cell.events.length - 3 }} more
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
      <div class="grid md:grid-cols-2 gap-6">
        <!-- Age Groups -->
        <div>
          <span class="text-gray-600 font-medium text-sm block mb-2">Age Groups:</span>
          <div class="flex flex-wrap items-center gap-3 text-sm">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 bg-primary-700 rounded"></span>
              <span class="text-gray-700">Beavers</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 bg-green-700 rounded"></span>
              <span class="text-gray-700">Cubs</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 bg-primary-800 rounded"></span>
              <span class="text-gray-700">Scouts</span>
            </div>
          </div>
        </div>

        <!-- Event Type Icons -->
        <div>
          <span class="text-gray-600 font-medium text-sm block mb-2">Event Type Icons:</span>
          <div class="flex flex-wrap items-center gap-3 text-sm">
            <div class="flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getEventTypeIcon('meeting')" />
              </svg>
              <span class="text-gray-700">Meeting</span>
            </div>
            <div class="flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getEventTypeIcon('camp')" />
              </svg>
              <span class="text-gray-700">Camp</span>
            </div>
            <div class="flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getEventTypeIcon('trip')" />
              </svg>
              <span class="text-gray-700">Trip</span>
            </div>
            <div class="flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getEventTypeIcon('special')" />
              </svg>
              <span class="text-gray-700">Special</span>
            </div>
            <div class="flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getEventTypeIcon('fundraising')" />
              </svg>
              <span class="text-gray-700">Fundraising</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
