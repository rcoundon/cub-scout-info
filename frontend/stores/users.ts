import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  leadership_name?: string
  role: 'admin' | 'editor' | 'viewer'
  last_login?: string
  created_at: string
  invitation_status?: 'invited' | 'active' | 'expired'
}

export const useUsersStore = defineStore('users', () => {
  const authStore = useAuthStore()

  // State
  const users = ref<User[]>([])
  const currentUser = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchAllUsers() {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      const response = await $fetch<{ users: User[] }>(
        `${config.public.apiUrl}/api/admin/users`,
        {
          headers: authStore.getAuthHeader(),
        }
      )

      users.value = response.users
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch users'
      console.error('Error fetching users:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchUserById(id: string) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      const response = await $fetch<{ user: User }>(
        `${config.public.apiUrl}/api/admin/users/${id}`,
        {
          headers: authStore.getAuthHeader(),
        }
      )

      currentUser.value = response.user
      return response.user
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch user'
      console.error('Error fetching user:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function createUser(userData: {
    email: string
    password?: string
    first_name: string
    last_name: string
    leadership_name?: string
    role: 'admin' | 'editor' | 'viewer'
  }) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      const response = await $fetch<{ user: User }>(
        `${config.public.apiUrl}/api/admin/users`,
        {
          method: 'POST',
          headers: authStore.getAuthHeader(),
          body: userData,
        }
      )

      users.value.push(response.user)
      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to create user'
      console.error('Error creating user:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateUser(
    id: string,
    updates: {
      first_name?: string
      last_name?: string
      leadership_name?: string
      role?: 'admin' | 'editor' | 'viewer'
    }
  ) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      const response = await $fetch<{ user: User }>(
        `${config.public.apiUrl}/api/admin/users/${id}`,
        {
          method: 'PUT',
          headers: authStore.getAuthHeader(),
          body: updates,
        }
      )

      const index = users.value.findIndex((u) => u.id === id)
      if (index !== -1) {
        users.value[index] = response.user
      }

      if (currentUser.value?.id === id) {
        currentUser.value = response.user
      }

      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to update user'
      console.error('Error updating user:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteUser(id: string) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      await $fetch(`${config.public.apiUrl}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: authStore.getAuthHeader(),
      })

      users.value = users.value.filter((u) => u.id !== id)

      if (currentUser.value?.id === id) {
        currentUser.value = null
      }

      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to delete user'
      console.error('Error deleting user:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    users,
    currentUser,
    loading,
    error,

    // Actions
    fetchAllUsers,
    fetchUserById,
    createUser,
    updateUser,
    deleteUser,
  }
})
