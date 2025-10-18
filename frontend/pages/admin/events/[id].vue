<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useEventsStore, type Event } from '~/stores/events'
import { useExternalLinksStore, type ExternalLink } from '~/stores/external-links'
import { useRouter, useRoute } from 'vue-router'

definePageMeta({
  layout: 'admin',
  middleware: 'editor',
})

const eventsStore = useEventsStore()
const linksStore = useExternalLinksStore()
const router = useRouter()
const route = useRoute()

const isNew = computed(() => route.params.id === 'new')
const pageTitle = computed(() => isNew.value ? 'Create Event' : 'Edit Event')

// Form data
const form = ref({
  title: '',
  event_type: 'meeting' as 'meeting' | 'camp' | 'trip' | 'special' | 'fundraising' | 'other',
  age_group: 'cubs' as 'beavers' | 'cubs' | 'scouts',
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

const currentEvent = ref<Event | null>(null)
const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const attachments = ref<any[]>([])
const externalLinks = ref<ExternalLink[]>([])

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Watch for recurring checkbox changes
watch(() => form.value.is_recurring, (isRecurring) => {
  if (isRecurring && form.value.start_date) {
    // Always set end date to match start date when enabling recurring
    form.value.end_date = form.value.start_date
  }
  // Clear any existing errors when switching modes
  if (errors.value.end_time) {
    delete errors.value.end_time
  }
  if (errors.value.end_date) {
    delete errors.value.end_date
  }
})

// Watch for start date changes
watch(() => form.value.start_date, (newStartDate, oldStartDate) => {
  if (!newStartDate) return

  if (form.value.is_recurring) {
    // Auto-update end date to match start date for recurring events
    form.value.end_date = newStartDate
  } else {
    // For non-recurring events, default end date to start date
    // Only auto-update if:
    // 1. End date is empty, OR
    // 2. End date was equal to old start date (user hasn't customized it), OR
    // 3. End date is now before the new start date (invalid)
    if (!form.value.end_date ||
        form.value.end_date === oldStartDate ||
        form.value.end_date < newStartDate) {
      form.value.end_date = newStartDate
    }
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
      currentEvent.value = event
      const startDate = new Date(event.start_date)
      const endDate = new Date(event.end_date)

      const recurrence = event.recurrence_rule ? parseRecurrenceRule(event.recurrence_rule) : { frequency: 'WEEKLY', endDate: '' }

      form.value = {
        title: event.title,
        event_type: event.event_type,
        age_group: event.age_group,
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

      // Load attachments
      try {
        const config = useRuntimeConfig()
        const response = await $fetch<{ attachments: any[] }>(
          `${config.public.apiUrl}/api/events/${route.params.id}/attachments`
        )
        attachments.value = response.attachments
      } catch (error) {
        console.error('Failed to load attachments:', error)
      }

      // Load external links
      try {
        const links = await linksStore.fetchEventExternalLinks(route.params.id as string)
        externalLinks.value = links
      } catch (error) {
        console.error('Failed to load external links:', error)
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

  // Validate dates and times
  if (form.value.start_date && form.value.end_date) {
    const startDateTime = new Date(`${form.value.start_date}T${form.value.start_time}`)
    const endDateTime = new Date(`${form.value.end_date}T${form.value.end_time}`)

    if (endDateTime <= startDateTime) {
      if (form.value.is_recurring) {
        errors.value.end_time = 'End time must be after start time'
      } else {
        errors.value.end_date = 'End date/time must be after start date/time'
      }
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
  const until = endDate?.replace(/-/g, '') // Convert YYYY-MM-DD to YYYYMMDD

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
      age_group: form.value.age_group,
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

    if (success) {
      // Save external links after event is saved
      const eventId = isNew.value ? eventsStore.currentEvent?.id : route.params.id as string
      if (eventId && externalLinks.value.length > 0) {
        try {
          // Delete existing links
          const existingLinks = await linksStore.fetchEventExternalLinks(eventId)
          for (const link of existingLinks) {
            if (link.id) {
              await linksStore.deleteExternalLink(link.id)
            }
          }

          // Create new links
          for (const [index, link] of externalLinks.value.entries()) {
            await linksStore.createExternalLink({
              parent_type: 'event',
              parent_id: eventId,
              url: link.url,
              label: link.label,
              display_order: index,
              is_active: true,
            })
          }
        } catch (error) {
          console.error('Failed to save external links:', error)
        }
      }

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

    <!-- Metadata (for existing events) -->
    <BaseCard v-if="!isNew && currentEvent" class="mb-6 bg-gray-50">
      <h3 class="text-sm font-medium text-gray-700 mb-3">Event Information</h3>
      <div class="flex flex-wrap gap-6 text-sm">
        <div class="flex items-center gap-2 text-gray-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Created by <strong>{{ currentEvent.creator_name || 'Unknown' }}</strong></span>
        </div>

        <div class="flex items-center gap-2 text-gray-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{{ formatDateTime(currentEvent.created_at) }}</span>
        </div>

        <div v-if="currentEvent.updated_at && currentEvent.updated_at !== currentEvent.created_at" class="flex items-center gap-2 text-gray-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Last updated {{ formatDateTime(currentEvent.updated_at) }}</span>
        </div>
      </div>
    </BaseCard>

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

        <!-- Event Type & Age Group Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <option value="fundraising">Fundraising</option>
              <option value="other">Other</option>
            </select>
          </div>

          <!-- Age Group -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Age Group <span class="text-red-500">*</span>
            </label>
            <select v-model="form.age_group" class="input">
              <option value="beavers">Beaver Colony (6-8 years)</option>
              <option value="cubs">Cub Pack (8-10½ years)</option>
              <option value="scouts">Scout Troop (10½-14 years)</option>
            </select>
          </div>
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

        <!-- Non-recurring: Start Date & Time -->
        <div v-if="!form.is_recurring" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BaseDatePicker
            v-model="form.start_date"
            label="Start Date"
            :error="errors.start_date"
            :required="true"
            :allow-past-dates="!isNew"
          />
          <BaseTimePicker
            v-model="form.start_time"
            label="Start Time"
            :required="true"
          />
        </div>

        <!-- Non-recurring: End Date & Time -->
        <div v-if="!form.is_recurring" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BaseDatePicker
            v-model="form.end_date"
            label="End Date"
            :error="errors.end_date"
            :required="true"
            :min-date="form.start_date ? new Date(form.start_date) : undefined"
          />
          <BaseTimePicker
            v-model="form.end_time"
            label="End Time"
            :required="true"
          />
        </div>

        <!-- Recurring: Start Date and Times aligned -->
        <div v-if="form.is_recurring" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BaseDatePicker
            v-model="form.start_date"
            label="Start Date"
            :error="errors.start_date"
            :required="true"
            :allow-past-dates="!isNew"
          />
          <div class="space-y-6">
            <BaseTimePicker
              v-model="form.start_time"
              label="Start Time"
              :required="true"
            />
            <BaseTimePicker
              v-model="form.end_time"
              label="End Time"
              :required="true"
              :error="errors.end_time"
              :min-time="form.start_time"
              hint="Must be after start time"
            />
          </div>
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
                The start date and times above define when each occurrence happens and how long it lasts. Below you set how often it repeats and when to stop creating occurrences.
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
              <BaseDatePicker
                v-model="form.recurrence_end_date"
                label="Stop Repeating On"
                :error="errors.recurrence_end_date"
                :min-date="form.start_date ? new Date(form.start_date) : undefined"
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

          <BaseDatePicker
            v-model="form.rsvp_deadline"
            label="RSVP Deadline"
            :max-date="form.start_date ? new Date(form.start_date) : undefined"
            hint="Optional - must be before event starts"
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

        <!-- File Attachments (only for existing events) -->
        <div v-if="!isNew" class="border-t border-gray-200 pt-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">File Attachments</h3>
          <p class="text-sm text-gray-600 mb-4">Upload documents, forms, or images related to this event.</p>
          <FileUpload
            v-model="attachments"
            parent-type="events"
            :parent-id="route.params.id as string"
          />
        </div>

        <!-- External Links -->
        <div class="border-t border-gray-200 pt-6">
          <ExternalLinkManager
            v-model="externalLinks"
            parent-type="event"
            :parent-id="isNew ? undefined : (route.params.id as string)"
          />
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
