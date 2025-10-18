<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ContactStatus } from '~/types/contact'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: ContactStatus
  created_at: string
  updated_at?: string
}

const messages = ref<ContactMessage[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const toast = useToast()
const selectedStatus = ref<ContactStatus | 'all'>('all')
const searchQuery = ref('')
const showDeleteModal = ref(false)
const deletingMessage = ref<ContactMessage | null>(null)
const deleting = ref(false)

const filteredMessages = computed(() => {
  let filtered = messages.value

  // Filter by status
  if (selectedStatus.value !== 'all') {
    filtered = filtered.filter((m) => m.status === selectedStatus.value)
  }

  // Search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        m.subject.toLowerCase().includes(query) ||
        m.message.toLowerCase().includes(query)
    )
  }

  return filtered
})

const statusCounts = computed(() => {
  const counts = {
    all: messages.value.length,
    new: 0,
    read: 0,
    replied: 0,
    archived: 0,
  }

  messages.value.forEach((m) => {
    counts[m.status]++
  })

  return counts
})

const fetchMessages = async (retryCount = 0) => {
  loading.value = true
  error.value = null

  try {
    const authStore = useAuthStore()
    const config = useRuntimeConfig()

    const response = await $fetch<{ messages: ContactMessage[] }>(
      `${config.public.apiUrl}/api/contact/admin/all`,
      {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
        },
      }
    )

    messages.value = response.messages
  } catch (err: any) {
    // If 401 and we haven't retried yet, refresh token and retry
    if (err.status === 401 && retryCount === 0) {
      const authStore = useAuthStore()
      const refreshed = await authStore.refreshTokens()

      if (refreshed) {
        // Retry with new token
        return fetchMessages(retryCount + 1)
      }
    }

    console.error('Failed to fetch contact messages:', err)
    error.value = err.data?.error || 'Failed to load contact messages'
  } finally {
    loading.value = false
  }
}

const updateStatus = async (id: string, status: ContactStatus) => {
  try {
    const authStore = useAuthStore()
    const config = useRuntimeConfig()

    await $fetch(`${config.public.apiUrl}/api/contact/admin/${id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
      body: { status },
    })

    // Update local state
    const message = messages.value.find((m) => m.id === id)
    if (message) {
      message.status = status
      message.updated_at = new Date().toISOString()
    }

    toast.add({
      title: 'Status updated',
      description: 'Message status has been updated successfully.',
      color: 'success',
    })
  } catch (err: any) {
    console.error('Failed to update status:', err)
    toast.add({
      title: 'Error',
      description: 'Failed to update status: ' + (err.data?.error || 'Unknown error'),
      color: 'error',
    })
  }
}

const openDeleteModal = (message: ContactMessage) => {
  deletingMessage.value = message
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  deletingMessage.value = null
}

const confirmDelete = async () => {
  if (!deletingMessage.value) return

  deleting.value = true

  try {
    const authStore = useAuthStore()
    const config = useRuntimeConfig()

    await $fetch(`${config.public.apiUrl}/api/contact/admin/${deletingMessage.value.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })

    // Remove from local state
    messages.value = messages.value.filter((m) => m.id !== deletingMessage.value?.id)

    toast.add({
      title: 'Message deleted',
      description: 'Contact message has been deleted successfully.',
      color: 'success',
    })
    closeDeleteModal()
  } catch (err: any) {
    console.error('Failed to delete message:', err)
    toast.add({
      title: 'Error',
      description: 'Failed to delete message: ' + (err.data?.error || 'Unknown error'),
      color: 'error',
    })
  } finally {
    deleting.value = false
  }
}

const getStatusBadgeVariant = (status: ContactStatus) => {
  const variants: Record<ContactStatus, string> = {
    new: 'danger',
    read: 'warning',
    replied: 'success',
    archived: 'primary',
  }
  return variants[status]
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  fetchMessages()
})
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">Contact Messages</h1>
        <p class="text-gray-600 dark:text-gray-300 mt-1">Manage contact form submissions</p>
      </div>

      <BaseButton @click="fetchMessages" variant="secondary" size="sm">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Refresh
      </BaseButton>
    </div>

    <!-- Status Filter Tabs -->
    <div class="mb-6 flex flex-wrap gap-2">
      <button
        v-for="status in ['all', 'new', 'read', 'replied', 'archived']"
        :key="status"
        @click="selectedStatus = status as ContactStatus | 'all'"
        class="px-4 py-2 rounded-lg font-medium transition-colors"
        :class="
          selectedStatus === status
            ? 'bg-primary-600 text-white'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
        "
      >
        {{ status.charAt(0).toUpperCase() + status.slice(1) }}
        <span
          class="ml-2 px-2 py-0.5 text-xs rounded-full"
          :class="selectedStatus === status ? 'bg-primary-700' : 'bg-gray-100'"
        >
          {{ statusCounts[status] }}
        </span>
      </button>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <BaseInput
        v-model="searchQuery"
        placeholder="Search by name, email, subject, or message..."
        type="search"
      >
        <template #prefix>
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </template>
      </BaseInput>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
      <p class="text-gray-600 dark:text-gray-300 mt-4">Loading messages...</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200"
    >
      {{ error }}
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredMessages.length === 0" class="text-center py-12">
      <svg
        class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No messages</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ searchQuery ? 'No messages match your search.' : 'No contact messages yet.' }}
      </p>
    </div>

    <!-- Messages List -->
    <div v-else class="space-y-4">
      <BaseCard v-for="message in filteredMessages" :key="message.id" class="hover:shadow-md transition-shadow">
        <div class="space-y-4">
          <!-- Header -->
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ message.subject }}</h3>
                <BaseBadge :variant="getStatusBadgeVariant(message.status)">
                  {{ message.status.charAt(0).toUpperCase() + message.status.slice(1) }}
                </BaseBadge>
              </div>
              <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                <span class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  {{ message.name }}
                </span>
                <span class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <a :href="`mailto:${message.email}`" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                    {{ message.email }}
                  </a>
                </span>
                <span class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {{ formatDate(message.created_at) }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2">
              <button
                @click="openDeleteModal(message)"
                class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete message"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- Message Content -->
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ message.message }}</p>
          </div>

          <!-- Status Actions -->
          <div class="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <span class="text-sm text-gray-600 dark:text-gray-300 mr-2">Update status:</span>
            <button
              v-for="status in ['new', 'read', 'replied', 'archived']"
              :key="status"
              @click="updateStatus(message.id, status as ContactStatus)"
              :disabled="message.status === status"
              class="px-3 py-1 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :class="
                message.status === status
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-default'
                  : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              "
            >
              {{ status.charAt(0).toUpperCase() + status.slice(1) }}
            </button>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Delete Confirmation Modal -->
    <BaseConfirmDialog
      v-model="showDeleteModal"
      title="Delete Contact Message"
      message="This will permanently delete the contact message. This action cannot be undone."
      confirm-text="Delete Message"
      :loading="deleting"
      loading-text="Deleting..."
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    >
      <div v-if="deletingMessage" class="space-y-2">
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
            {{ deletingMessage.subject }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            From: {{ deletingMessage.name }} ({{ deletingMessage.email }})
          </p>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          {{ deletingMessage.message.substring(0, 100) }}{{ deletingMessage.message.length > 100 ? '...' : '' }}
        </p>
      </div>
    </BaseConfirmDialog>
  </div>
</template>
