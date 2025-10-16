import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'editor' | 'viewer'
  last_login?: string
}

interface AuthTokens {
  accessToken: string
  refreshToken: string
  idToken: string
}

interface NewPasswordChallenge {
  challengeName: 'NEW_PASSWORD_REQUIRED'
  session: string
  username: string
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const tokens = ref<AuthTokens | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const rememberMe = ref(false)
  const tokenExpiry = ref<number | null>(null) // Unix timestamp in milliseconds
  const sessionTimeoutWarning = ref(false)
  const initialized = ref(false) // Track if auth has been initialized from storage

  // Promise that resolves when initialization is complete
  // Create immediately so middleware can await it
  let initResolve: (() => void) | null = null
  const initPromise = new Promise<void>((resolve) => {
    initResolve = resolve
  })
  let initStarted = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!user.value && !!tokens.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isEditor = computed(() => user.value?.role === 'editor' || isAdmin.value)
  const accessToken = computed(() => tokens.value?.accessToken || null)
  const isTokenExpiringSoon = computed(() => {
    if (!tokenExpiry.value) return false
    const timeUntilExpiry = tokenExpiry.value - Date.now()
    return timeUntilExpiry < 5 * 60 * 1000 // Less than 5 minutes
  })

  // Helper: Get storage (localStorage or sessionStorage)
  function getStorage() {
    if (!process.client) return null
    return rememberMe.value ? localStorage : sessionStorage
  }

  // Helper: Save tokens to storage
  function saveTokensToStorage(tokensData: AuthTokens) {
    const storage = getStorage()
    if (storage) {
      storage.setItem('auth_tokens', JSON.stringify(tokensData))
      storage.setItem('remember_me', rememberMe.value.toString())

      // Calculate token expiry (Cognito access tokens expire in 1 hour)
      const expiryTime = Date.now() + (60 * 60 * 1000) // 1 hour from now
      tokenExpiry.value = expiryTime
      storage.setItem('token_expiry', expiryTime.toString())
    }
  }

  // Helper: Clear tokens from storage
  function clearTokensFromStorage() {
    if (!process.client) return

    // Clear from both storages
    localStorage.removeItem('auth_tokens')
    localStorage.removeItem('remember_me')
    localStorage.removeItem('token_expiry')
    sessionStorage.removeItem('auth_tokens')
    sessionStorage.removeItem('remember_me')
    sessionStorage.removeItem('token_expiry')
  }

  // Actions
  async function login(email: string, password: string, remember = false) {
    loading.value = true
    error.value = null
    rememberMe.value = remember

    try {
      const config = useRuntimeConfig()
      const response = await $fetch<
        ({ success: boolean } & AuthTokens) | NewPasswordChallenge
      >(`${config.public.apiUrl}/api/auth/login`, {
        method: 'POST',
        body: { email, password },
      })

      // Check if password change is required
      if ('challengeName' in response && response.challengeName === 'NEW_PASSWORD_REQUIRED') {
        return {
          requiresPasswordChange: true,
          session: response.session,
          username: response.username,
        }
      }

      if ('success' in response && response.success) {
        tokens.value = {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          idToken: response.idToken,
        }

        // Store tokens
        saveTokensToStorage(tokens.value)

        // Fetch user profile
        await fetchUserProfile()

        // Start session monitoring
        startSessionMonitoring()

        return { requiresPasswordChange: false }
      }

      return { requiresPasswordChange: false, error: 'Login failed' }
    } catch (err: any) {
      error.value = err.data?.message || 'Login failed'
      return { requiresPasswordChange: false, error: err.data?.message || 'Login failed' }
    } finally {
      loading.value = false
    }
  }

  async function completeNewPassword(username: string, newPassword: string, session: string) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      const response = await $fetch<{ success: boolean } & AuthTokens>(
        `${config.public.apiUrl}/api/auth/complete-new-password`,
        {
          method: 'POST',
          body: { username, newPassword, session },
        }
      )

      if (response.success) {
        tokens.value = {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          idToken: response.idToken,
        }

        // Store tokens
        saveTokensToStorage(tokens.value)

        // Fetch user profile
        await fetchUserProfile()

        // Start session monitoring
        startSessionMonitoring()

        return true
      }

      return false
    } catch (err: any) {
      error.value = err.data?.message || 'Password change failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function fetchUserProfile() {
    if (!tokens.value) return

    try {
      const config = useRuntimeConfig()
      console.log('Fetching user profile with token:', tokens.value.accessToken.substring(0, 20) + '...')
      const response = await $fetch<User>(
        `${config.public.apiUrl}/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${tokens.value.accessToken}`,
          },
        }
      )
      user.value = response
    } catch (err: any) {
      console.error('Failed to fetch user profile:', err)
      console.error('Error details:', err.data || err.message)

      // If 401, try to refresh token
      if (err.status === 401) {
        const refreshed = await refreshTokens()
        if (refreshed) {
          // Retry fetching profile
          return fetchUserProfile()
        }
      }

      // If token is invalid or refresh failed, clear auth state
      logout()
    }
  }

  async function refreshTokens() {
    if (!tokens.value?.refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const config = useRuntimeConfig()
      const response = await $fetch<{ success: boolean; accessToken: string; idToken: string }>(
        `${config.public.apiUrl}/api/auth/refresh`,
        {
          method: 'POST',
          body: { refreshToken: tokens.value.refreshToken },
        }
      )

      if (response.success) {
        tokens.value = {
          accessToken: response.accessToken,
          idToken: response.idToken,
          refreshToken: tokens.value.refreshToken, // Keep existing refresh token
        }

        // Update storage
        saveTokensToStorage(tokens.value)

        // Reset session timeout warning
        sessionTimeoutWarning.value = false

        return true
      }

      return false
    } catch (err: any) {
      console.error('Token refresh failed:', err)
      // If refresh fails, logout
      logout()
      return false
    }
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    if (!tokens.value) return false

    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      await $fetch(`${config.public.apiUrl}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.value.accessToken}`,
        },
        body: {
          currentPassword,
          newPassword,
        },
      })

      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Password change failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function forgotPassword(email: string) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      await $fetch(`${config.public.apiUrl}/api/auth/forgot-password`, {
        method: 'POST',
        body: { email },
      })

      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Password reset request failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function resetPassword(email: string, code: string, newPassword: string) {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()
      await $fetch(`${config.public.apiUrl}/api/auth/reset-password`, {
        method: 'POST',
        body: {
          email,
          code,
          newPassword,
        },
      })

      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Password reset failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    if (tokens.value) {
      try {
        const config = useRuntimeConfig()
        await $fetch(`${config.public.apiUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokens.value.accessToken}`,
          },
        })
      } catch (err) {
        console.error('Logout API call failed:', err)
      }
    }

    // Clear local state
    user.value = null
    tokens.value = null
    error.value = null
    tokenExpiry.value = null
    sessionTimeoutWarning.value = false
    // Don't reset initialized flag - we're still initialized, just not authenticated

    // Clear storage
    clearTokensFromStorage()

    // Stop session monitoring
    stopSessionMonitoring()
  }

  async function initializeAuth() {
    // Prevent multiple initializations
    if (initStarted.value) {
      return
    }
    initStarted.value = true

    if (!process.client) {
      initialized.value = true
      if (initResolve) initResolve()
      return
    }

    try {
      // Check both localStorage and sessionStorage
      const localTokens = localStorage.getItem('auth_tokens')
      const sessionTokens = sessionStorage.getItem('auth_tokens')
      const rememberMeFlag = localStorage.getItem('remember_me') || sessionStorage.getItem('remember_me')
      const storedExpiry = localStorage.getItem('token_expiry') || sessionStorage.getItem('token_expiry')

      const storedTokens = localTokens || sessionTokens

      if (storedTokens) {
        try {
          rememberMe.value = rememberMeFlag === 'true'
          tokens.value = JSON.parse(storedTokens)

          if (storedExpiry) {
            tokenExpiry.value = parseInt(storedExpiry, 10)

            // Check if token is expired
            if (Date.now() >= tokenExpiry.value) {
              console.log('Token expired, attempting refresh...')
              const refreshed = await refreshTokens()
              if (!refreshed) {
                logout()
                return
              }
            }
          }

          await fetchUserProfile()

          // Start session monitoring
          startSessionMonitoring()
        } catch (err) {
          console.error('Failed to restore auth state:', err)
          logout()
        }
      }
    } finally {
      // Mark as initialized whether tokens were found or not
      initialized.value = true
      if (initResolve) initResolve()
    }
  }

  // Helper to wait for initialization
  async function waitForInit() {
    if (initialized.value) {
      return
    }

    // If initialization hasn't started yet, start it
    if (!initStarted.value) {
      initializeAuth() // Don't await - we'll await the promise below
    }

    await initPromise
  }

  function getAuthHeader(): Record<string, string> {
    if (!tokens.value) {
      return {} as Record<string, string>
    }

    return {
      Authorization: `Bearer ${tokens.value.accessToken}`,
    }
  }

  // Session monitoring
  let sessionCheckInterval: NodeJS.Timeout | null = null

  function startSessionMonitoring() {
    if (!process.client) return

    // Clear any existing interval
    stopSessionMonitoring()

    // Check session every minute
    sessionCheckInterval = setInterval(() => {
      if (!tokenExpiry.value) return

      const timeUntilExpiry = tokenExpiry.value - Date.now()

      // Show warning 5 minutes before expiry
      if (timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000) {
        sessionTimeoutWarning.value = true
      }

      // Auto-refresh if token expires in less than 10 minutes
      if (timeUntilExpiry > 0 && timeUntilExpiry < 10 * 60 * 1000) {
        console.log('Token expiring soon, auto-refreshing...')
        refreshTokens()
      }

      // Token expired, logout
      if (timeUntilExpiry <= 0) {
        console.log('Token expired, logging out...')
        logout()
      }
    }, 60 * 1000) // Check every minute
  }

  function stopSessionMonitoring() {
    if (sessionCheckInterval) {
      clearInterval(sessionCheckInterval)
      sessionCheckInterval = null
    }
  }

  return {
    // State
    user,
    tokens,
    loading,
    error,
    rememberMe,
    tokenExpiry,
    sessionTimeoutWarning,
    initialized,

    // Getters
    isAuthenticated,
    isAdmin,
    isEditor,
    accessToken,
    isTokenExpiringSoon,

    // Actions
    login,
    completeNewPassword,
    logout,
    refreshTokens,
    changePassword,
    forgotPassword,
    resetPassword,
    fetchUserProfile,
    initializeAuth,
    waitForInit,
    getAuthHeader,
  }
})
