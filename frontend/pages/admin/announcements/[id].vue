<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAnnouncementsStore } from '~/stores/announcements'
import { useExternalLinksStore, type ExternalLink } from '~/stores/external-links'
import { useRouter, useRoute } from 'vue-router'

definePageMeta({
  layout: 'admin',
  middleware: 'editor',
})

const announcementsStore = useAnnouncementsStore()
const linksStore = useExternalLinksStore()
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

const currentAnnouncement = ref<any>(null)
const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const attachments = ref<any[]>([])
const externalLinks = ref<ExternalLink[]>([])

onMounted(async () => {
  if (!isNew.value) {
    const announcement = await announcementsStore.fetchAnnouncementById(route.params.id as string)
    if (announcement) {
      currentAnnouncement.value = announcement
      form.value = {
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        category: announcement.category || 'general',
        status: announcement.status,
        expires_at: announcement.expires_at ? new Date(announcement.expires_at).toISOString().slice(0, 16) : '',
      }

      // Load attachments
      try {
        const config = useRuntimeConfig()
        const response = await $fetch<{ attachments: any[] }>(
          `${config.public.apiUrl}/api/announcements/${route.params.id}/attachments`
        )
        attachments.value = response.attachments
      } catch (error) {
        console.error('Failed to load attachments:', error)
      }

      // Load external links
      try {
        const links = await linksStore.fetchAnnouncementExternalLinks(route.params.id as string)
        externalLinks.value = links
      } catch (error) {
        console.error('Failed to load external links:', error)
      }
    } else {
      router.push('/admin/announcements')
    }
  }
})

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

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
      // Save external links after announcement is saved
      const announcementId = isNew.value ? announcementsStore.currentAnnouncement?.id : route.params.id as string
      if (announcementId && externalLinks.value.length > 0) {
        try {
          // Delete existing links
          const existingLinks = await linksStore.fetchAnnouncementExternalLinks(announcementId)
          for (const link of existingLinks) {
            if (link.id) {
              await linksStore.deleteExternalLink(link.id)
            }
          }

          // Create new links
          for (const [index, link] of externalLinks.value.entries()) {
            await linksStore.createExternalLink({
              parent_type: 'announcement',
              parent_id: announcementId,
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

    <!-- Metadata (for existing announcements) -->
    <BaseCard v-if="!isNew && currentAnnouncement" class="mb-6 bg-gray-50">
      <h3 class="text-sm font-medium text-gray-700 mb-3">Announcement Information</h3>
      <div class="flex flex-wrap gap-6 text-sm">
        <div class="flex items-center gap-2 text-gray-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Created by <strong>{{ currentAnnouncement.creator_name || 'Unknown' }}</strong></span>
        </div>

        <div class="flex items-center gap-2 text-gray-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{{ formatDateTime(currentAnnouncement.created_at) }}</span>
        </div>

        <div v-if="currentAnnouncement.updated_at && currentAnnouncement.updated_at !== currentAnnouncement.created_at" class="flex items-center gap-2 text-gray-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Last updated {{ formatDateTime(currentAnnouncement.updated_at) }}</span>
        </div>
      </div>
    </BaseCard>

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
              Helps organise announcements
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

        <!-- File Attachments (only for existing announcements) -->
        <div v-if="!isNew" class="border-t border-gray-200 pt-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">File Attachments</h3>
          <p class="text-sm text-gray-600 mb-4">Upload documents, forms, or images related to this announcement.</p>
          <FileUpload
            v-model="attachments"
            parent-type="announcements"
            :parent-id="route.params.id as string"
          />
        </div>

        <!-- External Links -->
        <div class="border-t border-gray-200 pt-6">
          <ExternalLinkManager
            v-model="externalLinks"
            parent-type="announcement"
            :parent-id="isNew ? undefined : (route.params.id as string)"
          />
        </div>

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
