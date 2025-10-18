<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePhotosStore } from '~/stores/photos'

definePageMeta({
  layout: 'admin',
  middleware: 'editor',
})

const photosStore = usePhotosStore()
const toast = useToast()

const showUploadModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editingPhoto = ref<any | null>(null)
const deletingPhoto = ref<any | null>(null)
const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadCaption = ref('')
const editCaption = ref('')
const uploading = ref(false)
const deleting = ref(false)
const previewUrl = ref<string | null>(null)

onMounted(async () => {
  await photosStore.fetchAllPhotos()
})

const openUploadModal = () => {
  uploadCaption.value = ''
  selectedFile.value = null
  previewUrl.value = null
  showUploadModal.value = true
}

const closeUploadModal = () => {
  showUploadModal.value = false
  uploadCaption.value = ''
  selectedFile.value = null
  previewUrl.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const openEditModal = (photo: any) => {
  editingPhoto.value = photo
  editCaption.value = photo.caption
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editingPhoto.value = null
  editCaption.value = ''
}

const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) {
    selectedFile.value = null
    previewUrl.value = null
    return
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    toast.add({
      title: 'Invalid file type',
      description: 'Please select a valid image file (JPEG, PNG, GIF, or WebP).',
      color: 'error',
    })
    target.value = ''
    return
  }

  // Validate file size (10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    toast.add({
      title: 'File too large',
      description: 'File size must be less than 10MB.',
      color: 'error',
    })
    target.value = ''
    return
  }

  selectedFile.value = file

  // Create preview URL
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const uploadPhoto = async () => {
  if (!selectedFile.value || !uploadCaption.value) {
    toast.add({
      title: 'Missing information',
      description: 'Please select a file and enter a caption.',
      color: 'error',
    })
    return
  }

  uploading.value = true

  try {
    const displayOrder = photosStore.photos.length
    const photo = await photosStore.uploadPhoto(
      selectedFile.value,
      uploadCaption.value,
      displayOrder
    )

    if (photo) {
      closeUploadModal()
      await photosStore.fetchAllPhotos()

      toast.add({
        title: 'Photo uploaded',
        description: `"${uploadCaption.value}" has been uploaded successfully.`,
        color: 'success',
      })
    } else {
      toast.add({
        title: 'Upload failed',
        description: 'Failed to upload photo. Please try again.',
        color: 'error',
      })
    }
  } catch (error) {
    console.error('Error uploading photo:', error)
    toast.add({
      title: 'Upload failed',
      description: 'An unexpected error occurred while uploading.',
      color: 'error',
    })
  } finally {
    uploading.value = false
  }
}

const saveEdit = async () => {
  if (!editingPhoto.value || !editCaption.value) {
    toast.add({
      title: 'Missing information',
      description: 'Caption is required.',
      color: 'error',
    })
    return
  }

  const success = await photosStore.updatePhoto(editingPhoto.value.id, {
    caption: editCaption.value,
  })

  if (success) {
    closeEditModal()
    toast.add({
      title: 'Photo updated',
      description: 'Caption has been updated successfully.',
      color: 'success',
    })
  } else {
    toast.add({
      title: 'Error',
      description: 'Failed to update photo caption.',
      color: 'error',
    })
  }
}

const toggleVisibility = async (photo: any) => {
  const action = photo.is_active ? 'hidden' : 'shown'
  const success = await photosStore.updatePhoto(photo.id, {
    is_active: !photo.is_active,
  })

  if (success) {
    // Refresh the list to ensure UI is in sync
    await photosStore.fetchAllPhotos()

    toast.add({
      title: 'Photo updated',
      description: `Photo "${photo.caption}" is now ${action}.`,
      color: 'success',
    })
  } else {
    toast.add({
      title: 'Error',
      description: 'Failed to update photo visibility.',
      color: 'error',
    })
  }
}

const openDeleteModal = (photo: any) => {
  deletingPhoto.value = photo
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  deletingPhoto.value = null
}

const confirmDelete = async () => {
  if (!deletingPhoto.value) return

  deleting.value = true
  const photoCaption = deletingPhoto.value.caption

  try {
    const success = await photosStore.deletePhoto(deletingPhoto.value.id, true)
    if (success) {
      // Refresh the list to ensure UI is in sync
      await photosStore.fetchAllPhotos()

      toast.add({
        title: 'Photo deleted',
        description: `"${photoCaption}" has been permanently deleted.`,
        color: 'success',
      })

      closeDeleteModal()
    } else {
      toast.add({
        title: 'Error',
        description: 'Failed to delete photo. Please try again.',
        color: 'error',
      })
    }
  } catch (error) {
    console.error('Error deleting photo:', error)
    toast.add({
      title: 'Error',
      description: 'An unexpected error occurred.',
      color: 'error',
    })
  } finally {
    deleting.value = false
  }
}

const moveUp = async (photo: any, index: number) => {
  if (index === 0) return

  const photos = photosStore.photos
  const prevPhoto = photos[index - 1]

  const updates = [
    { id: photo.id, display_order: prevPhoto.display_order },
    { id: prevPhoto.id, display_order: photo.display_order },
  ]

  await photosStore.reorderPhotos(updates)
}

const moveDown = async (photo: any, index: number) => {
  const photos = photosStore.photos
  if (index === photos.length - 1) return

  const nextPhoto = photos[index + 1]

  const updates = [
    { id: photo.id, display_order: nextPhoto.display_order },
    { id: nextPhoto.id, display_order: photo.display_order },
  ]

  await photosStore.reorderPhotos(updates)
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">Photo Gallery</h1>
        <p class="text-gray-600 dark:text-gray-300 mt-1">Manage photos displayed in the gallery</p>
      </div>
      <BaseButton variant="primary" @click="openUploadModal">
        Upload Photo
      </BaseButton>
    </div>

    <!-- Photos List -->
    <div v-if="photosStore.loading" class="text-center py-12">
      <p class="text-gray-600 dark:text-gray-300">Loading photos...</p>
    </div>

    <div v-else-if="photosStore.photos.length === 0" class="text-center py-12">
      <p class="text-gray-600 dark:text-gray-300 mb-4">No photos yet</p>
      <BaseButton variant="primary" @click="openUploadModal">
        Upload Your First Photo
      </BaseButton>
    </div>

    <div v-else class="space-y-3">
      <BaseCard
        v-for="(photo, index) in photosStore.photos"
        :key="photo.id"
        :hover="true"
      >
        <div class="flex items-start gap-4">
          <!-- Photo Thumbnail -->
          <div class="flex-shrink-0">
            <img
              :src="photo.url"
              :alt="photo.caption"
              class="w-32 h-32 object-cover rounded-lg"
            />
          </div>

          <!-- Photo Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3 mb-2">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {{ photo.caption }}
              </h3>
              <BaseBadge :variant="photo.is_active ? 'success' : 'secondary'">
                {{ photo.is_active ? 'Shown' : 'Hidden' }}
              </BaseBadge>
            </div>

            <div class="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
              <div>
                <span class="font-medium">Order:</span> {{ photo.display_order }}
              </div>
              <div>
                <span class="font-medium">Size:</span> {{ formatFileSize(photo.file_size) }}
              </div>
              <div>
                <span class="font-medium">Type:</span> {{ photo.content_type }}
              </div>
              <div>
                <span class="font-medium">Uploaded:</span>
                {{ new Date(photo.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }}
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <!-- Reorder buttons -->
            <div class="flex flex-col gap-1">
              <button
                @click="moveUp(photo, index)"
                :disabled="index === 0"
                :class="[
                  'p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                  index === 0 && 'opacity-30 cursor-not-allowed'
                ]"
                title="Move up"
              >
                <svg class="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                @click="moveDown(photo, index)"
                :disabled="index === photosStore.photos.length - 1"
                :class="[
                  'p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                  index === photosStore.photos.length - 1 && 'opacity-30 cursor-not-allowed'
                ]"
                title="Move down"
              >
                <svg class="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <!-- Action buttons -->
            <div class="flex flex-col gap-2">
              <BaseButton
                variant="outline"
                size="sm"
                @click="toggleVisibility(photo)"
              >
                {{ photo.is_active ? 'Hide' : 'Show' }}
              </BaseButton>
              <BaseButton
                variant="outline"
                size="sm"
                @click="openEditModal(photo)"
              >
                Edit
              </BaseButton>
              <BaseButton
                variant="outline"
                size="sm"
                @click="openDeleteModal(photo)"
              >
                Delete
              </BaseButton>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Upload Modal -->
    <Teleport to="body">
      <div
        v-if="showUploadModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        @click.self="closeUploadModal"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <h2 class="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 mb-4">
              Upload Photo
            </h2>

            <form @submit.prevent="uploadPhoto" class="space-y-4">
              <!-- File Input -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Photo <span class="text-red-500 dark:text-red-400">*</span>
                </label>
                <div class="flex items-center gap-3">
                  <label
                    for="photo-upload"
                    class="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                  >
                    Choose photo
                  </label>
                  <input
                    id="photo-upload"
                    ref="fileInputRef"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    @change="onFileSelected"
                    class="sr-only"
                    required
                  />
                  <span v-if="selectedFile" class="text-sm text-gray-600 dark:text-gray-300">
                    {{ selectedFile.name }}
                  </span>
                  <span v-else class="text-sm text-gray-500 dark:text-gray-400 italic">
                    No file chosen
                  </span>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Accepted formats: JPEG, PNG, GIF, WebP. Max size: 10MB
                </p>
              </div>

              <!-- Preview -->
              <div v-if="previewUrl" class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <p class="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Preview:</p>
                <img
                  :src="previewUrl"
                  alt="Preview"
                  class="max-w-full max-h-64 object-contain mx-auto rounded"
                />
              </div>

              <!-- Caption -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Caption <span class="text-red-500 dark:text-red-400">*</span>
                </label>
                <BaseInput
                  v-model="uploadCaption"
                  type="text"
                  placeholder="Enter a caption for this photo"
                  required
                />
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This will be displayed with the photo in the gallery
                </p>
              </div>

              <!-- Actions -->
              <div class="flex justify-end gap-3 pt-4">
                <BaseButton
                  type="button"
                  variant="outline"
                  @click="closeUploadModal"
                  :disabled="uploading"
                >
                  Cancel
                </BaseButton>
                <BaseButton
                  type="submit"
                  variant="primary"
                  :disabled="uploading || !selectedFile || !uploadCaption"
                >
                  {{ uploading ? 'Uploading...' : 'Upload Photo' }}
                </BaseButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Edit Modal -->
    <Teleport to="body">
      <div
        v-if="showEditModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        @click.self="closeEditModal"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <h2 class="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 mb-4">
              Edit Photo
            </h2>

            <form @submit.prevent="saveEdit" class="space-y-4">
              <!-- Photo Preview -->
              <div v-if="editingPhoto" class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <img
                  :src="editingPhoto.url"
                  :alt="editingPhoto.caption"
                  class="max-w-full max-h-64 object-contain mx-auto rounded"
                />
              </div>

              <!-- Caption -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Caption <span class="text-red-500 dark:text-red-400">*</span>
                </label>
                <BaseInput
                  v-model="editCaption"
                  type="text"
                  placeholder="Enter a caption for this photo"
                  required
                />
              </div>

              <!-- Actions -->
              <div class="flex justify-end gap-3 pt-4">
                <BaseButton
                  type="button"
                  variant="outline"
                  @click="closeEditModal"
                >
                  Cancel
                </BaseButton>
                <BaseButton
                  type="submit"
                  variant="primary"
                >
                  Update Photo
                </BaseButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        @click.self="closeDeleteModal"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          <div class="p-6">
            <h2 class="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 mb-4">
              Delete Photo
            </h2>

            <div class="space-y-4">
              <!-- Warning Message -->
              <div class="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <svg class="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p class="text-sm font-medium text-red-800 dark:text-red-200">
                    This action cannot be undone
                  </p>
                  <p class="text-sm text-red-700 dark:text-red-300 mt-1">
                    This will permanently delete the photo and remove it from storage.
                  </p>
                </div>
              </div>

              <!-- Photo Info -->
              <div v-if="deletingPhoto" class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div class="flex items-center gap-4">
                  <img
                    :src="deletingPhoto.url"
                    :alt="deletingPhoto.caption"
                    class="w-20 h-20 object-cover rounded"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {{ deletingPhoto.caption }}
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {{ formatFileSize(deletingPhoto.file_size) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex justify-end gap-3 pt-4">
                <BaseButton
                  type="button"
                  variant="outline"
                  @click="closeDeleteModal"
                  :disabled="deleting"
                >
                  Cancel
                </BaseButton>
                <BaseButton
                  type="button"
                  variant="outline"
                  @click="confirmDelete"
                  :disabled="deleting"
                  class="!border-red-600 !text-red-600 hover:!bg-red-50 dark:!border-red-500 dark:!text-red-500 dark:hover:!bg-red-900/20"
                >
                  {{ deleting ? 'Deleting...' : 'Delete Photo' }}
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
