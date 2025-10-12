<script setup lang="ts">
definePageMeta({
  layout: 'default',
})
</script>

<template>
  <div>
    <!-- Hero Section -->
    <div class="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
      <div class="container mx-auto px-4">
        <div class="max-w-4xl mx-auto text-center">
          <h1 class="text-5xl font-display font-bold mb-4">User Guide</h1>
          <p class="text-xl text-primary-100">
            Everything you need to know about using the Cubs Site
          </p>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-12">
      <div class="max-w-4xl mx-auto">
        <!-- Table of Contents -->
        <BaseCard class="mb-8">
          <h2 class="text-2xl font-display font-bold text-gray-900 mb-4">Quick Navigation</h2>
          <div class="grid md:grid-cols-2 gap-3">
            <a href="#getting-started" class="text-primary-600 hover:text-primary-700">→ Getting Started</a>
            <a href="#homepage" class="text-primary-600 hover:text-primary-700">→ Homepage</a>
            <a href="#events" class="text-primary-600 hover:text-primary-700">→ Viewing Events</a>
            <a href="#announcements" class="text-primary-600 hover:text-primary-700">→ Announcements</a>
            <a href="#contact" class="text-primary-600 hover:text-primary-700">→ Contact Us</a>
            <a href="#account" class="text-primary-600 hover:text-primary-700">→ Account & Login</a>
            <a href="#calendar" class="text-primary-600 hover:text-primary-700">→ Add to Calendar</a>
            <a href="#mobile" class="text-primary-600 hover:text-primary-700">→ Mobile Access</a>
          </div>
        </BaseCard>

        <!-- Getting Started -->
        <section id="getting-started" class="mb-12">
          <h2 class="text-3xl font-display font-bold text-gray-900 mb-4">Getting Started</h2>
          <BaseCard>
            <p class="text-gray-700 mb-4">
              The Cubs Site is your central hub for all information about our Cubs Scout Group. You can:
            </p>
            <ul class="list-disc list-inside space-y-2 text-gray-700">
              <li>View upcoming events and activities</li>
              <li>Read important announcements</li>
              <li>Contact group leaders</li>
              <li>Add events to your personal calendar</li>
              <li>Learn about our group</li>
            </ul>
          </BaseCard>
        </section>

        <!-- Homepage -->
        <section id="homepage" class="mb-12">
          <h2 class="text-3xl font-display font-bold text-gray-900 mb-4">Homepage</h2>
          <BaseCard>
            <p class="text-gray-700 mb-4">The homepage displays:</p>
            <ul class="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li><strong>Welcome Message:</strong> Information about the Cubs Scout Group</li>
              <li><strong>Upcoming Events:</strong> Quick preview of upcoming activities</li>
              <li><strong>Recent Announcements:</strong> Important notices and updates</li>
              <li><strong>Quick Links:</strong> Easy navigation to key sections</li>
            </ul>

            <h3 class="text-xl font-semibold text-gray-900 mt-6 mb-3">Navigation Menu</h3>
            <p class="text-gray-700">The main navigation menu provides access to:</p>
            <div class="grid md:grid-cols-2 gap-2 mt-3">
              <div class="flex items-center gap-2">
                <span class="text-primary-600">•</span>
                <span class="text-gray-700"><strong>Home:</strong> Return to homepage</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-primary-600">•</span>
                <span class="text-gray-700"><strong>Events:</strong> View all events</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-primary-600">•</span>
                <span class="text-gray-700"><strong>Announcements:</strong> Read announcements</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-primary-600">•</span>
                <span class="text-gray-700"><strong>Contact:</strong> Get in touch</span>
              </div>
            </div>
          </BaseCard>
        </section>

        <!-- Viewing Events -->
        <section id="events" class="mb-12">
          <h2 class="text-3xl font-display font-bold text-gray-900 mb-4">Viewing Events</h2>

          <BaseCard class="mb-4">
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Browsing Events</h3>
            <ol class="list-decimal list-inside space-y-2 text-gray-700">
              <li>Click <strong>Events</strong> in the navigation menu</li>
              <li>View all upcoming events sorted by date</li>
            </ol>
          </BaseCard>

          <BaseCard class="mb-4">
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Event Information</h3>
            <p class="text-gray-700 mb-3">Each event displays:</p>
            <div class="grid md:grid-cols-2 gap-3">
              <div class="flex items-start gap-2">
                <svg class="w-5 h-5 text-primary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-gray-700">Title & Description</span>
              </div>
              <div class="flex items-start gap-2">
                <svg class="w-5 h-5 text-primary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-gray-700">Date & Time</span>
              </div>
              <div class="flex items-start gap-2">
                <svg class="w-5 h-5 text-primary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-gray-700">Location</span>
              </div>
              <div class="flex items-start gap-2">
                <svg class="w-5 h-5 text-primary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-gray-700">Age Group</span>
              </div>
              <div class="flex items-start gap-2">
                <svg class="w-5 h-5 text-primary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-gray-700">Cost</span>
              </div>
              <div class="flex items-start gap-2">
                <svg class="w-5 h-5 text-primary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-gray-700">Recurring Badge</span>
              </div>
            </div>
          </BaseCard>

          <BaseCard>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Filtering Events</h3>
            <p class="text-gray-700 mb-3">Use filters to find specific events:</p>
            <ul class="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>Search:</strong> Find events by name or description</li>
              <li><strong>Age Group:</strong> Filter by Beavers, Cubs, or Scouts</li>
              <li><strong>View Type:</strong> Switch between list and calendar view</li>
            </ul>
          </BaseCard>
        </section>

        <!-- Announcements -->
        <section id="announcements" class="mb-12">
          <h2 class="text-3xl font-display font-bold text-gray-900 mb-4">Announcements</h2>
          <BaseCard>
            <p class="text-gray-700 mb-4">Announcements are color-coded by priority:</p>
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <BaseBadge variant="danger">High Priority</BaseBadge>
                <span class="text-gray-700">Urgent information requiring immediate attention</span>
              </div>
              <div class="flex items-center gap-3">
                <BaseBadge variant="warning">Normal Priority</BaseBadge>
                <span class="text-gray-700">General updates and information</span>
              </div>
              <div class="flex items-center gap-3">
                <BaseBadge>Low Priority</BaseBadge>
                <span class="text-gray-700">Nice-to-know information</span>
              </div>
            </div>
          </BaseCard>
        </section>

        <!-- Contact -->
        <section id="contact" class="mb-12">
          <h2 class="text-3xl font-display font-bold text-gray-900 mb-4">Contact Us</h2>
          <BaseCard>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Using the Contact Form</h3>
            <ol class="list-decimal list-inside space-y-2 text-gray-700 mb-6">
              <li>Navigate to <strong>Contact</strong> in the menu</li>
              <li>Fill in your name, email, subject, and message</li>
              <li>Click <strong>Send Message</strong></li>
              <li>You'll receive a confirmation message</li>
            </ol>

            <div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <h4 class="font-semibold text-primary-900 mb-2">Contact Information</h4>
              <div class="space-y-1 text-primary-800">
                <p><strong>Email:</strong> cubs@example.com</p>
                <p><strong>Phone:</strong> 01234 567890</p>
                <p><strong>Address:</strong> Scout Hut, Parish Piece, HP15 6SP</p>
              </div>
            </div>
          </BaseCard>
        </section>

        <!-- Account & Login -->
        <section id="account" class="mb-12">
          <h2 class="text-3xl font-display font-bold text-gray-900 mb-4">Account & Login</h2>
          <BaseCard>
            <p class="text-gray-700">
              Admin and editor accounts can log in to manage events, announcements, and other site content.
              If you need admin access, contact your group leaders.
            </p>
          </BaseCard>
        </section>

        <!-- Add to Calendar -->
        <section id="calendar" class="mb-12">
          <h2 class="text-3xl font-display font-bold text-gray-900 mb-4">Adding Events to Your Calendar</h2>

          <BaseCard class="mb-4">
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Subscribe to All Events (Recommended)</h3>
            <p class="text-gray-700 mb-3">Get automatic updates when events are added, changed, or cancelled:</p>
            <ol class="list-decimal list-inside space-y-2 text-gray-700 mb-6">
              <li>Go to the <NuxtLink to="/events" class="text-primary-600 hover:underline">Events page</NuxtLink></li>
              <li>Click <strong>Subscribe for Live Updates</strong> button</li>
              <li>Follow the instructions for your calendar app</li>
            </ol>

            <div class="space-y-4">
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 class="font-semibold text-green-900 mb-2">Benefits of Subscribing</h4>
                <ul class="text-sm text-green-700 space-y-1">
                  <li>✅ Events update automatically (usually within 24 hours)</li>
                  <li>✅ Cancelled events are removed automatically</li>
                  <li>✅ New events appear without manual action</li>
                  <li>✅ One-time setup, works forever</li>
                </ul>
              </div>

              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 class="font-semibold text-blue-900 mb-2">Age Group Filtering</h4>
                <p class="text-sm text-blue-700">
                  Select your age groups (Beavers, Cubs, Scouts) on the Events page before subscribing.
                  Your calendar feed will only include events for selected groups.
                </p>
              </div>
            </div>
          </BaseCard>

          <BaseCard>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Add Individual Events</h3>
            <p class="text-gray-700 mb-3">Add a single event without automatic updates:</p>
            <ol class="list-decimal list-inside space-y-2 text-gray-700 mb-4">
              <li>Click on an event to view details</li>
              <li>Scroll to the <strong>Add This Event</strong> section</li>
              <li>Choose either:</li>
            </ol>
            <div class="ml-8 space-y-3 mb-4">
              <div>
                <p class="font-medium text-gray-900">Google Calendar</p>
                <p class="text-sm text-gray-600">Opens Google Calendar with pre-filled event details</p>
              </div>
              <div>
                <p class="font-medium text-gray-900">Other Calendars (.ics)</p>
                <p class="text-sm text-gray-600">Downloads a file you can open with Apple Calendar, Outlook, etc.</p>
              </div>
            </div>
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p class="text-sm text-gray-700">
                <strong>When to use:</strong> You only want specific events, don't want automatic updates,
                or use a calendar app that doesn't support subscriptions
              </p>
            </div>
          </BaseCard>
        </section>

        <!-- Mobile -->
        <section id="mobile" class="mb-12">
          <h2 class="text-3xl font-display font-bold text-gray-900 mb-4">Mobile Access</h2>
          <BaseCard>
            <p class="text-gray-700 mb-4">
              The site is fully responsive and works great on smartphones and tablets.
            </p>
            <div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <h4 class="font-semibold text-primary-900 mb-2">Mobile Features</h4>
              <ul class="list-disc list-inside space-y-1 text-primary-800">
                <li>Navigation menu becomes a hamburger menu (☰)</li>
                <li>Calendar view optimized for touch</li>
                <li>All features remain accessible</li>
                <li>Images and content adjust automatically</li>
              </ul>
            </div>
          </BaseCard>
        </section>

        <!-- Need Help -->
        <section class="mb-12">
          <BaseCard class="bg-primary-600 text-white">
            <h2 class="text-2xl font-display font-bold mb-4">Need More Help?</h2>
            <p class="text-primary-100 mb-4">
              If you have questions not covered in this guide:
            </p>
            <div class="space-y-2">
              <NuxtLink to="/contact" class="block text-white hover:text-primary-100 underline">
                → Contact us using the contact form
              </NuxtLink>
              <a href="/privacy" class="block text-white hover:text-primary-100 underline">
                → Read our Privacy Policy
              </a>
            </div>
          </BaseCard>
        </section>
      </div>
    </div>
  </div>
</template>
