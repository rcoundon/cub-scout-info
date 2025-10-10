<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const leaders = [
  {
    name: 'Akela',
    role: 'Cub Scout Leader',
    description: 'Lead Cub Scout Leader with over 10 years of experience',
  },
  {
    name: 'Baloo',
    role: 'Assistant Cub Scout Leader',
    description: 'Specializes in outdoor activities and camping',
  },
  {
    name: 'Bagheera',
    role: 'Assistant Cub Scout Leader',
    description: 'Focuses on badge work and skill development',
  },
]

const meetingInfo = {
  day: 'Tuesday',
  time: '6:30 PM - 8:00 PM',
  location: 'Scout Hall, Main Street',
  ageRange: '8-10½ years',
}
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
              Our Cub Scout pack is a vibrant community where young people aged {{ meetingInfo.ageRange }}
              come together to learn new skills, make friends, and have amazing adventures. We're part of
              the Scouts movement, helping to develop well-rounded young people who are prepared to make
              a positive impact in their communities.
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

      <!-- Meeting Information -->
      <div class="max-w-4xl mx-auto mb-16">
        <h2 class="text-3xl font-display font-bold text-gray-900 mb-6 text-center">When We Meet</h2>
        <BaseCard class="bg-primary-50 border-primary-200">
          <div class="grid md:grid-cols-2 gap-8">
            <div>
              <div class="flex items-start gap-3 mb-4">
                <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900 mb-1">Day & Time</h3>
                  <p class="text-gray-700">{{ meetingInfo.day }}s</p>
                  <p class="text-gray-700">{{ meetingInfo.time }}</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900 mb-1">Location</h3>
                  <p class="text-gray-700">{{ meetingInfo.location }}</p>
                </div>
              </div>
            </div>

            <div>
              <div class="flex items-start gap-3">
                <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900 mb-1">Age Range</h3>
                  <p class="text-gray-700">{{ meetingInfo.ageRange }}</p>
                  <p class="text-sm text-gray-600 mt-2">
                    Cubs typically attend for 2-3 years before moving up to Scouts
                  </p>
                </div>
              </div>
            </div>
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
