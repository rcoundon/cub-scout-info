// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3001',
      userPoolId: process.env.NUXT_PUBLIC_USER_POOL_ID || '',
      userPoolClientId: process.env.NUXT_PUBLIC_USER_POOL_CLIENT_ID || '',
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  compatibilityDate: '2024-10-09',
});
