export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  // Check if authenticated
  if (!authStore.isAuthenticated) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }

  // Check if admin
  if (!authStore.isAdmin) {
    return navigateTo({
      path: '/',
      query: { error: 'unauthorized' },
    })
  }
})
