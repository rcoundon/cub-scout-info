<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'default',
  middleware: 'guest',
})

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// Get redirect URL from query params
const redirectPath = computed(() => {
  const redirect = route.query.redirect as string
  return redirect || '/'
})

// If already authenticated, redirect immediately
onMounted(() => {
  if (authStore.isAuthenticated) {
    router.replace(redirectPath.value)
  }
})

// Form state
const email = ref('')
const password = ref('')
const rememberMe = ref(true) // Default to true for convenience
const emailError = ref('')
const passwordError = ref('')
const formError = ref('')

// Password change challenge state
const requiresPasswordChange = ref(false)
const challengeSession = ref('')
const challengeUsername = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const newPasswordError = ref('')
const confirmPasswordError = ref('')

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

const validateNewPassword = () => {
  if (!newPassword.value) {
    newPasswordError.value = 'New password is required'
    return false
  }
  if (newPassword.value.length < 8) {
    newPasswordError.value = 'Password must be at least 8 characters'
    return false
  }
  newPasswordError.value = ''
  return true
}

const validateConfirmPassword = () => {
  if (!confirmPassword.value) {
    confirmPasswordError.value = 'Please confirm your password'
    return false
  }
  if (confirmPassword.value !== newPassword.value) {
    confirmPasswordError.value = 'Passwords do not match'
    return false
  }
  confirmPasswordError.value = ''
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
  const result = await authStore.login(email.value, password.value, rememberMe.value)

  if (typeof result === 'object' && result.requiresPasswordChange) {
    // Show password change form
    requiresPasswordChange.value = true
    challengeSession.value = result.session || ''
    challengeUsername.value = result.username || email.value
  } else if (typeof result === 'object' && !result.requiresPasswordChange && !result.error) {
    // Login successful - redirect to intended page
    router.push(redirectPath.value)
  } else {
    formError.value = authStore.error || 'Login failed. Please check your credentials.'
  }
}

const handlePasswordChange = async () => {
  // Clear previous errors
  formError.value = ''
  newPasswordError.value = ''
  confirmPasswordError.value = ''

  // Validate new password
  const isNewPasswordValid = validateNewPassword()
  const isConfirmPasswordValid = validateConfirmPassword()

  if (!isNewPasswordValid || !isConfirmPasswordValid) {
    return
  }

  // Complete password change
  const success = await authStore.completeNewPassword(
    challengeUsername.value,
    newPassword.value,
    challengeSession.value
  )

  if (success) {
    // Redirect to intended page
    router.push(redirectPath.value)
  } else {
    formError.value = authStore.error || 'Failed to set new password. Please try again.'
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
              {{ requiresPasswordChange ? 'Change Your Password' : 'Sign In' }}
            </h2>
            <p class="text-gray-600 mt-2">
              {{ requiresPasswordChange ? 'Please set a new password to continue' : 'Access the Cubs Scout portal' }}
            </p>
          </div>
        </template>

        <!-- Initial Login Form -->
        <form v-if="!requiresPasswordChange" @submit.prevent="handleSubmit" class="space-y-6">
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

          <!-- Remember Me & Forgot Password -->
          <div class="flex items-center justify-between">
            <label class="flex items-center cursor-pointer">
              <input
                v-model="rememberMe"
                type="checkbox"
                class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
              />
              <span class="ml-2 text-sm text-gray-700">Remember me</span>
            </label>

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

        <!-- Password Change Form -->
        <form v-else @submit.prevent="handlePasswordChange" class="space-y-6">
          <!-- Info Message -->
          <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p class="text-sm text-blue-800">
              This is your first login. Please set a new password to continue.
            </p>
          </div>

          <!-- General Error Message -->
          <div
            v-if="formError"
            class="p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <p class="text-sm text-red-800">{{ formError }}</p>
          </div>

          <!-- New Password Field -->
          <BaseInput
            v-model="newPassword"
            type="password"
            label="New Password"
            placeholder="Enter new password (min 8 characters)"
            :error="newPasswordError"
            :required="true"
            @blur="validateNewPassword"
          />

          <!-- Confirm Password Field -->
          <BaseInput
            v-model="confirmPassword"
            type="password"
            label="Confirm New Password"
            placeholder="Re-enter new password"
            :error="confirmPasswordError"
            :required="true"
            @blur="validateConfirmPassword"
          />

          <!-- Submit Button -->
          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            :loading="authStore.loading"
            class="w-full"
          >
            {{ authStore.loading ? 'Setting Password...' : 'Set New Password' }}
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
