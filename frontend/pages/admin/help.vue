<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const authStore = useAuthStore()
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">Admin Guide</h1>
      <p class="text-gray-600 dark:text-gray-300 mt-1">Complete guide for managing the Cubs Site</p>
    </div>

    <!-- Role Badge -->
    <BaseCard class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-300">You are logged in as:</p>
          <div class="flex items-center gap-3 mt-2">
            <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ authStore.user?.email }}</p>
            <BaseBadge :variant="authStore.user?.role === 'admin' ? 'danger' : authStore.user?.role === 'editor' ? 'warning' : 'primary'">
              {{ authStore.user?.role }}
            </BaseBadge>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Quick Navigation -->
    <BaseCard class="mb-6">
      <h2 class="text-xl font-display font-bold text-gray-900 dark:text-gray-100 mb-4">Quick Navigation</h2>
      <div class="grid md:grid-cols-3 gap-3">
        <a href="#roles" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">→ User Roles</a>
        <a href="#events" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">→ Event Management</a>
        <a href="#announcements" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">→ Announcements</a>
        <a href="#users" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">→ User Management</a>
        <a href="#contact" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">→ Contact Forms</a>
        <a href="#best-practices" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">→ Best Practices</a>
      </div>
    </BaseCard>

    <!-- User Roles -->
    <section id="roles" class="mb-8">
      <h2 class="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 mb-4">User Roles & Permissions</h2>

      <div class="space-y-4">
        <BaseCard>
          <div class="flex items-start gap-3">
            <BaseBadge variant="danger">Admin</BaseBadge>
            <div class="flex-1">
              <p class="font-semibold text-gray-900 dark:text-gray-100 mb-2">Full System Access</p>
              <ul class="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>✅ Create, edit, delete events</li>
                <li>✅ Create, edit, delete announcements</li>
                <li>✅ Manage users (create, edit, delete, change roles)</li>
                <li>✅ View and respond to contact forms</li>
                <li>✅ Upload and manage files</li>
              </ul>
            </div>
          </div>
        </BaseCard>

        <BaseCard>
          <div class="flex items-start gap-3">
            <BaseBadge variant="warning">Editor</BaseBadge>
            <div class="flex-1">
              <p class="font-semibold text-gray-900 dark:text-gray-100 mb-2">Content Management</p>
              <ul class="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>✅ Create, edit, delete events</li>
                <li>✅ Create, edit, delete announcements</li>
                <li>✅ Upload files to events</li>
                <li>❌ Cannot manage users</li>
              </ul>
            </div>
          </div>
        </BaseCard>

        <BaseCard>
          <div class="flex items-start gap-3">
            <BaseBadge variant="primary">Viewer</BaseBadge>
            <div class="flex-1">
              <p class="font-semibold text-gray-900 dark:text-gray-100 mb-2">Read-Only Access</p>
              <ul class="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>✅ View all events and announcements</li>
                <li>✅ View contact forms</li>
                <li>❌ Cannot create or edit content</li>
              </ul>
            </div>
          </div>
        </BaseCard>
      </div>
    </section>

    <!-- Event Management -->
    <section id="events" class="mb-8">
      <h2 class="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 mb-4">Event Management</h2>

      <BaseCard class="mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Creating an Event</h3>
        <ol class="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-4">
          <li>Navigate to <NuxtLink to="/admin/events" class="text-primary-600 dark:text-primary-400 hover:underline">Events</NuxtLink></li>
          <li>Click <strong>Create Event</strong> button</li>
          <li>Fill in event details (title, description, date, location)</li>
          <li>Choose age group (Beavers, Cubs, Scouts, or All)</li>
          <li>Set cost and capacity (optional)</li>
          <li>Select status: Draft, Published, or Cancelled</li>
          <li>Click <strong>Save Event</strong></li>
        </ol>

        <div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Tip: Recurring Events</h4>
          <p class="text-sm text-blue-700 dark:text-blue-200">
            Check "Recurring Event" to create events that repeat weekly or monthly. Set the frequency and end date,
            and the system will create multiple occurrences automatically.
          </p>
        </div>
      </BaseCard>

      <BaseCard class="mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Event Status Reference</h3>
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <BaseBadge variant="warning">Draft</BaseBadge>
            <span class="text-gray-700 dark:text-gray-300">Work in progress - not visible to users</span>
          </div>
          <div class="flex items-center gap-3">
            <BaseBadge variant="success">Published</BaseBadge>
            <span class="text-gray-700 dark:text-gray-300">Live event - visible to all users</span>
          </div>
          <div class="flex items-center gap-3">
            <BaseBadge variant="danger">Cancelled</BaseBadge>
            <span class="text-gray-700 dark:text-gray-300">Event cancelled - shows with strikethrough</span>
          </div>
        </div>
      </BaseCard>

      <BaseCard>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">File Attachments</h3>
        <p class="text-gray-700 dark:text-gray-300 mb-3">Upload files to events (permission forms, maps, etc.):</p>
        <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
          <li><strong>Supported formats:</strong> PDF, JPEG, PNG, DOC, DOCX</li>
          <li><strong>Max file size:</strong> 10MB per file</li>
          <li>Edit event → Scroll to Attachments → Upload File</li>
        </ul>
      </BaseCard>
    </section>

    <!-- Announcements -->
    <section id="announcements" class="mb-8">
      <h2 class="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 mb-4">Announcement Management</h2>

      <BaseCard class="mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Creating an Announcement</h3>
        <ol class="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li>Navigate to <NuxtLink to="/admin/announcements" class="text-primary-600 dark:text-primary-400 hover:underline">Announcements</NuxtLink></li>
          <li>Click <strong>Create Announcement</strong></li>
          <li>Enter title and content</li>
          <li>Select priority level</li>
          <li>Choose visibility and expiry date (optional)</li>
          <li>Click <strong>Save</strong></li>
        </ol>
      </BaseCard>

      <BaseCard>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Priority Levels</h3>
        <div class="space-y-3">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <BaseBadge variant="danger">High Priority</BaseBadge>
              <span class="text-sm text-gray-600 dark:text-gray-300">(Red badge)</span>
            </div>
            <p class="text-sm text-gray-700 dark:text-gray-300 ml-6">Urgent, time-sensitive information or safety notices</p>
          </div>
          <div>
            <div class="flex items-center gap-2 mb-1">
              <BaseBadge variant="warning">Normal Priority</BaseBadge>
              <span class="text-sm text-gray-600 dark:text-gray-300">(Yellow badge)</span>
            </div>
            <p class="text-sm text-gray-700 dark:text-gray-300 ml-6">Regular updates and general information</p>
          </div>
          <div>
            <div class="flex items-center gap-2 mb-1">
              <BaseBadge>Low Priority</BaseBadge>
              <span class="text-sm text-gray-600 dark:text-gray-300">(Green badge)</span>
            </div>
            <p class="text-sm text-gray-700 dark:text-gray-300 ml-6">Optional info, nice-to-know</p>
          </div>
        </div>
      </BaseCard>
    </section>

    <!-- User Management -->
    <section id="users" class="mb-8" v-if="authStore.isAdmin">
      <h2 class="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 mb-4">User Management</h2>

      <div class="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p class="font-semibold text-yellow-900 dark:text-yellow-100">Admin Only</p>
            <p class="text-sm text-yellow-700 dark:text-yellow-200">Only administrators can manage users</p>
          </div>
        </div>
      </div>

      <BaseCard class="mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Creating Users</h3>
        <ol class="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li>Navigate to <NuxtLink to="/admin/users" class="text-primary-600 dark:text-primary-400 hover:underline">Users</NuxtLink></li>
          <li>Click <strong>Create User</strong></li>
          <li>Enter email, name, and assign role</li>
          <li>Set temporary password</li>
          <li>User receives welcome email with login details</li>
        </ol>
      </BaseCard>

      <BaseCard>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Changing User Roles</h3>
        <p class="text-gray-700 dark:text-gray-300 mb-3">To promote or change a user's permissions:</p>
        <ol class="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300">
          <li>Find user in the list</li>
          <li>Click <strong>Edit</strong></li>
          <li>Select new role from dropdown</li>
          <li>Save changes - permissions update immediately</li>
        </ol>
      </BaseCard>
    </section>

    <!-- Contact Forms -->
    <section id="contact" class="mb-8">
      <h2 class="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 mb-4">Contact Form Management</h2>

      <BaseCard class="mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Viewing Submissions</h3>
        <ol class="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li>Navigate to <NuxtLink to="/admin/contact" class="text-primary-600 dark:text-primary-400 hover:underline">Contact</NuxtLink></li>
          <li>See all submissions with sender, subject, and date</li>
          <li>Filter by status (New, Read, Responded)</li>
          <li>Click to read full message</li>
        </ol>
      </BaseCard>

      <BaseCard>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Responding to Messages</h3>
        <ol class="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li>Open the message</li>
          <li>Click <strong>Reply</strong> button</li>
          <li>Compose your response</li>
          <li>Message is sent to submitter's email</li>
          <li>Submission marked as "Responded"</li>
        </ol>
      </BaseCard>
    </section>

    <!-- Best Practices -->
    <section id="best-practices" class="mb-8">
      <h2 class="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 mb-4">Best Practices</h2>

      <div class="space-y-4">
        <BaseCard>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Events</h3>
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <p class="font-medium text-green-700 dark:text-green-400 mb-2">✅ DO</p>
              <ul class="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>• Create events 2+ weeks in advance</li>
                <li>• Include all necessary details</li>
                <li>• Set realistic capacity limits</li>
                <li>• Use clear, descriptive titles</li>
                <li>• Update status if cancelled</li>
              </ul>
            </div>
            <div>
              <p class="font-medium text-red-700 dark:text-red-400 mb-2">❌ DON'T</p>
              <ul class="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>• Delete events with RSVPs</li>
                <li>• Use abbreviations</li>
                <li>• Forget end dates</li>
                <li>• Leave cost blank if charging</li>
              </ul>
            </div>
          </div>
        </BaseCard>

        <BaseCard>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Announcements</h3>
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <p class="font-medium text-green-700 dark:text-green-400 mb-2">✅ DO</p>
              <ul class="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>• Use priority levels appropriately</li>
                <li>• Keep announcements concise</li>
                <li>• Set expiry dates</li>
                <li>• Preview before publishing</li>
              </ul>
            </div>
            <div>
              <p class="font-medium text-red-700 dark:text-red-400 mb-2">❌ DON'T</p>
              <ul class="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>• Mark everything high priority</li>
                <li>• Post redundant information</li>
                <li>• Use all caps</li>
              </ul>
            </div>
          </div>
        </BaseCard>

        <BaseCard>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Security</h3>
          <ul class="text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <li>🔒 Change your password regularly</li>
            <li>🔒 Use strong, unique passwords</li>
            <li>🔒 Log out on shared computers</li>
            <li>🔒 Never share admin credentials</li>
            <li>🔒 Report suspicious activity immediately</li>
          </ul>
        </BaseCard>
      </div>
    </section>

    <!-- Quick Links -->
    <section>
      <BaseCard>
        <h2 class="text-xl font-display font-bold text-gray-900 dark:text-gray-100 mb-4">Quick Admin Links</h2>
        <div class="grid md:grid-cols-2 gap-3">
          <NuxtLink to="/admin/events" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline">
            → Manage Events
          </NuxtLink>
          <NuxtLink to="/admin/announcements" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline">
            → Manage Announcements
          </NuxtLink>
          <NuxtLink to="/admin/users" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline" v-if="authStore.isAdmin">
            → Manage Users
          </NuxtLink>
          <NuxtLink to="/admin/contact" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline">
            → View Contact Forms
          </NuxtLink>
          <NuxtLink to="/help" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline">
            → User Guide
          </NuxtLink>
          <NuxtLink to="/" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline">
            → Back to Website
          </NuxtLink>
        </div>
      </BaseCard>
    </section>
  </div>
</template>
