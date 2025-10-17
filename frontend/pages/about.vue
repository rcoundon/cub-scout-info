<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const leaders = [
  {
    name: 'Baloo - Jarrod',
    role: 'Cub Scout Leader',
    description: '',
  },
  {
    name: 'Raksha - Danielle',
    role: 'Cub Scout Leader',
    description: '',
  },
  {
    name: 'Rikki - Nick',
    role: 'Cub Scout Leader',
    description: '',
  },
]
</script>

<template>
  <div>
    <!-- Hero Section -->
    <div class="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
      <div class="container mx-auto px-4">
        <div class="max-w-4xl mx-auto text-center">
          <h1 class="text-5xl font-display font-bold mb-4">About Our Cub Scout Pack</h1>
          <p class="text-xl text-primary-100">
            Welcome to our adventurous community where young scouts learn, play, and grow together!
          </p>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-12">
      <!-- About Section -->
      <div class="max-w-4xl mx-auto mb-16">
        <BaseCard>
          <div class="prose prose-lg max-w-none">
            <h2 class="text-3xl font-display font-bold text-gray-900 mb-4">Who We Are</h2>
            <p class="text-gray-700 mb-4">
              Our Scout group is a vibrant community where young people from Beaver Colony (6-8 years),
              Cub Pack (8-10½ years), and Scout Troop (10½-14 years) come together to learn new skills, make friends,
              and have amazing adventures. We're part of the Scouts movement, helping to develop well-rounded
              young people who are prepared to make a positive impact in their communities.
            </p>
            <p class="text-gray-700 mb-4">
              Through a balanced program of indoor and outdoor activities, games, and challenges, our Cubs
              develop important life skills including teamwork, leadership, problem-solving, and resilience.
              Whether it's camping under the stars, learning first aid, or working towards achievement badges,
              every meeting is an opportunity for growth and fun.
            </p>
            <p class="text-gray-700">
              We believe in learning by doing, and our program is designed to be both educational and
              exciting. From traditional scouting skills to modern challenges, we ensure every Cub has
              the chance to try new things and discover their potential.
            </p>
          </div>
        </BaseCard>
      </div>

      <!-- Leaders Section -->
      <div class="max-w-4xl mx-auto mb-16">
        <h2 class="text-3xl font-display font-bold text-gray-900 mb-6 text-center">Meet Our Leaders</h2>
        <div class="grid md:grid-cols-3 gap-6">
          <BaseCard v-for="leader in leaders" :key="leader.name" hover>
            <div class="text-center">
              <div class="w-24 h-24 bg-primary-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg class="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-1">{{ leader.name }}</h3>
              <p class="text-primary-600 font-medium mb-2">{{ leader.role }}</p>
              <p class="text-gray-600 text-sm">{{ leader.description }}</p>
            </div>
          </BaseCard>
        </div>
      </div>

      <!-- What We Do Section -->
      <div class="max-w-4xl mx-auto mb-16">
        <h2 class="text-3xl font-display font-bold text-gray-900 mb-6 text-center">What We Do</h2>
        <div class="grid md:grid-cols-2 gap-6">
          <BaseCard>
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Outdoor Adventures</h3>
                <p class="text-gray-600">Camp outs, hiking, nature exploration, and learning bushcraft skills</p>
              </div>
            </div>
          </BaseCard>

          <BaseCard>
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Badge Work</h3>
                <p class="text-gray-600">Activity badges, challenge badges, and staged activity badges</p>
              </div>
            </div>
          </BaseCard>

          <BaseCard>
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Community Service</h3>
                <p class="text-gray-600">Charity events, environmental projects, and helping others</p>
              </div>
            </div>
          </BaseCard>

          <BaseCard>
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Games & Fun</h3>
                <p class="text-gray-600">Team games, creative activities, and plenty of laughs!</p>
              </div>
            </div>
          </BaseCard>
        </div>
      </div>

      <!-- Useful Resources Section -->
      <div class="max-w-4xl mx-auto mb-16">
        <h2 class="text-3xl font-display font-bold text-gray-900 mb-6 text-center">Useful Resources</h2>
        <BaseCard>
          <div class="space-y-6">
            <p class="text-gray-700 text-center mb-8">
              Quick links to important resources for parents and Cubs
            </p>

            <div class="grid md:grid-cols-2 gap-6">
              <!-- Official Scout Group -->
              <a
                href="https://www.scouts.org.uk/groups/10014446?loc=hp16%200nt&slug=1st-Holmer-Green"
                target="_blank"
                rel="noopener noreferrer"
                class="block group"
              >
                <div class="flex items-start gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-primary-400 transition-all hover:shadow-md">
                  <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary-200 transition-colors">
                    <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <h3 class="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      Official Scout Group Page
                      <svg class="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </h3>
                    <p class="text-gray-600 text-sm">
                      Visit our official page on Scouts.org.uk for group information, policies, and national resources
                    </p>
                  </div>
                </div>
              </a>

              <!-- Online Scout Manager -->
              <a
                href="https://www.onlinescoutmanager.co.uk/login.php"
                target="_blank"
                rel="noopener noreferrer"
                class="block group"
              >
                <div class="flex items-start gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-primary-400 transition-all hover:shadow-md">
                  <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <h3 class="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      Online Scout Manager
                      <svg class="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </h3>
                    <p class="text-gray-600 text-sm">
                      Login to OSM for attendance tracking, badge progress, event bookings, and parent communications
                    </p>
                  </div>
                </div>
              </a>

              <!-- Scouts.org.uk -->
              <a
                href="https://www.scouts.org.uk"
                target="_blank"
                rel="noopener noreferrer"
                class="block group"
              >
                <div class="flex items-start gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-primary-400 transition-all hover:shadow-md">
                  <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <h3 class="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      Scouts UK Homepage
                      <svg class="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </h3>
                    <p class="text-gray-600 text-sm">
                      Explore national Scouts resources, badge requirements, activity ideas, and safety information
                    </p>
                  </div>
                </div>
              </a>

              <!-- Privacy Policy -->
              <NuxtLink
                to="/privacy"
                class="block group"
              >
                <div class="flex items-start gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-primary-400 transition-all hover:shadow-md">
                  <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                    <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <h3 class="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      Privacy Policy
                      <svg class="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </h3>
                    <p class="text-gray-600 text-sm">
                      Information about how we collect, use, and protect your data in compliance with GDPR
                    </p>
                  </div>
                </div>
              </NuxtLink>

              <!-- Fundraising -->
              <a
                href="https://gofundme.com/placeholder"
                target="_blank"
                rel="noopener noreferrer"
                class="block group"
              >
                <div class="flex items-start gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-primary-400 transition-all hover:shadow-md">
                  <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-200 transition-colors">
                    <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <h3 class="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      Fundraising
                      <svg class="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </h3>
                    <p class="text-gray-600 text-sm">
                      Support our pack's activities and help fund adventures, equipment, and special events
                    </p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Join Us CTA -->
      <div class="max-w-4xl mx-auto">
        <BaseCard class="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
          <div class="text-center py-8">
            <h2 class="text-3xl font-display font-bold mb-4">Ready to Join the Adventure?</h2>
            <p class="text-xl text-primary-100 mb-6">
              We're always welcoming new Cubs to our pack!
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <NuxtLink to="/contact">
                <BaseButton variant="secondary" size="lg">
                  Get in Touch
                </BaseButton>
              </NuxtLink>
              <NuxtLink to="/events">
                <BaseButton variant="outline" size="lg" class="border-white text-white hover:bg-white hover:text-primary-600">
                  View Upcoming Events
                </BaseButton>
              </NuxtLink>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>
