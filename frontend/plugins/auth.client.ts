export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()

  // Initialize auth state from localStorage on app start
  await authStore.initializeAuth()
})
