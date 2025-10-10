export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  // Check if authenticated
  if (!authStore.isAuthenticated) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }

  // Check if editor or admin
  if (!authStore.isEditor) {
    return navigateTo({
      path: '/',
      query: { error: 'unauthorized' },
    })
  }
})
