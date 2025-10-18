<template>
  <div v-if="linksStore.externalLinks.length > 0" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
    <h2 class="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
      <svg class="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      Useful Links
    </h2>
    <div class="space-y-2">
      <a
        v-for="link in linksStore.externalLinks"
        :key="link.id"
        :href="link.url"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-gray-700 transition-all group"
      >
        <span class="text-gray-900 dark:text-gray-100 font-medium group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
          {{ link.label || link.url }}
        </span>
        <svg class="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useExternalLinksStore } from '~/stores/external-links'

const linksStore = useExternalLinksStore()

onMounted(async () => {
  await linksStore.fetchActiveExternalLinks()
})
</script>
