import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

export interface Photo {
  id: string
  url: string
  s3_key: string
  caption: string
  display_order: number
  is_active: boolean
  file_size: number
  content_type: string
  uploaded_by: string
  created_at: string
  updated_at?: string
}

export interface UploadUrlResponse {
  uploadUrl: string
  s3Key: string
  photoId: string
}

export const usePhotosStore = defineStore('photos', () => {
  const authStore = useAuthStore()

  // State
  const photos = ref<Photo[]>([])
  const currentPhoto = ref<Photo | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchActivePhotos() {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      const response = await $fetch<{ photos: Photo[] }>(
        `${config.public.apiUrl}/api/photos`
      )

      photos.value = response.photos
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch photos'
      console.error('Error fetching photos:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchAllPhotos() {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      const response = await $fetch<{ photos: Photo[] }>(
        `${config.public.apiUrl}/api/photos/admin/all`,
        {
          headers: authStore.getAuthHeader(),
        }
      )

      photos.value = response.photos
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch photos'
      console.error('Error fetching photos:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchPhotoById(id: string) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      const response = await $fetch<{ photo: Photo }>(
        `${config.public.apiUrl}/api/photos/${id}`
      )

      currentPhoto.value = response.photo
      return response.photo
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch photo'
      console.error('Error fetching photo:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function getUploadUrl(fileName: string, fileType: string, fileSize: number) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      const response = await $fetch<UploadUrlResponse>(
        `${config.public.apiUrl}/api/photos/upload-url`,
        {
          method: 'POST',
          headers: {
            ...authStore.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: {
            fileName,
            fileType,
            fileSize,
          },
        }
      )

      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to get upload URL'
      console.error('Error getting upload URL:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function uploadPhotoToS3(uploadUrl: string, file: File) {
    loading.value = true
    error.value = null

    try {
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      return true
    } catch (err: any) {
      error.value = err.message || 'Failed to upload photo to S3'
      console.error('Error uploading to S3:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function createPhoto(photoData: {
    s3_key: string
    caption: string
    file_size: number
    content_type: string
    display_order?: number
  }) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()

      const response = await $fetch<{ photo: Photo }>(
        `${config.public.apiUrl}/api/photos`,
        {
          method: 'POST',
          headers: {
            ...authStore.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: photoData,
        }
      )

      photos.value.push(response.photo)
      return response.photo
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to create photo'
      console.error('Error creating photo:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function uploadPhoto(file: File, caption: string, display_order?: number) {
    // Step 1: Get upload URL
    const uploadData = await getUploadUrl(file.name, file.type, file.size)
    if (!uploadData) {
      return null
    }

    // Step 2: Upload file to S3
    const uploadSuccess = await uploadPhotoToS3(uploadData.uploadUrl, file)
    if (!uploadSuccess) {
      return null
    }

    // Step 3: Create photo metadata
    const photo = await createPhoto({
      s3_key: uploadData.s3Key,
      caption,
      file_size: file.size,
      content_type: file.type,
      display_order,
    })

    return photo
  }

  async function updatePhoto(
    id: string,
    updates: Partial<Pick<Photo, 'caption' | 'display_order' | 'is_active'>>
  ) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()

      const response = await $fetch<{ photo: Photo }>(
        `${config.public.apiUrl}/api/photos/${id}`,
        {
          method: 'PUT',
          headers: {
            ...authStore.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: updates,
        }
      )

      const index = photos.value.findIndex((p) => p.id === id)
      if (index !== -1) {
        photos.value[index] = response.photo
      }

      if (currentPhoto.value?.id === id) {
        currentPhoto.value = response.photo
      }

      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to update photo'
      console.error('Error updating photo:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function deletePhoto(id: string, permanent = false) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      const url = permanent
        ? `${config.public.apiUrl}/api/photos/${id}?permanent=true`
        : `${config.public.apiUrl}/api/photos/${id}`

      await $fetch(url, {
        method: 'DELETE',
        headers: authStore.getAuthHeader(),
      })

      if (permanent) {
        photos.value = photos.value.filter((p) => p.id !== id)
      } else {
        // Update is_active to false
        const index = photos.value.findIndex((p) => p.id === id)
        if (index !== -1) {
          photos.value[index].is_active = false
        }
      }

      if (currentPhoto.value?.id === id) {
        currentPhoto.value = null
      }

      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to delete photo'
      console.error('Error deleting photo:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function reorderPhotos(photoOrder: Array<{ id: string; display_order: number }>) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      await $fetch(`${config.public.apiUrl}/api/photos/reorder`, {
        method: 'POST',
        headers: {
          ...authStore.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: { photos: photoOrder },
      })

      // Update local state
      photoOrder.forEach(({ id, display_order }) => {
        const photo = photos.value.find((p) => p.id === id)
        if (photo) {
          photo.display_order = display_order
        }
      })

      // Re-sort the array
      photos.value.sort((a, b) => a.display_order - b.display_order)

      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to reorder photos'
      console.error('Error reordering photos:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    photos,
    currentPhoto,
    loading,
    error,

    // Actions
    fetchActivePhotos,
    fetchAllPhotos,
    fetchPhotoById,
    getUploadUrl,
    uploadPhotoToS3,
    createPhoto,
    uploadPhoto,
    updatePhoto,
    deletePhoto,
    reorderPhotos,
  }
})
