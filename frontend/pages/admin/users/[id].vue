<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUsersStore } from '~/stores/users'
import { useAuthStore } from '~/stores/auth'
import { useRouter, useRoute } from 'vue-router'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const usersStore = useUsersStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const isNew = computed(() => route.params.id === 'new')
const isEditingSelf = computed(() => !isNew.value && route.params.id === authStore.user?.id)
const pageTitle = computed(() => isNew.value ? 'Create User' : 'Edit User')

// Form data
const form = ref({
  email: '',
  password: '',
  confirmPassword: '',
  first_name: '',
  last_name: '',
  role: 'viewer' as 'admin' | 'editor' | 'viewer',
})

const errors = ref<Record<string, string>>({})
const submitting = ref(false)

onMounted(async () => {
  if (!isNew.value) {
    const user = await usersStore.fetchUserById(route.params.id as string)
    if (user) {
      form.value = {
        email: user.email,
        password: '',
        confirmPassword: '',
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      }
    } else {
      router.push('/admin/users')
    }
  }
})

const validate = () => {
  errors.value = {}
  let isValid = true

  // Email validation
  if (!form.value.email.trim()) {
    errors.value.email = 'Email is required'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Invalid email format'
    isValid = false
  }

  // Password validation (only for new users or when changing password)
  if (isNew.value) {
    if (!form.value.password) {
      errors.value.password = 'Password is required'
      isValid = false
    } else if (form.value.password.length < 8) {
      errors.value.password = 'Password must be at least 8 characters'
      isValid = false
    } else if (!/[A-Z]/.test(form.value.password)) {
      errors.value.password = 'Password must contain at least one uppercase letter'
      isValid = false
    } else if (!/[a-z]/.test(form.value.password)) {
      errors.value.password = 'Password must contain at least one lowercase letter'
      isValid = false
    } else if (!/[0-9]/.test(form.value.password)) {
      errors.value.password = 'Password must contain at least one number'
      isValid = false
    }

    if (form.value.password !== form.value.confirmPassword) {
      errors.value.confirmPassword = 'Passwords do not match'
      isValid = false
    }
  }

  // Name validation
  if (!form.value.first_name.trim()) {
    errors.value.first_name = 'First name is required'
    isValid = false
  }

  if (!form.value.last_name.trim()) {
    errors.value.last_name = 'Last name is required'
    isValid = false
  }

  // Role validation (can't demote yourself)
  if (isEditingSelf.value && form.value.role !== 'admin') {
    errors.value.role = 'You cannot change your own role'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validate()) return

  submitting.value = true

  try {
    let success
    if (isNew.value) {
      success = await usersStore.createUser({
        email: form.value.email,
        password: form.value.password,
        first_name: form.value.first_name,
        last_name: form.value.last_name,
        role: form.value.role,
      })
    } else {
      success = await usersStore.updateUser(route.params.id as string, {
        first_name: form.value.first_name,
        last_name: form.value.last_name,
        role: form.value.role,
      })
    }

    if (success) {
      router.push('/admin/users')
    } else {
      // Show error from store
      if (usersStore.error) {
        errors.value.form = usersStore.error
      }
    }
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  router.push('/admin/users')
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-display font-bold text-gray-900">{{ pageTitle }}</h1>
      <p class="text-gray-600 mt-1">{{ isNew ? 'Create a new user account' : 'Update user details and permissions' }}</p>
      <div v-if="isEditingSelf" class="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p class="text-sm text-yellow-800">
          ⚠️ You are editing your own account. You cannot change your own role.
        </p>
      </div>
    </div>

    <!-- Form -->
    <BaseCard>
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Form-level error -->
        <div v-if="errors.form" class="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-800">{{ errors.form }}</p>
        </div>

        <!-- Email -->
        <BaseInput
          v-model="form.email"
          type="email"
          label="Email"
          placeholder="user@example.com"
          :error="errors.email"
          :required="true"
          :disabled="!isNew"
          :hint="!isNew ? 'Email cannot be changed after account creation' : ''"
        />

        <!-- Password (only for new users) -->
        <div v-if="isNew">
          <BaseInput
            v-model="form.password"
            type="password"
            label="Password"
            placeholder="Enter password"
            :error="errors.password"
            :required="true"
            hint="At least 8 characters with uppercase, lowercase, and number"
          />

          <BaseInput
            v-model="form.confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="Confirm password"
            :error="errors.confirmPassword"
            :required="true"
            class="mt-4"
          />
        </div>

        <!-- Name Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BaseInput
            v-model="form.first_name"
            label="First Name"
            placeholder="John"
            :error="errors.first_name"
            :required="true"
          />

          <BaseInput
            v-model="form.last_name"
            label="Last Name"
            placeholder="Doe"
            :error="errors.last_name"
            :required="true"
          />
        </div>

        <!-- Role -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Role <span class="text-red-500">*</span>
          </label>
          <select
            v-model="form.role"
            class="input"
            :disabled="isEditingSelf"
            :class="{ 'opacity-60 cursor-not-allowed': isEditingSelf }"
          >
            <option value="viewer">Viewer - Can view published content</option>
            <option value="editor">Editor - Can create and edit content</option>
            <option value="admin">Admin - Full access to all features</option>
          </select>
          <p v-if="errors.role" class="mt-1 text-sm text-red-600">
            {{ errors.role }}
          </p>
          <p class="mt-1 text-sm text-gray-500">
            Select the appropriate permission level for this user
          </p>
        </div>

        <!-- Actions -->
        <div class="flex gap-4 pt-4">
          <BaseButton
            type="submit"
            variant="primary"
            :loading="submitting"
          >
            {{ submitting ? 'Saving...' : (isNew ? 'Create User' : 'Update User') }}
          </BaseButton>
          <BaseButton
            type="button"
            variant="outline"
            @click="handleCancel"
            :disabled="submitting"
          >
            Cancel
          </BaseButton>
        </div>
      </form>
    </BaseCard>
  </div>
</template>
