export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip auth checks during SSR - auth tokens are only available client-side
  if (process.server) {
    return
  }

  const authStore = useAuthStore()

  // Wait for auth initialization to complete
  await authStore.waitForInit()

  // If not authenticated, redirect to login
  if (!authStore.isAuthenticated) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }
})
