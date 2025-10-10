<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  layout: 'default',
})

const form = ref({
  name: '',
  email: '',
  subject: '',
  message: '',
})

const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const submitted = ref(false)

const validate = () => {
  errors.value = {}
  let isValid = true

  if (!form.value.name.trim()) {
    errors.value.name = 'Name is required'
    isValid = false
  }

  if (!form.value.email.trim()) {
    errors.value.email = 'Email is required'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Please enter a valid email address'
    isValid = false
  }

  if (!form.value.subject.trim()) {
    errors.value.subject = 'Subject is required'
    isValid = false
  }

  if (!form.value.message.trim()) {
    errors.value.message = 'Message is required'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validate()) return

  submitting.value = true

  try {
    const config = useRuntimeConfig()
    await $fetch(`${config.public.apiUrl}/api/contact`, {
      method: 'POST',
      body: {
        name: form.value.name,
        email: form.value.email,
        subject: form.value.subject,
        message: form.value.message,
      },
    })

    // Reset form
    form.value = {
      name: '',
      email: '',
      subject: '',
      message: '',
    }

    submitted.value = true

    // Hide success message after 5 seconds
    setTimeout(() => {
      submitted.value = false
    }, 5000)
  } catch (error: any) {
    errors.value.submit = error.data?.error || 'Failed to send message. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <!-- Hero Section -->
    <div class="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
      <div class="container mx-auto px-4">
        <div class="max-w-4xl mx-auto text-center">
          <h1 class="text-5xl font-display font-bold mb-4">Get in Touch</h1>
          <p class="text-xl text-primary-100">
            Have questions or want to join our pack? We'd love to hear from you!
          </p>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-12">
      <div class="max-w-4xl mx-auto">
        <div class="grid md:grid-cols-2 gap-8 mb-12">
          <!-- Contact Information -->
          <div>
            <h2 class="text-2xl font-display font-bold text-gray-900 mb-6">Contact Information</h2>
            <div class="space-y-4">
              <BaseCard>
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-900 mb-1">Email</h3>
                    <a href="mailto:cubs@example.com" class="text-primary-600 hover:text-primary-700">
                      cubs@example.com
                    </a>
                  </div>
                </div>
              </BaseCard>

              <BaseCard>
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-900 mb-1">Phone</h3>
                    <a href="tel:01234567890" class="text-primary-600 hover:text-primary-700">
                      01234 567890
                    </a>
                  </div>
                </div>
              </BaseCard>

              <BaseCard>
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-900 mb-1">Address</h3>
                    <p class="text-gray-700">
                      Scout Hall<br>
                      Main Street<br>
                      Townsville
                    </p>
                  </div>
                </div>
              </BaseCard>

              <BaseCard>
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-900 mb-1">Meeting Times</h3>
                    <p class="text-gray-700">
                      Tuesdays<br>
                      6:30 PM - 8:00 PM
                    </p>
                  </div>
                </div>
              </BaseCard>
            </div>
          </div>

          <!-- Contact Form -->
          <div>
            <h2 class="text-2xl font-display font-bold text-gray-900 mb-6">Send Us a Message</h2>

            <!-- Success Message -->
            <div
              v-if="submitted"
              class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
            >
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p class="font-semibold text-green-900">Message sent successfully!</p>
                  <p class="text-sm text-green-700">We'll get back to you as soon as possible.</p>
                </div>
              </div>
            </div>

            <BaseCard>
              <form @submit.prevent="handleSubmit" class="space-y-6">
                <BaseInput
                  v-model="form.name"
                  label="Your Name"
                  placeholder="John Smith"
                  :error="errors.name"
                  :required="true"
                />

                <BaseInput
                  v-model="form.email"
                  type="email"
                  label="Email Address"
                  placeholder="john@example.com"
                  :error="errors.email"
                  :required="true"
                />

                <BaseInput
                  v-model="form.subject"
                  label="Subject"
                  placeholder="Joining Cubs / General Enquiry"
                  :error="errors.subject"
                  :required="true"
                />

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Message <span class="text-red-500">*</span>
                  </label>
                  <textarea
                    v-model="form.message"
                    rows="6"
                    class="input"
                    placeholder="Tell us about your enquiry..."
                    :class="{ 'border-red-500': errors.message }"
                  />
                  <p v-if="errors.message" class="mt-1 text-sm text-red-600">
                    {{ errors.message }}
                  </p>
                </div>

                <!-- Error Message -->
                <div
                  v-if="errors.submit"
                  class="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
                >
                  {{ errors.submit }}
                </div>

                <BaseButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  :loading="submitting"
                  class="w-full"
                >
                  {{ submitting ? 'Sending...' : 'Send Message' }}
                </BaseButton>
              </form>
            </BaseCard>
          </div>
        </div>

        <!-- FAQ Section -->
        <div class="mt-16">
          <h2 class="text-3xl font-display font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div class="grid md:grid-cols-2 gap-6">
            <BaseCard>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">How do I join Cubs?</h3>
              <p class="text-gray-600">
                Get in touch using the form above or come visit us during our Tuesday meetings. We'll arrange a chat
                and a trial session for your child to see if Cubs is right for them.
              </p>
            </BaseCard>

            <BaseCard>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">What age do Cubs start?</h3>
              <p class="text-gray-600">
                Cubs is for young people aged 8 to 10½ years old. After Cubs, they move up to Scouts.
              </p>
            </BaseCard>

            <BaseCard>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">What should my child bring?</h3>
              <p class="text-gray-600">
                Just themselves and a willingness to have fun! For specific activities, we'll let you know in advance
                if any special equipment is needed.
              </p>
            </BaseCard>

            <BaseCard>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">How much does it cost?</h3>
              <p class="text-gray-600">
                We charge a small weekly subscription to cover running costs. Additional costs may apply for camps
                and special trips. Contact us for current pricing.
              </p>
            </BaseCard>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
