<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'default',
  middleware: 'guest',
})

const authStore = useAuthStore()
const router = useRouter()

// Form state
const email = ref('')
const password = ref('')
const emailError = ref('')
const passwordError = ref('')
const formError = ref('')

// Form validation
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

const handleSubmit = async () => {
  // Clear previous errors
  formError.value = ''
  emailError.value = ''
  passwordError.value = ''

  // Validate form
  const isEmailValid = validateEmail()
  const isPasswordValid = validatePassword()

  if (!isEmailValid || !isPasswordValid) {
    return
  }

  // Attempt login
  const success = await authStore.login(email.value, password.value)

  if (success) {
    // Redirect to home or intended page
    router.push('/')
  } else {
    formError.value = authStore.error || 'Login failed. Please check your credentials.'
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-16rem)] flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4">
    <div class="max-w-md w-full">
      <BaseCard>
        <template #header>
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span class="text-white font-bold text-2xl">CS</span>
            </div>
            <h2 class="text-2xl font-display font-bold text-gray-900">
              Sign In
            </h2>
            <p class="text-gray-600 mt-2">
              Access the Cubs Scout portal
            </p>
          </div>
        </template>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- General Error Message -->
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

          <!-- Password Field -->
          <BaseInput
            v-model="password"
            type="password"
            label="Password"
            placeholder="Enter your password"
            :error="passwordError"
            :required="true"
            @blur="validatePassword"
          />

          <!-- Forgot Password Link -->
          <div class="text-right">
            <NuxtLink
              to="/forgot-password"
              class="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Forgot your password?
            </NuxtLink>
          </div>

          <!-- Submit Button -->
          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            :loading="authStore.loading"
            class="w-full"
          >
            {{ authStore.loading ? 'Signing in...' : 'Sign In' }}
          </BaseButton>
        </form>

        <template #footer>
          <div class="text-center text-sm text-gray-600">
            <p>Need access? Contact your Cubs leader to get an account.</p>
          </div>
        </template>
      </BaseCard>
    </div>
  </div>
</template>
