// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: ['@pinia/nuxt', '@nuxt/ui'],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: {
        lang: 'en'
      },
      title: '1st Holmer Green Scout Group - Cubs',
      link: [
        { rel: 'icon', type: 'image/jpeg', href: '/assets/scout-logo.jpg' }
      ]
    }
  },

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

  vite: {
    server: {
      hmr: {
        protocol: 'ws',
        host: 'localhost',
      },
    },
    css: {
      devSourcemap: false,
    },
    build: {
      sourcemap: false,
    },
  },

  compatibilityDate: '2024-10-09',

  nitro: {
    preset: 'aws-lambda',
  },
});
