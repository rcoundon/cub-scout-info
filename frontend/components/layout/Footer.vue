<template>
  <footer class="bg-gray-900 text-gray-300 mt-auto">
    <div class="container mx-auto px-4 py-12">
      <div class="grid md:grid-cols-4 gap-8">
        <!-- About Section -->
        <div>
          <h3 class="text-white font-display font-semibold text-lg mb-4">
            Cub Scouts
          </h3>
          <p class="text-sm">
            Building character, leadership, and adventure for young scouts in our community.
          </p>
        </div>

        <!-- Quick Links -->
        <div>
          <h4 class="text-white font-semibold mb-4">Quick Links</h4>
          <ul class="space-y-2 text-sm">
            <li>
              <NuxtLink to="/events" class="hover:text-primary-400 transition-colors">
                Events
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/announcements" class="hover:text-primary-400 transition-colors">
                Announcements
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/about" class="hover:text-primary-400 transition-colors">
                About Us
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/contact" class="hover:text-primary-400 transition-colors">
                Contact
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Resources -->
        <div>
          <h4 class="text-white font-semibold mb-4">Resources</h4>
          <ul class="space-y-2 text-sm">
            <li>
              <a href="#" class="hover:text-primary-400 transition-colors">
                Parent Handbook
              </a>
            </li>
            <li>
              <a href="#" class="hover:text-primary-400 transition-colors">
                Safety Guidelines
              </a>
            </li>
            <li>
              <a href="#" class="hover:text-primary-400 transition-colors">
                Forms & Documents
              </a>
            </li>
            <li>
              <a href="#" class="hover:text-primary-400 transition-colors">
                FAQ
              </a>
            </li>
          </ul>
        </div>

        <!-- Contact Info -->
        <div>
          <h4 class="text-white font-semibold mb-4">Contact</h4>
          <ul class="space-y-2 text-sm">
            <li>
              <a href="mailto:info@cubscouts.example" class="hover:text-primary-400 transition-colors">
                info@cubscouts.example
              </a>
            </li>
            <li>
              <a href="tel:+1234567890" class="hover:text-primary-400 transition-colors">
                (123) 456-7890
              </a>
            </li>
          </ul>

          <!-- Social Media -->
          <div class="flex space-x-4 mt-4">
            <a href="#" class="hover:text-primary-400 transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a href="#" class="hover:text-primary-400 transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <!-- Copyright -->
      <div class="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
        <p>&copy; {{ currentYear }} Cub Scout Division. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
</script>
