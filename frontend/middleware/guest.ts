export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip auth checks during SSR - auth tokens are only available client-side
  if (process.server) {
    return
  }

  const authStore = useAuthStore()

  // Wait for auth initialization to complete
  await authStore.waitForInit()

  // If already authenticated, let the login page handle redirect to intended page
  // Don't redirect here, as we want to preserve the redirect query param
  if (authStore.isAuthenticated && to.path === '/login') {
    // Allow the page to load so onMounted can handle redirect with query params
    return
  }

  // For other guest-only pages, redirect authenticated users to home
  if (authStore.isAuthenticated) {
    return navigateTo('/')
  }
})
