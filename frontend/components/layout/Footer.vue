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
            <li>
              <NuxtLink to="/help" class="hover:text-primary-400 transition-colors">
                Help
              </NuxtLink>
            </li>
            <li>
              <a href="https://gofundme.com/placeholder" target="_blank" rel="noopener noreferrer" class="hover:text-primary-400 transition-colors">
                Fundraising
              </a>
            </li>
          </ul>
        </div>

        <!-- Useful Links -->
        <div>
          <h4 class="text-white font-semibold mb-4">Useful Links</h4>
          <ul class="space-y-2 text-sm">
            <li>
              <a
                href="https://www.scouts.org.uk/groups/10014446?loc=hp16%200nt&slug=1st-Holmer-Green"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-primary-400 transition-colors flex items-center gap-1"
              >
                Our Scout Group
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </li>
            <li>
              <a
                href="https://www.onlinescoutmanager.co.uk/login.php"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-primary-400 transition-colors flex items-center gap-1"
              >
                Online Scout Manager
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </li>
            <li>
              <a
                href="https://www.scouts.org.uk"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-primary-400 transition-colors flex items-center gap-1"
              >
                Scouts.org.uk
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </li>
          </ul>
        </div>

        <!-- Contact Info -->
        <div>
          <h4 class="text-white font-semibold mb-4">Contact</h4>
          <ul class="space-y-2 text-sm">
            <li>
              <a href="mailto:hello@1stholmergreenscouts.org.uk" class="hover:text-primary-400 transition-colors">
                hello@1stholmergreenscouts.org.uk 
              </a>
            </li>
          </ul>

          <!-- Social Media -->
          <div class="flex space-x-4 mt-4">
            <a href="https://www.facebook.com/groups/1stHolmerGreenScouts" class="hover:text-primary-400 transition-colors" aria-label="Visit our Facebook group" target="_blank" rel="noopener noreferrer">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <!-- Copyright -->
      <div class="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
        <p>&copy; {{ currentYear }} 1st Holmer Green Scout Group. All rights reserved.</p>
        <div class="mt-2 space-x-4">
          <NuxtLink to="/privacy" class="hover:text-primary-400 transition-colors">
            Privacy Policy
          </NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
</script>
