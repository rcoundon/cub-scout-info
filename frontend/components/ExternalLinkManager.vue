<template>
  <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">External Links</h3>
    <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
      Add helpful external links for this {{ parentType }}. Links will open in new tabs.
    </p>

    <!-- Existing Links -->
    <div v-if="links.length > 0" class="space-y-2 mb-4">
      <div
        v-for="(link, index) in links"
        :key="link.id"
        class="flex items-center gap-2 bg-white dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600"
      >
        <div class="flex-1 min-w-0">
          <div class="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
            {{ link.label || link.url }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
            {{ link.url }}
          </div>
        </div>
        <button
          @click="removeLink(index)"
          class="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
          type="button"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <div v-else class="text-sm text-gray-500 dark:text-gray-400 italic mb-4">
      No external links yet
    </div>

    <!-- Add/Select Links -->
    <div class="space-y-3">
      <!-- Select from Global Links -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Add from existing links
        </label>
        <select
          v-model="selectedGlobalLinkId"
          class="input w-full"
          @change="addGlobalLink"
        >
          <option value="">-- Select an existing link --</option>
          <option
            v-for="globalLink in availableGlobalLinks"
            :key="globalLink.id"
            :value="globalLink.id"
          >
            {{ globalLink.label || globalLink.url }}
          </option>
        </select>
      </div>

      <!-- Or Add New Link -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-3">
        <p class="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Or add a new link</p>
        <div class="space-y-2">
          <div>
            <label class="block text-xs text-gray-600 dark:text-gray-300 mb-1">URL *</label>
            <input
              v-model="newLink.url"
              type="url"
              placeholder="https://example.com"
              class="input w-full text-sm"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-600 dark:text-gray-300 mb-1">Label (optional)</label>
            <input
              v-model="newLink.label"
              type="text"
              placeholder="Link display name"
              class="input w-full text-sm"
            />
          </div>
          <button
            @click="addNewLink"
            type="button"
            :disabled="!newLink.url"
            class="w-full px-3 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Add Link
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useExternalLinksStore, type ExternalLink, type ExternalLinkParentType } from '~/stores/external-links'

const props = defineProps<{
  parentType: ExternalLinkParentType
  parentId?: string
  modelValue: ExternalLink[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ExternalLink[]): void
}>()

const linksStore = useExternalLinksStore()
const toast = useToast()
const globalLinks = ref<ExternalLink[]>([])
const selectedGlobalLinkId = ref('')
const newLink = ref({
  url: '',
  label: '',
})

const links = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Filter out global links that are already added
const availableGlobalLinks = computed(() => {
  const addedUrls = new Set(links.value.map(l => l.url))
  return globalLinks.value.filter(gl => !addedUrls.has(gl.url))
})

onMounted(async () => {
  // Fetch global links for selection
  await linksStore.fetchAllExternalLinks()
  globalLinks.value = linksStore.externalLinks.filter(l => l.parent_type === 'global')
})

const addGlobalLink = () => {
  if (!selectedGlobalLinkId.value) return

  const globalLink = globalLinks.value.find(l => l.id === selectedGlobalLinkId.value)
  if (!globalLink) return

  // Create a copy of the global link for this parent
  const newLinkCopy: ExternalLink = {
    id: '', // Will be generated when saved
    parent_type: props.parentType,
    parent_id: props.parentId,
    url: globalLink.url,
    label: globalLink.label,
    display_order: links.value.length,
    is_active: true,
    created_by: '',
    created_at: new Date().toISOString(),
  }

  links.value = [...links.value, newLinkCopy]
  selectedGlobalLinkId.value = ''
}

const addNewLink = () => {
  if (!newLink.value.url) return

  // Validate URL
  try {
    new URL(newLink.value.url)
  } catch {
    toast.add({
      title: 'Invalid URL',
      description: 'Please enter a valid URL.',
      color: 'error',
    })
    return
  }

  const link: ExternalLink = {
    id: '', // Will be generated when saved
    parent_type: props.parentType,
    parent_id: props.parentId,
    url: newLink.value.url,
    label: newLink.value.label || undefined,
    display_order: links.value.length,
    is_active: true,
    created_by: '',
    created_at: new Date().toISOString(),
  }

  links.value = [...links.value, link]

  // Reset form
  newLink.value = {
    url: '',
    label: '',
  }
}

const removeLink = (index: number) => {
  links.value = links.value.filter((_, i) => i !== index)
}
</script>
