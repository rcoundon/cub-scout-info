<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'default',
  middleware: 'guest',
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const config = useRuntimeConfig()

// Form state
const token = ref('')
const password = ref('')
const confirmPassword = ref('')
const passwordError = ref('')
const confirmPasswordError = ref('')
const formError = ref('')
const loading = ref(true) // Start as true to match SSR state
const submitting = ref(false)

// Invitation info
const invitationInfo = ref<{
  email: string
  name: string
  role: string
} | null>(null)

const invalidInvitation = ref(false)
const invitationExpired = ref(false)

// Validation functions
const validatePassword = () => {
  if (!password.value) {
    passwordError.value = 'Password is required'
    return false
  }
  if (password.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters'
    return false
  }
  passwordError.value = ''
  return true
}

const validateConfirmPassword = () => {
  if (!confirmPassword.value) {
    confirmPasswordError.value = 'Please confirm your password'
    return false
  }
  if (confirmPassword.value !== password.value) {
    confirmPasswordError.value = 'Passwords do not match'
    return false
  }
  confirmPasswordError.value = ''
  return true
}

// Load invitation info
onMounted(async () => {
  token.value = (route.query.token as string) || ''

  if (!token.value) {
    invalidInvitation.value = true
    return
  }

  // Validate invitation by trying to get info
  loading.value = true
  try {
    const response = await $fetch<{
      email: string
      first_name: string
      last_name: string
      role: string
    }>(`${config.public.apiUrl}/api/auth/validate-invite?token=${token.value}`)

    invitationInfo.value = {
      email: response.email,
      name: `${response.first_name} ${response.last_name}`,
      role: response.role,
    }
  } catch (error: any) {
    console.error('Error validating invitation:', error)
    if (error.data?.error === 'Invitation expired') {
      invitationExpired.value = true
    } else {
      invalidInvitation.value = true
    }
  } finally {
    loading.value = false
  }
})

const handleSubmit = async () => {
  // Clear previous errors
  formError.value = ''
  passwordError.value = ''
  confirmPasswordError.value = ''

  // Validate form
  const isPasswordValid = validatePassword()
  const isConfirmPasswordValid = validateConfirmPassword()

  if (!isPasswordValid || !isConfirmPasswordValid) {
    return
  }

  submitting.value = true

  try {
    const response = await $fetch<{
      success: boolean
      accessToken: string
      refreshToken: string
      idToken: string
    }>(`${config.public.apiUrl}/api/auth/accept-invite`, {
      method: 'POST',
      body: {
        token: token.value,
        password: password.value,
      },
    })

    if (response.success) {
      // Store tokens
      authStore.tokens = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        idToken: response.idToken,
      }

      if (process.client) {
        localStorage.setItem('auth_tokens', JSON.stringify(authStore.tokens))
      }

      // Fetch user profile
      await authStore.fetchUserProfile()

      // Redirect to home
      router.push('/')
    }
  } catch (error: any) {
    console.error('Error accepting invitation:', error)
    if (error.data?.error === 'Invitation expired') {
      invitationExpired.value = true
    } else if (error.data?.error === 'Invitation already used') {
      formError.value = 'This invitation has already been used. Please log in instead.'
    } else {
      formError.value = error.data?.message || 'Failed to activate account. Please try again.'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-16rem)] flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4">
    <div class="max-w-md w-full">
      <!-- Loading State -->
      <BaseCard v-if="loading">
        <div class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p class="text-gray-600">Validating invitation...</p>
        </div>
      </BaseCard>

      <!-- Invalid Invitation -->
      <BaseCard v-else-if="invalidInvitation">
        <div class="text-center py-8">
          <svg class="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 class="text-2xl font-display font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p class="text-gray-600 mb-6">
            This invitation link is invalid or has already been used.
          </p>
          <BaseButton @click="router.push('/login')" variant="primary">
            Go to Login
          </BaseButton>
        </div>
      </BaseCard>

      <!-- Expired Invitation -->
      <BaseCard v-else-if="invitationExpired">
        <div class="text-center py-8">
          <svg class="w-16 h-16 mx-auto text-orange-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 class="text-2xl font-display font-bold text-gray-900 mb-2">Invitation Expired</h2>
          <p class="text-gray-600 mb-6">
            This invitation has expired. Please contact your administrator to request a new invitation.
          </p>
          <BaseButton @click="router.push('/contact')" variant="primary">
            Contact Administrator
          </BaseButton>
        </div>
      </BaseCard>

      <!-- Accept Invitation Form -->
      <BaseCard v-else-if="invitationInfo">
        <template #header>
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span class="text-white font-bold text-2xl">CS</span>
            </div>
            <h2 class="text-2xl font-display font-bold text-gray-900">
              Welcome to Cubs Scout Group!
            </h2>
            <p class="text-gray-600 mt-2">
              Set up your account to get started
            </p>
          </div>
        </template>

        <!-- User Info Display -->
        <div class="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span class="text-sm font-medium text-gray-700">{{ invitationInfo.name }}</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span class="text-sm text-gray-600">{{ invitationInfo.email }}</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span class="text-sm text-gray-600">Role: <span class="font-medium capitalize">{{ invitationInfo.role }}</span></span>
            </div>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- General Error Message -->
          <div
            v-if="formError"
            class="p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <p class="text-sm text-red-800">{{ formError }}</p>
          </div>

          <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p class="text-sm text-blue-800">
              Please choose a secure password for your account. You'll use this to log in.
            </p>
          </div>

          <!-- Password Field -->
          <BaseInput
            v-model="password"
            type="password"
            label="Password"
            placeholder="Enter password (min 8 characters)"
            :error="passwordError"
            :required="true"
            @blur="validatePassword"
          />

          <!-- Confirm Password Field -->
          <BaseInput
            v-model="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="Re-enter password"
            :error="confirmPasswordError"
            :required="true"
            @blur="validateConfirmPassword"
          />

          <!-- Submit Button -->
          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            :loading="submitting"
            class="w-full"
          >
            {{ submitting ? 'Activating Account...' : 'Activate Account' }}
          </BaseButton>
        </form>

        <template #footer>
          <div class="text-center text-sm text-gray-600">
            <p>Already have an account? <NuxtLink to="/login" class="text-primary-600 hover:text-primary-700 font-medium">Sign in</NuxtLink></p>
          </div>
        </template>
      </BaseCard>
    </div>
  </div>
</template>
