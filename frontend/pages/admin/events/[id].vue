<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useEventsStore, type Event } from '~/stores/events'
import { useRouter, useRoute } from 'vue-router'

definePageMeta({
  layout: 'admin',
  middleware: 'editor',
})

const eventsStore = useEventsStore()
const router = useRouter()
const route = useRoute()

const isNew = computed(() => route.params.id === 'new')
const pageTitle = computed(() => isNew.value ? 'Create Event' : 'Edit Event')

// Form data
const form = ref({
  title: '',
  event_type: 'meeting' as 'meeting' | 'camp' | 'trip' | 'special' | 'other',
  start_date: '',
  start_time: '09:00',
  end_date: '',
  end_time: '17:00',
  location: '',
  description: '',
  cost: undefined as number | undefined,
  what_to_bring: '',
  rsvp_deadline: '',
  organizer_name: '',
  organizer_contact: '',
  status: 'draft' as 'draft' | 'published' | 'cancelled' | 'archived',
  cancellation_reason: '',
  is_recurring: false,
  recurrence_frequency: 'WEEKLY' as 'WEEKLY' | 'DAILY' | 'MONTHLY',
  recurrence_end_date: '',
})

const errors = ref<Record<string, string>>({})
const submitting = ref(false)

// Watch for recurring checkbox changes
watch(() => form.value.is_recurring, (isRecurring) => {
  if (isRecurring && form.value.start_date) {
    // Always set end date to match start date when enabling recurring
    form.value.end_date = form.value.start_date
  }
})

// Watch for start date changes when recurring is enabled
watch(() => form.value.start_date, (newStartDate) => {
  if (form.value.is_recurring && newStartDate) {
    // Auto-update end date to match start date for recurring events
    form.value.end_date = newStartDate
  }
})

// Computed default recurrence end date (2 years from start date)
const defaultRecurrenceEndDate = computed(() => {
  if (!form.value.start_date) return ''
  const startDate = new Date(form.value.start_date)
  const endDate = new Date(startDate)
  endDate.setFullYear(endDate.getFullYear() + 2)
  return endDate.toISOString().split('T')[0]
})

// Parse recurrence rule
const parseRecurrenceRule = (rule: string) => {
  if (!rule) return { frequency: 'WEEKLY', endDate: '' }

  const freqMatch = rule.match(/FREQ=(\w+)/)
  const untilMatch = rule.match(/UNTIL=(\d{8})/)

  const frequency = freqMatch ? freqMatch[1] : 'WEEKLY'
  let endDate = ''

  if (untilMatch) {
    const dateStr = untilMatch[1]
    const year = dateStr.substring(0, 4)
    const month = dateStr.substring(4, 6)
    const day = dateStr.substring(6, 8)
    endDate = `${year}-${month}-${day}`
  }

  return { frequency, endDate }
}

onMounted(async () => {
  if (!isNew.value) {
    const event = await eventsStore.fetchEventById(route.params.id as string)
    if (event) {
      const startDate = new Date(event.start_date)
      const endDate = new Date(event.end_date)

      const recurrence = event.recurrence_rule ? parseRecurrenceRule(event.recurrence_rule) : { frequency: 'WEEKLY', endDate: '' }

      form.value = {
        title: event.title,
        event_type: event.event_type,
        start_date: startDate.toISOString().split('T')[0],
        start_time: startDate.toTimeString().slice(0, 5),
        end_date: endDate.toISOString().split('T')[0],
        end_time: endDate.toTimeString().slice(0, 5),
        location: event.location,
        description: event.description,
        cost: event.cost,
        what_to_bring: event.what_to_bring || '',
        rsvp_deadline: event.rsvp_deadline ? new Date(event.rsvp_deadline).toISOString().split('T')[0] : '',
        organizer_name: event.organizer_name || '',
        organizer_contact: event.organizer_contact || '',
        status: event.status,
        cancellation_reason: event.cancellation_reason || '',
        is_recurring: event.is_recurring || false,
        recurrence_frequency: recurrence.frequency as 'WEEKLY' | 'DAILY' | 'MONTHLY',
        recurrence_end_date: recurrence.endDate,
      }
    } else {
      router.push('/admin/events')
    }
  }
})

const validate = () => {
  errors.value = {}
  let isValid = true

  if (!form.value.title.trim()) {
    errors.value.title = 'Title is required'
    isValid = false
  }

  if (!form.value.description.trim()) {
    errors.value.description = 'Description is required'
    isValid = false
  }

  if (!form.value.start_date) {
    errors.value.start_date = 'Start date is required'
    isValid = false
  }

  if (!form.value.end_date) {
    errors.value.end_date = 'End date is required'
    isValid = false
  }

  if (!form.value.location.trim()) {
    errors.value.location = 'Location is required'
    isValid = false
  }

  if (form.value.cost !== undefined && form.value.cost < 0) {
    errors.value.cost = 'Cost must be positive'
    isValid = false
  }

  // Validate dates
  if (form.value.start_date && form.value.end_date) {
    const startDateTime = new Date(`${form.value.start_date}T${form.value.start_time}`)
    const endDateTime = new Date(`${form.value.end_date}T${form.value.end_time}`)

    if (endDateTime < startDateTime) {
      errors.value.end_date = 'End date must be after start date'
      isValid = false
    }
  }

  // Validate recurrence
  if (form.value.is_recurring) {
    if (!form.value.recurrence_end_date) {
      // Use default if not provided
      form.value.recurrence_end_date = defaultRecurrenceEndDate.value
    }

    const recEndDate = new Date(form.value.recurrence_end_date)
    const startDate = new Date(form.value.start_date)

    if (recEndDate < startDate) {
      errors.value.recurrence_end_date = 'Recurrence end date must be after start date'
      isValid = false
    }
  }

  return isValid
}

// Build recurrence rule in RFC 5545 format
const buildRecurrenceRule = () => {
  if (!form.value.is_recurring) return undefined

  const endDate = form.value.recurrence_end_date || defaultRecurrenceEndDate.value
  const until = endDate.replace(/-/g, '') // Convert YYYY-MM-DD to YYYYMMDD

  return `FREQ=${form.value.recurrence_frequency};UNTIL=${until}`
}

const handleSubmit = async () => {
  if (!validate()) {
    console.log('Validation failed:', errors.value)
    return
  }

  submitting.value = true

  try {
    const startDateTime = new Date(`${form.value.start_date}T${form.value.start_time}`).toISOString()
    const endDateTime = new Date(`${form.value.end_date}T${form.value.end_time}`).toISOString()

    const recurrenceRule = buildRecurrenceRule()

    const eventData = {
      title: form.value.title,
      event_type: form.value.event_type,
      start_date: startDateTime,
      end_date: endDateTime,
      location: form.value.location,
      description: form.value.description,
      cost: form.value.cost,
      what_to_bring: form.value.what_to_bring || undefined,
      rsvp_deadline: form.value.rsvp_deadline ? new Date(form.value.rsvp_deadline).toISOString() : undefined,
      organizer_name: form.value.organizer_name || undefined,
      organizer_contact: form.value.organizer_contact || undefined,
      is_recurring: form.value.is_recurring,
      recurrence_rule: recurrenceRule,
      status: form.value.status,
      cancellation_reason: form.value.cancellation_reason || undefined,
    }

    console.log('Submitting event data:', eventData)

    let success
    if (isNew.value) {
      success = await eventsStore.createEvent(eventData)
    } else {
      success = await eventsStore.updateEvent(route.params.id as string, eventData)
    }

    console.log('Event creation result:', success)

    if (success) {
      router.push('/admin/events')
    } else {
      console.error('Event creation failed - store returned', success)
      errors.value.submit = eventsStore.error || 'Failed to create event'
    }
  } catch (error) {
    console.error('Error in handleSubmit:', error)
    errors.value.submit = 'An unexpected error occurred'
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  router.push('/admin/events')
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-display font-bold text-gray-900">{{ pageTitle }}</h1>
      <p class="text-gray-600 mt-1">{{ isNew ? 'Create a new event' : 'Update event details' }}</p>
    </div>

    <!-- Form -->
    <BaseCard>
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Title -->
        <BaseInput
          v-model="form.title"
          label="Event Title"
          placeholder="e.g., Summer Camp 2025"
          :error="errors.title"
          :required="true"
        />

        <!-- Event Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Event Type <span class="text-red-500">*</span>
          </label>
          <select v-model="form.event_type" class="input">
            <option value="meeting">Meeting</option>
            <option value="camp">Camp</option>
            <option value="trip">Trip</option>
            <option value="special">Special Event</option>
            <option value="other">Other</option>
          </select>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Description <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="form.description"
            rows="4"
            class="input"
            placeholder="Provide details about the event..."
            :class="{ 'border-red-500': errors.description }"
          />
          <p v-if="errors.description" class="mt-1 text-sm text-red-600">
            {{ errors.description }}
          </p>
        </div>

        <!-- Start Date & Time -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BaseInput
            v-model="form.start_date"
            type="date"
            label="Start Date"
            :error="errors.start_date"
            :required="true"
          />
          <BaseInput
            v-model="form.start_time"
            type="time"
            label="Start Time"
            :required="true"
          />
        </div>

        <!-- End Date & Time -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BaseInput
            v-model="form.end_date"
            type="date"
            :label="form.is_recurring ? 'Event Duration - End Date' : 'End Date'"
            :error="errors.end_date"
            :required="true"
            :hint="form.is_recurring ? 'For single occurrence (usually same day)' : undefined"
          />
          <BaseInput
            v-model="form.end_time"
            type="time"
            :label="form.is_recurring ? 'Event Duration - End Time' : 'End Time'"
            :required="true"
          />
        </div>

        <!-- Recurring Event -->
        <div class="border-t border-gray-200 pt-6">
          <div class="flex items-center mb-4">
            <input
              id="is_recurring"
              v-model="form.is_recurring"
              type="checkbox"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label for="is_recurring" class="ml-2 block text-sm font-medium text-gray-700">
              Recurring Event
            </label>
          </div>

          <div v-if="form.is_recurring" class="ml-6 space-y-4 bg-indigo-50 border-2 border-indigo-200 p-4 rounded-lg">
            <div class="mb-4">
              <p class="text-sm text-indigo-900 font-medium mb-2">📅 Recurrence Schedule</p>
              <p class="text-sm text-indigo-700">
                The event times above apply to each occurrence. Here you set how often it repeats and when to stop.
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Frequency -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Repeat Every
                </label>
                <select v-model="form.recurrence_frequency" class="input">
                  <option value="DAILY">Day</option>
                  <option value="WEEKLY">Week (Standard)</option>
                  <option value="MONTHLY">Month</option>
                </select>
                <p class="mt-1 text-sm text-gray-500">How often the event repeats</p>
              </div>

              <!-- Recurrence End Date -->
              <BaseInput
                v-model="form.recurrence_end_date"
                type="date"
                label="Stop Repeating On"
                :error="errors.recurrence_end_date"
                :hint="`Optional (Default: ${defaultRecurrenceEndDate})`"
              />
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div class="flex">
                <svg class="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="text-sm text-blue-800">
                  <p class="font-medium">Summary:</p>
                  <p class="mt-1">
                    This event will repeat
                    {{ form.recurrence_frequency === 'WEEKLY' ? 'every week on the same day' :
                       form.recurrence_frequency === 'DAILY' ? 'every day' :
                       'every month on the same date' }}
                    until {{ form.recurrence_end_date || defaultRecurrenceEndDate }}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Location -->
        <BaseInput
          v-model="form.location"
          label="Location"
          placeholder="e.g., Scout Hall, London"
          :error="errors.location"
          :required="true"
        />

        <!-- Cost & RSVP Deadline Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BaseInput
            v-model.number="form.cost"
            type="number"
            label="Cost (£)"
            placeholder="0"
            :error="errors.cost"
            hint="Leave empty if free"
            step="0.01"
          />

          <BaseInput
            v-model="form.rsvp_deadline"
            type="date"
            label="RSVP Deadline"
            hint="Optional"
          />
        </div>

        <!-- What to Bring -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            What to Bring
          </label>
          <textarea
            v-model="form.what_to_bring"
            rows="3"
            class="input"
            placeholder="List items Cubs should bring..."
          />
          <p class="mt-1 text-sm text-gray-500">Optional</p>
        </div>

        <!-- Organiser Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BaseInput
            v-model="form.organizer_name"
            label="Organiser Name"
            placeholder="e.g., Akela"
            hint="Optional"
          />

          <BaseInput
            v-model="form.organizer_contact"
            label="Organiser Contact"
            placeholder="e.g., akela@example.com"
            hint="Optional"
          />
        </div>

        <!-- Status -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Status <span class="text-red-500">*</span>
          </label>
          <select v-model="form.status" class="input">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <!-- Cancellation Reason (shown when status is cancelled) -->
        <div v-if="form.status === 'cancelled'" class="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <label class="block text-sm font-medium text-red-900 mb-2">
            Cancellation Reason
            <span class="text-xs font-normal text-red-700 ml-2">(Will be displayed to the public)</span>
          </label>
          <textarea
            v-model="form.cancellation_reason"
            rows="3"
            class="input"
            placeholder="Explain why this event has been cancelled..."
          />
          <p class="mt-2 text-sm text-red-700">
            ℹ️ This event will remain visible to the public with a prominent cancellation notice.
          </p>
        </div>

        <!-- Submit Error -->
        <div
          v-if="errors.submit"
          class="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
        >
          {{ errors.submit }}
        </div>

        <!-- Actions -->
        <div class="flex gap-4 pt-4">
          <BaseButton
            type="submit"
            variant="primary"
            :loading="submitting"
          >
            {{ submitting ? 'Saving...' : (isNew ? 'Create Event' : 'Update Event') }}
          </BaseButton>
          <BaseButton
            type="button"
            variant="outline"
            @click="handleCancel"
            :disabled="submitting"
          >
            Cancel
          </BaseButton>
        </div>
      </form>
    </BaseCard>
  </div>
</template>
