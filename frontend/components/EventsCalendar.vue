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

const getEventTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    meeting: 'bg-blue-500',
    camp: 'bg-green-500',
    trip: 'bg-purple-500',
    special: 'bg-yellow-500',
    other: 'bg-gray-500',
  }
  return colors[type] || colors.other
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
                :class="getEventTypeColor(event.event_type)"
                class="text-white text-xs px-2 py-1 rounded truncate hover:opacity-80 transition-opacity"
                :title="event.title"
              >
                {{ event.title }}
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
      <div class="flex flex-wrap items-center gap-4 text-sm">
        <span class="text-gray-600 font-medium">Event Types:</span>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 bg-blue-500 rounded"></span>
          <span class="text-gray-700">Meeting</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 bg-green-500 rounded"></span>
          <span class="text-gray-700">Camp</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 bg-purple-500 rounded"></span>
          <span class="text-gray-700">Trip</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 bg-yellow-500 rounded"></span>
          <span class="text-gray-700">Special</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 bg-gray-500 rounded"></span>
          <span class="text-gray-700">Other</span>
        </div>
      </div>
    </div>
  </div>
</template>
