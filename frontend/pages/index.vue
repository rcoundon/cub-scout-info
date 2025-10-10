<script setup lang="ts">
definePageMeta({
  layout: 'default',
})
</script>

<template>
  <div class="bg-gradient-to-br from-primary-50 to-secondary-50">
    <!-- Hero Section -->
    <div class="container mx-auto px-4 py-16">
      <div class="text-center mb-12">
        <h1 class="text-5xl md:text-6xl font-display font-bold text-primary-900 mb-4">
          Cub Scout Division
        </h1>
        <p class="text-xl text-gray-700 mb-8">
          Welcome to the Cub Scout events and information portal
        </p>
        <div class="flex gap-4 justify-center">
          <NuxtLink to="/events">
            <button class="btn-primary">View Events</button>
          </NuxtLink>
          <NuxtLink to="/about">
            <button class="btn-outline">Learn More</button>
          </NuxtLink>
        </div>
      </div>

      <!-- Feature Cards -->
      <div class="grid md:grid-cols-3 gap-6 mt-16">
        <NuxtLink to="/events" class="block">
          <div class="card-hover p-6 h-full">
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-2">Upcoming Events</h3>
            <p class="text-gray-600">
              Stay updated with all Cubs activities, camps, and special events
            </p>
          </div>
        </NuxtLink>

        <NuxtLink to="/announcements" class="block">
          <div class="card-hover p-6 h-full">
            <div class="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-2">Announcements</h3>
            <p class="text-gray-600">
              Important updates and news for Cubs families
            </p>
          </div>
        </NuxtLink>

        <NuxtLink to="/about" class="block">
          <div class="card-hover p-6 h-full">
            <div class="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-2">Resources</h3>
            <p class="text-gray-600">
              Access forms, guides, and important documents
            </p>
          </div>
        </NuxtLink>
      </div>

      <!-- Status Badges Demo -->
      <div class="mt-16 text-center">
        <h2 class="text-3xl font-display font-semibold mb-6">Design System Preview</h2>
        <div class="flex gap-3 justify-center flex-wrap">
          <span class="badge-primary">Primary Badge</span>
          <span class="badge-secondary">Secondary Badge</span>
          <span class="badge-accent">Accent Badge</span>
        </div>
      </div>
    </div>
  </div>
</template>
