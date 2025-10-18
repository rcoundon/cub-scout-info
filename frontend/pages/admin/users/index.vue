<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUsersStore } from '~/stores/users'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const usersStore = useUsersStore()
const authStore = useAuthStore()
const searchQuery = ref('')
const roleFilter = ref<'all' | 'admin' | 'editor' | 'viewer'>('all')
const statusFilter = ref<'all' | 'invited' | 'active' | 'expired'>('all')

onMounted(async () => {
  await usersStore.fetchAllUsers()
})

const filteredUsers = computed(() => {
  let users = usersStore.users

  // Filter by role
  if (roleFilter.value !== 'all') {
    users = users.filter(u => u.role === roleFilter.value)
  }

  // Filter by invitation status
  if (statusFilter.value !== 'all') {
    users = users.filter(u => (u.invitation_status || 'active') === statusFilter.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    users = users.filter(u =>
      u.email.toLowerCase().includes(query) ||
      u.first_name.toLowerCase().includes(query) ||
      u.last_name.toLowerCase().includes(query)
    )
  }

  // Sort by last login (most recent first), then by email
  return users.sort((a, b) => {
    if (a.last_login && b.last_login) {
      return new Date(b.last_login).getTime() - new Date(a.last_login).getTime()
    }
    if (a.last_login) return -1
    if (b.last_login) return 1
    return a.email.localeCompare(b.email)
  })
})

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'admin':
      return 'danger'
    case 'editor':
      return 'warning'
    case 'viewer':
      return 'primary'
    default:
      return 'primary'
  }
}

const getInvitationStatusBadge = (status: string | undefined) => {
  switch (status) {
    case 'invited':
      return { variant: 'warning' as const, text: 'Pending Invitation' }
    case 'active':
      return { variant: 'success' as const, text: 'Active' }
    case 'expired':
      return { variant: 'danger' as const, text: 'Invitation Expired' }
    default:
      return { variant: 'success' as const, text: 'Active' }
  }
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const canDeleteUser = (userId: string) => {
  // Can't delete yourself
  return authStore.user?.id !== userId
}

const deleteUser = async (id: string, email: string) => {
  if (!canDeleteUser(id)) {
    alert('You cannot delete your own account')
    return
  }

  if (confirm(`Are you sure you want to delete user "${email}"? This action cannot be undone.`)) {
    const success = await usersStore.deleteUser(id)
    if (success) {
      // User deleted successfully
    }
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">Users</h1>
        <p class="text-gray-600 dark:text-gray-300 mt-1">Manage user accounts and permissions</p>
      </div>
      <NuxtLink to="/admin/users/new">
        <BaseButton variant="primary">
          Invite User
        </BaseButton>
      </NuxtLink>
    </div>

    <!-- Filters -->
    <BaseCard class="mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <BaseInput
            v-model="searchQuery"
            type="text"
            placeholder="Search users by email or name..."
          />
        </div>
        <div class="w-full sm:w-48">
          <select
            v-model="roleFilter"
            class="input"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
        <div class="w-full sm:w-48">
          <select
            v-model="statusFilter"
            class="input"
          >
            <option value="all">All Statuses</option>
            <option value="invited">Pending Invitation</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>
    </BaseCard>

    <!-- Users List -->
    <div v-if="usersStore.loading" class="text-center py-12">
      <p class="text-gray-600 dark:text-gray-300">Loading users...</p>
    </div>

    <div v-else-if="filteredUsers.length === 0" class="text-center py-12">
      <p class="text-gray-600 dark:text-gray-300">No users found</p>
    </div>

    <div v-else class="space-y-4">
      <BaseCard v-for="user in filteredUsers" :key="user.id" :hover="true">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {{ user.first_name }} {{ user.last_name }}
              </h3>
              <BaseBadge :variant="getRoleBadgeVariant(user.role)">
                {{ user.role }}
              </BaseBadge>
              <BaseBadge
                :variant="getInvitationStatusBadge(user.invitation_status).variant"
              >
                {{ getInvitationStatusBadge(user.invitation_status).text }}
              </BaseBadge>
              <BaseBadge v-if="authStore.user?.id === user.id" variant="primary">
                You
              </BaseBadge>
            </div>

            <p class="text-gray-600 dark:text-gray-300 mb-3">{{ user.email }}</p>

            <div class="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Last login: {{ formatDate(user.last_login) }}</span>
              </div>

              <div class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Created {{ formatDate(user.created_at) }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 ml-4">
            <NuxtLink :to="`/admin/users/${user.id}`">
              <BaseButton variant="outline" size="sm">
                Edit
              </BaseButton>
            </NuxtLink>
            <BaseButton
              variant="outline"
              size="sm"
              @click="deleteUser(user.id, user.email)"
              :disabled="!canDeleteUser(user.id)"
            >
              Delete
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
