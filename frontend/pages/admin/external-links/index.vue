<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useExternalLinksStore } from '~/stores/external-links'

definePageMeta({
  layout: 'admin',
  middleware: 'editor',
})

const linksStore = useExternalLinksStore()

const showCreateModal = ref(false)
const editingLink = ref<any | null>(null)
const newLink = ref({
  url: '',
  label: '',
  is_active: true,
})

onMounted(async () => {
  await linksStore.fetchAllExternalLinks()
})

const openCreateModal = () => {
  newLink.value = {
    url: '',
    label: '',
    is_active: true,
  }
  editingLink.value = null
  showCreateModal.value = true
}

const openEditModal = (link: any) => {
  editingLink.value = link
  newLink.value = {
    url: link.url,
    label: link.label || '',
    is_active: link.is_active,
  }
  showCreateModal.value = true
}

const closeModal = () => {
  showCreateModal.value = false
  editingLink.value = null
  newLink.value = {
    url: '',
    label: '',
    is_active: true,
  }
}

const saveLink = async () => {
  if (!newLink.value.url) {
    alert('URL is required')
    return
  }

  // Validate URL
  try {
    new URL(newLink.value.url)
  } catch {
    alert('Please enter a valid URL')
    return
  }

  const linkData = {
    parent_type: 'global' as const,
    parent_id: 'none',
    url: newLink.value.url,
    label: newLink.value.label || undefined,
    is_active: newLink.value.is_active,
    display_order: editingLink.value?.display_order || linksStore.externalLinks.length,
  }

  let success
  if (editingLink.value) {
    success = await linksStore.updateExternalLink(editingLink.value.id, linkData)
  } else {
    const created = await linksStore.createExternalLink(linkData)
    success = !!created
  }

  if (success) {
    closeModal()
  }
}

const deleteLink = async (id: string, label?: string) => {
  const displayName = label || 'this link'
  if (confirm(`Are you sure you want to delete "${displayName}"?`)) {
    await linksStore.deleteExternalLink(id)
  }
}

const toggleActive = async (link: any) => {
  await linksStore.updateExternalLink(link.id, {
    is_active: !link.is_active,
  })
}

const moveUp = async (link: any, index: number) => {
  if (index === 0) return

  const links = linksStore.externalLinks
  const prevLink = links[index - 1]

  // Swap display orders
  const updates = [
    { id: link.id, display_order: prevLink.display_order },
    { id: prevLink.id, display_order: link.display_order },
  ]

  await linksStore.reorderExternalLinks(updates)
}

const moveDown = async (link: any, index: number) => {
  const links = linksStore.externalLinks
  if (index === links.length - 1) return

  const nextLink = links[index + 1]

  // Swap display orders
  const updates = [
    { id: link.id, display_order: nextLink.display_order },
    { id: nextLink.id, display_order: link.display_order },
  ]

  await linksStore.reorderExternalLinks(updates)
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-display font-bold text-gray-900">External Links</h1>
        <p class="text-gray-600 mt-1">Manage external website links displayed on the site</p>
      </div>
      <BaseButton variant="primary" @click="openCreateModal">
        Add Link
      </BaseButton>
    </div>

    <!-- Links List -->
    <div v-if="linksStore.loading" class="text-center py-12">
      <p class="text-gray-600">Loading links...</p>
    </div>

    <div v-else-if="linksStore.externalLinks.length === 0" class="text-center py-12">
      <p class="text-gray-600 mb-4">No external links yet</p>
      <BaseButton variant="primary" @click="openCreateModal">
        Add Your First Link
      </BaseButton>
    </div>

    <div v-else class="space-y-3">
      <BaseCard
        v-for="(link, index) in linksStore.externalLinks"
        :key="link.id"
        :hover="true"
      >
        <div class="flex items-start justify-between gap-4">
          <!-- Link Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3 mb-2">
              <h3 class="text-lg font-semibold text-gray-900 truncate">
                {{ link.label || link.url }}
              </h3>
              <BaseBadge :variant="link.is_active ? 'success' : 'secondary'">
                {{ link.is_active ? 'Active' : 'Inactive' }}
              </BaseBadge>
            </div>

            <a
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-primary-600 hover:text-primary-700 underline break-all"
            >
              {{ link.url }}
            </a>

            <div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span>Order: {{ link.display_order }}</span>
              <span>Created {{ new Date(link.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <!-- Reorder buttons -->
            <div class="flex flex-col gap-1">
              <button
                @click="moveUp(link, index)"
                :disabled="index === 0"
                :class="['p-1 rounded hover:bg-gray-100 transition-colors', index === 0 && 'opacity-30 cursor-not-allowed']"
                title="Move up"
              >
                <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                @click="moveDown(link, index)"
                :disabled="index === linksStore.externalLinks.length - 1"
                :class="['p-1 rounded hover:bg-gray-100 transition-colors', index === linksStore.externalLinks.length - 1 && 'opacity-30 cursor-not-allowed']"
                title="Move down"
              >
                <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <!-- Action buttons -->
            <BaseButton
              variant="outline"
              size="sm"
              @click="toggleActive(link)"
            >
              {{ link.is_active ? 'Hide' : 'Show' }}
            </BaseButton>
            <BaseButton
              variant="outline"
              size="sm"
              @click="openEditModal(link)"
            >
              Edit
            </BaseButton>
            <BaseButton
              variant="outline"
              size="sm"
              @click="deleteLink(link.id, link.label)"
            >
              Delete
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div
        v-if="showCreateModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        @click.self="closeModal"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <h2 class="text-2xl font-display font-bold text-gray-900 mb-4">
              {{ editingLink ? 'Edit Link' : 'Add New Link' }}
            </h2>

            <form @submit.prevent="saveLink" class="space-y-4">
              <!-- URL -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  URL <span class="text-red-500">*</span>
                </label>
                <BaseInput
                  v-model="newLink.url"
                  type="url"
                  placeholder="https://example.com"
                  required
                />
                <p class="text-xs text-gray-500 mt-1">
                  The full URL including https://
                </p>
              </div>

              <!-- Label -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Label (optional)
                </label>
                <BaseInput
                  v-model="newLink.label"
                  type="text"
                  placeholder="Link display name"
                />
                <p class="text-xs text-gray-500 mt-1">
                  If not provided, the URL will be displayed
                </p>
              </div>

              <!-- Active Status -->
              <div class="flex items-center gap-2">
                <input
                  id="is_active"
                  v-model="newLink.is_active"
                  type="checkbox"
                  class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label for="is_active" class="text-sm font-medium text-gray-700">
                  Show this link on the website
                </label>
              </div>

              <!-- Actions -->
              <div class="flex justify-end gap-3 pt-4">
                <BaseButton
                  type="button"
                  variant="outline"
                  @click="closeModal"
                >
                  Cancel
                </BaseButton>
                <BaseButton
                  type="submit"
                  variant="primary"
                >
                  {{ editingLink ? 'Update Link' : 'Create Link' }}
                </BaseButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
