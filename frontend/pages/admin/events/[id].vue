<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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
})

const errors = ref<Record<string, string>>({})
const submitting = ref(false)

onMounted(async () => {
  if (!isNew.value) {
    const event = await eventsStore.fetchEventById(route.params.id as string)
    if (event) {
      const startDate = new Date(event.start_date)
      const endDate = new Date(event.end_date)

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

  return isValid
}

const handleSubmit = async () => {
  if (!validate()) return

  submitting.value = true

  try {
    const startDateTime = new Date(`${form.value.start_date}T${form.value.start_time}`).toISOString()
    const endDateTime = new Date(`${form.value.end_date}T${form.value.end_time}`).toISOString()

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
      is_recurring: false,
      status: form.value.status,
    }

    let success
    if (isNew.value) {
      success = await eventsStore.createEvent(eventData)
    } else {
      success = await eventsStore.updateEvent(route.params.id as string, eventData)
    }

    if (success) {
      router.push('/admin/events')
    }
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
            label="End Date"
            :error="errors.end_date"
            :required="true"
          />
          <BaseInput
            v-model="form.end_time"
            type="time"
            label="End Time"
            :required="true"
          />
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

        <!-- Organizer Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BaseInput
            v-model="form.organizer_name"
            label="Organizer Name"
            placeholder="e.g., Akela"
            hint="Optional"
          />

          <BaseInput
            v-model="form.organizer_contact"
            label="Organizer Contact"
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
