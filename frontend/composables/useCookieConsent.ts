import { ref, computed } from 'vue'

export type CookieConsentStatus = 'pending' | 'accepted' | 'declined'

const CONSENT_KEY = 'cookie-consent'
const CONSENT_DATE_KEY = 'cookie-consent-date'

// Global state
const consentStatus = ref<CookieConsentStatus>('pending')
const consentDate = ref<string | null>(null)
const showBanner = ref(false)

export const useCookieConsent = () => {
  // Check if consent was already given
  const loadConsent = () => {
    if (process.client) {
      const savedConsent = localStorage.getItem(CONSENT_KEY)
      const savedDate = localStorage.getItem(CONSENT_DATE_KEY)

      if (savedConsent === 'accepted' || savedConsent === 'declined') {
        consentStatus.value = savedConsent as CookieConsentStatus
        consentDate.value = savedDate
        showBanner.value = false
      } else {
        showBanner.value = true
      }
    }
  }

  // Save consent choice
  const setConsent = (status: 'accepted' | 'declined') => {
    if (process.client) {
      consentStatus.value = status
      consentDate.value = new Date().toISOString()
      localStorage.setItem(CONSENT_KEY, status)
      localStorage.setItem(CONSENT_DATE_KEY, consentDate.value)
      showBanner.value = false
    }
  }

  // Accept cookies
  const acceptCookies = () => {
    setConsent('accepted')
  }

  // Decline cookies
  const declineCookies = () => {
    setConsent('declined')
  }

  // Reset consent (for testing or user preference changes)
  const resetConsent = () => {
    if (process.client) {
      localStorage.removeItem(CONSENT_KEY)
      localStorage.removeItem(CONSENT_DATE_KEY)
      consentStatus.value = 'pending'
      consentDate.value = null
      showBanner.value = true
    }
  }

  // Computed properties
  const hasConsented = computed(() => consentStatus.value === 'accepted')
  const hasDeclined = computed(() => consentStatus.value === 'declined')
  const isPending = computed(() => consentStatus.value === 'pending')

  return {
    consentStatus,
    consentDate,
    showBanner,
    hasConsented,
    hasDeclined,
    isPending,
    loadConsent,
    acceptCookies,
    declineCookies,
    resetConsent,
  }
}
