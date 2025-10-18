export default defineAppConfig({
  ui: {
    // Color mode configuration
    colorMode: {
      preference: 'system', // Use system preference by default
      fallback: 'light', // Fallback to light mode
      storageKey: 'nuxt-color-mode', // LocalStorage key
      classSuffix: '', // Use 'dark' class instead of 'dark-mode'
    },
  },
})
