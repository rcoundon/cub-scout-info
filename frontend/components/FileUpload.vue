<template>
  <div class="space-y-4">
    <!-- Upload Section -->
    <div class="border-2 border-dashed border-gray-300 rounded-lg p-6">
      <input
        ref="fileInputRef"
        type="file"
        :accept="acceptedTypes.join(',')"
        @change="handleFileSelect"
        class="hidden"
      />

      <div class="text-center">
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <div class="mt-4">
          <button
            type="button"
            @click="triggerFileInput"
            class="btn-primary"
            :disabled="uploading"
          >
            {{ uploading ? 'Uploading...' : 'Select File' }}
          </button>
        </div>
        <p class="mt-2 text-sm text-gray-500">
          PDF, Word, Excel, images (JPEG, PNG, GIF, WebP), TXT up to 10MB
        </p>
      </div>

      <!-- Upload Progress -->
      <div v-if="uploading" class="mt-4">
        <div class="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>{{ uploadingFileName }}</span>
          <span>{{ uploadProgress }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div
            class="bg-primary-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: uploadProgress + '%' }"
          ></div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
        {{ errorMessage }}
      </div>
    </div>

    <!-- Uploaded Files List -->
    <div v-if="attachments.length > 0" class="space-y-2">
      <h4 class="font-medium text-gray-900">Uploaded Files</h4>
      <div
        v-for="attachment in attachments"
        :key="attachment.id"
        class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
      >
        <div class="flex items-center space-x-3 flex-1">
          <svg
            class="h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ attachment.original_name || attachment.file_name }}
            </p>
            <p class="text-sm text-gray-500">
              {{ formatFileSize(attachment.file_size) }}
            </p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <a
            :href="getDownloadUrl(attachment)"
            target="_blank"
            class="p-2 text-primary-600 hover:bg-primary-50 rounded"
            title="Download"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </a>
          <button
            @click="openDeleteModal(attachment)"
            class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            title="Delete"
            :disabled="deleting === attachment.id"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <BaseConfirmDialog
    v-model="showDeleteModal"
    title="Delete File"
    message="This will permanently delete the file. This action cannot be undone."
    confirm-text="Delete File"
    :loading="!!deleting"
    loading-text="Deleting..."
    @confirm="confirmDelete"
    @cancel="closeDeleteModal"
  >
    <div v-if="deletingAttachment">
      <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
        {{ deletingAttachment.original_name || deletingAttachment.file_name }}
      </p>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ formatFileSize(deletingAttachment.file_size) }}
      </p>
    </div>
  </BaseConfirmDialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Attachment {
  id: string;
  file_name: string;
  original_name: string;
  file_size: number;
  content_type: string;
  s3_key: string;
}

const props = withDefaults(
  defineProps<{
    parentType: 'events' | 'announcements';
    parentId?: string;
    modelValue: Attachment[];
  }>(),
  {
    parentId: '',
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: Attachment[]];
}>();

const config = useRuntimeConfig();
const toast = useToast();
const fileInputRef = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const uploadingFileName = ref('');
const uploadProgress = ref(0);
const errorMessage = ref('');
const deleting = ref<string | null>(null);
const showDeleteModal = ref(false);
const deletingAttachment = ref<Attachment | null>(null);

const acceptedTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
];

const attachments = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

function triggerFileInput() {
  fileInputRef.value?.click();
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;
  if (!props.parentId) {
    errorMessage.value = 'Cannot upload file: Parent ID is not set';
    return;
  }

  errorMessage.value = '';

  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    errorMessage.value = 'File size must be less than 10MB';
    return;
  }

  // Validate file type
  if (!acceptedTypes.includes(file.type)) {
    errorMessage.value = 'File type not allowed. Please select a PDF, Word, Excel, image, or TXT file.';
    return;
  }

  try {
    uploading.value = true;
    uploadingFileName.value = file.name;
    uploadProgress.value = 0;

    // Step 1: Get presigned upload URL
    const authStore = useAuthStore();
    const uploadUrlResponse = await $fetch<{
      uploadUrl: string;
      attachmentId: string;
      s3Key: string;
    }>(`${config.public.apiUrl}/api/${props.parentType}/${props.parentId}/attachments/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.accessToken}`,
      },
      body: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      },
    });

    // Step 2: Upload file directly to S3
    uploadProgress.value = 50;

    const uploadResponse = await fetch(uploadUrlResponse.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file to S3');
    }

    uploadProgress.value = 75;

    // Step 3: Confirm upload and create metadata
    const attachment = await $fetch<{ attachment: Attachment }>(
      `${config.public.apiUrl}/api/${props.parentType}/${props.parentId}/attachments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.accessToken}`,
        },
        body: {
          attachmentId: uploadUrlResponse.attachmentId,
          fileName: file.name,
          originalName: file.name,
          fileSize: file.size,
          contentType: file.type,
          s3Key: uploadUrlResponse.s3Key,
        },
      }
    );

    uploadProgress.value = 100;

    // Add to attachments list
    attachments.value = [...attachments.value, attachment.attachment];

    // Reset
    if (fileInputRef.value) {
      fileInputRef.value.value = '';
    }
  } catch (error) {
    console.error('Upload error:', error);
    errorMessage.value = error instanceof Error ? error.message : 'Failed to upload file';
  } finally {
    uploading.value = false;
    uploadingFileName.value = '';
    uploadProgress.value = 0;
  }
}

function getDownloadUrl(attachment: Attachment): string {
  // Generate download URL - this will be a presigned URL from the API
  return `${config.public.apiUrl}/api/attachments/${props.parentType}/${props.parentId}/${attachment.id}/download-url`;
}

function openDeleteModal(attachment: Attachment) {
  if (!props.parentId) {
    toast.add({
      title: 'Cannot delete',
      description: 'Parent ID is not set.',
      color: 'error',
    });
    return;
  }

  deletingAttachment.value = attachment;
  showDeleteModal.value = true;
}

function closeDeleteModal() {
  showDeleteModal.value = false;
  deletingAttachment.value = null;
}

async function confirmDelete() {
  if (!deletingAttachment.value) return;

  try {
    deleting.value = deletingAttachment.value.id;
    const authStore = useAuthStore();

    await $fetch(
      `${config.public.apiUrl}/api/attachments/${props.parentType}/${props.parentId}/${deletingAttachment.value.id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
        },
      }
    );

    // Remove from attachments list
    attachments.value = attachments.value.filter((a) => a.id !== deletingAttachment.value?.id);

    toast.add({
      title: 'File deleted',
      description: 'The file has been deleted successfully.',
      color: 'success',
    });
    closeDeleteModal();
  } catch (error) {
    console.error('Delete error:', error);
    toast.add({
      title: 'Error',
      description: 'Failed to delete file. Please try again.',
      color: 'error',
    });
  } finally {
    deleting.value = null;
  }
}
</script>
