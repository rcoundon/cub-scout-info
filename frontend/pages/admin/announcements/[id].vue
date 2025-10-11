<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAnnouncementsStore } from '~/stores/announcements'
import { useRouter, useRoute } from 'vue-router'

definePageMeta({
  layout: 'admin',
  middleware: 'editor',
})

const announcementsStore = useAnnouncementsStore()
const router = useRouter()
const route = useRoute()

const isNew = computed(() => route.params.id === 'new')
const pageTitle = computed(() => isNew.value ? 'Create Announcement' : 'Edit Announcement')

// Form data
const form = ref({
  title: '',
  content: '',
  priority: 'medium' as 'low' | 'medium' | 'high',
  category: 'general' as 'general' | 'event' | 'fundraising' | 'urgent' | 'achievement' | undefined,
  status: 'draft' as 'draft' | 'published' | 'expired',
  expires_at: '',
})

const errors = ref<Record<string, string>>({})
const submitting = ref(false)

onMounted(async () => {
  if (!isNew.value) {
    const announcement = await announcementsStore.fetchAnnouncementById(route.params.id as string)
    if (announcement) {
      form.value = {
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        category: announcement.category || 'general',
        status: announcement.status,
        expires_at: announcement.expires_at ? new Date(announcement.expires_at).toISOString().slice(0, 16) : '',
      }
    } else {
      router.push('/admin/announcements')
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

  if (!form.value.content.trim()) {
    errors.value.content = 'Content is required'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validate()) return

  submitting.value = true

  try {
    const submitData = {
      title: form.value.title,
      content: form.value.content,
      priority: form.value.priority,
      category: form.value.category,
      status: form.value.status,
      expires_at: form.value.expires_at ? new Date(form.value.expires_at).toISOString() : undefined,
    }

    let success
    if (isNew.value) {
      success = await announcementsStore.createAnnouncement(submitData)
    } else {
      success = await announcementsStore.updateAnnouncement(route.params.id as string, submitData)
    }

    if (success) {
      router.push('/admin/announcements')
    }
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  router.push('/admin/announcements')
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-display font-bold text-gray-900">{{ pageTitle }}</h1>
      <p class="text-gray-600 mt-1">{{ isNew ? 'Create a new announcement' : 'Update announcement details' }}</p>
    </div>

    <!-- Form -->
    <BaseCard>
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Title -->
        <BaseInput
          v-model="form.title"
          label="Announcement Title"
          placeholder="e.g., Upcoming Camp Reminder"
          :error="errors.title"
          :required="true"
        />

        <!-- Content -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Content <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="form.content"
            rows="6"
            class="input"
            placeholder="Enter the announcement content..."
            :class="{ 'border-red-500': errors.content }"
          />
          <p v-if="errors.content" class="mt-1 text-sm text-red-600">
            {{ errors.content }}
          </p>
        </div>

        <!-- Priority, Category & Status Row -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Priority <span class="text-red-500">*</span>
            </label>
            <select v-model="form.priority" class="input">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <p class="mt-1 text-sm text-gray-500">
              High priority announcements appear at the top
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select v-model="form.category" class="input">
              <option value="general">General</option>
              <option value="event">Event</option>
              <option value="fundraising">Fundraising</option>
              <option value="urgent">Urgent</option>
              <option value="achievement">Achievement</option>
            </select>
            <p class="mt-1 text-sm text-gray-500">
              Helps organize announcements
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Status <span class="text-red-500">*</span>
            </label>
            <select v-model="form.status" class="input">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        <!-- Expiry Date & Time -->
        <BaseInput
          v-model="form.expires_at"
          type="datetime-local"
          label="Expiry Date & Time"
          hint="Leave empty if announcement doesn't expire"
        />

        <!-- Actions -->
        <div class="flex gap-4 pt-4">
          <BaseButton
            type="submit"
            variant="primary"
            :loading="submitting"
          >
            {{ submitting ? 'Saving...' : (isNew ? 'Create Announcement' : 'Update Announcement') }}
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
