<template>
  <div class="py-12 bg-white dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="text-center mb-8">
        <h2 class="text-3xl font-display font-bold text-gray-900 dark:text-gray-100 mb-2">
          Recent Activities
        </h2>
        <p class="text-gray-600 dark:text-gray-300">
          A glimpse into our adventures and activities
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="photosStore.loading" class="text-center py-12">
        <p class="text-gray-600 dark:text-gray-300">Loading photos...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="photos.length === 0" class="text-center py-12">
        <p class="text-gray-600 dark:text-gray-300">No photos available yet</p>
      </div>

      <!-- Desktop: 3-column grid -->
      <div v-else class="hidden md:grid md:grid-cols-3 gap-4">
        <div
          v-for="(photo, index) in photos"
          :key="index"
          class="relative group cursor-pointer rounded-lg overflow-hidden aspect-[4/3] bg-gray-200 dark:bg-gray-800"
          @click="openLightbox(index)"
        >
          <img
            :src="photo.url"
            :alt="photo.caption"
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div class="absolute bottom-0 left-0 right-0 p-4">
              <p class="text-white font-medium text-sm">{{ photo.caption }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile/Tablet: Horizontal scroll -->
      <div v-if="!photosStore.loading && photos.length > 0" class="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div class="flex gap-3 pb-2">
          <div
            v-for="(photo, index) in photos"
            :key="index"
            class="flex-shrink-0 w-[85vw] sm:w-[60vw] cursor-pointer rounded-lg overflow-hidden aspect-[4/3] bg-gray-200 dark:bg-gray-800"
            @click="openLightbox(index)"
          >
            <img
              :src="photo.url"
              :alt="photo.caption"
              class="w-full h-full object-cover"
            />
            <div class="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <p class="text-gray-900 dark:text-gray-100 font-medium text-sm">{{ photo.caption }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Lightbox Modal -->
      <div
        v-if="lightboxOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
        @click="closeLightbox"
      >
        <button
          class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          @click.stop="closeLightbox"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Previous Button -->
        <button
          v-if="currentPhotoIndex > 0"
          class="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
          @click.stop="previousPhoto"
        >
          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <!-- Image -->
        <div class="max-w-5xl max-h-[90vh] w-full" @click.stop>
          <img
            :src="photos[currentPhotoIndex].url"
            :alt="photos[currentPhotoIndex].caption"
            class="w-full h-full object-contain"
          />
          <p class="text-white text-center mt-4 text-lg">
            {{ photos[currentPhotoIndex].caption }}
          </p>
        </div>

        <!-- Next Button -->
        <button
          v-if="currentPhotoIndex < photos.length - 1"
          class="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
          @click.stop="nextPhoto"
        >
          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { usePhotosStore } from '~/stores/photos'

const photosStore = usePhotosStore()

const lightboxOpen = ref(false)
const currentPhotoIndex = ref(0)

const photos = computed(() => photosStore.photos)

onMounted(async () => {
  await photosStore.fetchActivePhotos()
})

const openLightbox = (index: number) => {
  currentPhotoIndex.value = index
  lightboxOpen.value = true
}

const closeLightbox = () => {
  lightboxOpen.value = false
}

const nextPhoto = () => {
  if (currentPhotoIndex.value < photos.value.length - 1) {
    currentPhotoIndex.value++
  }
}

const previousPhoto = () => {
  if (currentPhotoIndex.value > 0) {
    currentPhotoIndex.value--
  }
}
</script>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>
