<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'default',
  middleware: 'guest',
})

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// Get email and code from URL query params
const email = ref((route.query.email as string) || '')
const code = ref((route.query.code as string) || '')
const newPassword = ref('')
const confirmPassword = ref('')

// Error states
const emailError = ref('')
const codeError = ref('')
const passwordError = ref('')
const confirmPasswordError = ref('')
const formError = ref('')

// Validation
const validateForm = () => {
  let isValid = true

  // Email validation
  if (!email.value) {
    emailError.value = 'Email is required'
    isValid = false
  } else {
    emailError.value = ''
  }

  // Code validation
  if (!code.value) {
    codeError.value = 'Verification code is required'
    isValid = false
  } else {
    codeError.value = ''
  }

  // Password validation
  if (!newPassword.value) {
    passwordError.value = 'New password is required'
    isValid = false
  } else if (newPassword.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters'
    isValid = false
  } else if (!/[A-Z]/.test(newPassword.value)) {
    passwordError.value = 'Password must contain at least one uppercase letter'
    isValid = false
  } else if (!/[a-z]/.test(newPassword.value)) {
    passwordError.value = 'Password must contain at least one lowercase letter'
    isValid = false
  } else if (!/[0-9]/.test(newPassword.value)) {
    passwordError.value = 'Password must contain at least one number'
    isValid = false
  } else {
    passwordError.value = ''
  }

  // Confirm password validation
  if (!confirmPassword.value) {
    confirmPasswordError.value = 'Please confirm your password'
    isValid = false
  } else if (confirmPassword.value !== newPassword.value) {
    confirmPasswordError.value = 'Passwords do not match'
    isValid = false
  } else {
    confirmPasswordError.value = ''
  }

  return isValid
}

const handleSubmit = async () => {
  // Clear previous error
  formError.value = ''

  // Validate
  if (!validateForm()) {
    return
  }

  // Reset password
  const success = await authStore.resetPassword(
    email.value,
    code.value,
    newPassword.value
  )

  if (success) {
    // Redirect to login with success message
    router.push('/login?reset=success')
  } else {
    formError.value = authStore.error || 'Failed to reset password. Please try again.'
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-16rem)] flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4">
    <div class="max-w-md w-full">
      <BaseCard>
        <template #header>
          <div class="text-center">
            <h2 class="text-2xl font-display font-bold text-gray-900">
              Reset Password
            </h2>
            <p class="text-gray-600 mt-2">
              Enter your verification code and new password
            </p>
          </div>
        </template>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Error Message -->
          <div
            v-if="formError"
            class="p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <p class="text-sm text-red-800">{{ formError }}</p>
          </div>

          <!-- Email Field -->
          <BaseInput
            v-model="email"
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            :error="emailError"
            :required="true"
          />

          <!-- Verification Code -->
          <BaseInput
            v-model="code"
            type="text"
            label="Verification Code"
            placeholder="Enter code from email"
            :error="codeError"
            :required="true"
            hint="Check your email for the verification code"
          />

          <!-- New Password -->
          <BaseInput
            v-model="newPassword"
            type="password"
            label="New Password"
            placeholder="Enter new password"
            :error="passwordError"
            :required="true"
            hint="At least 8 characters with uppercase, lowercase, and number"
          />

          <!-- Confirm Password -->
          <BaseInput
            v-model="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="Confirm new password"
            :error="confirmPasswordError"
            :required="true"
          />

          <!-- Submit Button -->
          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            :loading="authStore.loading"
            class="w-full"
          >
            {{ authStore.loading ? 'Resetting...' : 'Reset Password' }}
          </BaseButton>
        </form>

        <template #footer>
          <div class="text-center text-sm">
            <NuxtLink
              to="/login"
              class="text-primary-600 hover:text-primary-700 font-medium"
            >
              Back to Sign In
            </NuxtLink>
          </div>
        </template>
      </BaseCard>
    </div>
  </div>
</template>
