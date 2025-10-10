<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'default',
  middleware: 'guest',
})

const authStore = useAuthStore()

// Form state
const email = ref('')
const emailError = ref('')
const successMessage = ref('')
const formError = ref('')

// Validation
const validateEmail = () => {
  if (!email.value) {
    emailError.value = 'Email is required'
    return false
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    emailError.value = 'Please enter a valid email address'
    return false
  }
  emailError.value = ''
  return true
}

const handleSubmit = async () => {
  // Clear previous messages
  formError.value = ''
  successMessage.value = ''
  emailError.value = ''

  // Validate
  if (!validateEmail()) {
    return
  }

  // Send reset request
  const success = await authStore.forgotPassword(email.value)

  if (success) {
    successMessage.value = 'Password reset instructions have been sent to your email.'
    email.value = ''
  } else {
    formError.value = authStore.error || 'Failed to send reset instructions. Please try again.'
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
              Forgot Password
            </h2>
            <p class="text-gray-600 mt-2">
              Enter your email to receive reset instructions
            </p>
          </div>
        </template>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Success Message -->
          <div
            v-if="successMessage"
            class="p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <p class="text-sm text-green-800">{{ successMessage }}</p>
          </div>

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
            @blur="validateEmail"
          />

          <!-- Submit Button -->
          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            :loading="authStore.loading"
            class="w-full"
          >
            {{ authStore.loading ? 'Sending...' : 'Send Reset Instructions' }}
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
