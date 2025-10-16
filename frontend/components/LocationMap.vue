<template>
  <div>
    <div v-if="loading" class="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
        <p class="text-sm text-gray-600">Loading map...</p>
      </div>
    </div>

    <div v-else-if="error" class="p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <div class="flex items-start gap-2 text-gray-600">
        <svg class="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <div>
          <p class="font-medium text-gray-900">{{ address }}</p>
          <p class="text-sm text-gray-500 mt-1">Map not available for this location</p>
        </div>
      </div>
    </div>

    <div v-else-if="coordinates" class="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <div ref="mapContainer" class="h-64 w-full"></div>
      <div class="bg-gray-50 px-3 py-2 text-xs text-gray-600 border-t border-gray-200">
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" class="hover:text-primary-600">
          © OpenStreetMap contributors
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import type L from 'leaflet'

const props = defineProps<{
  address: string
}>()

const mapContainer = ref<HTMLElement | null>(null)
const loading = ref(true)
const error = ref(false)
const coordinates = ref<{ lat: number; lng: number } | null>(null)
const map = ref<L.Map | null>(null)
const marker = ref<L.Marker | null>(null)

// Geocode address using Nominatim
async function geocodeAddress(address: string) {
  try {
    loading.value = true
    error.value = false

    // Use Nominatim for free geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'User-Agent': '1st-Holmer-Green-Cubs-Site',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Geocoding failed')
    }

    const data = await response.json()

    if (data && data.length > 0) {
      coordinates.value = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      }
    } else {
      error.value = true
    }
  } catch (err) {
    console.error('Geocoding error:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

// Initialize map
async function initMap() {
  if (!coordinates.value || !mapContainer.value) {
    console.log('Cannot init map: coordinates or container missing', { coordinates: coordinates.value, container: mapContainer.value })
    return
  }

  console.log('Initializing map with coordinates:', coordinates.value)

  try {
    // Dynamically import leaflet for client-side only
    const L = await import('leaflet')

    // Fix default icon issue with Leaflet in webpack/vite
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })

    // Create map
    map.value = L.map(mapContainer.value).setView(
      [coordinates.value.lat, coordinates.value.lng],
      15
    )

    console.log('Map created successfully')

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.value)

    // Add marker
    marker.value = L.marker([coordinates.value.lat, coordinates.value.lng])
      .addTo(map.value)
      .bindPopup(props.address)
      .openPopup()

    console.log('Map initialized completely')
  } catch (err) {
    console.error('Error initializing map:', err)
    error.value = true
  }
}

// Cleanup
function destroyMap() {
  if (marker.value) {
    marker.value.remove()
    marker.value = null
  }
  if (map.value) {
    map.value.remove()
    map.value = null
  }
}

// Watch for coordinates changes
watch(coordinates, async (newCoords) => {
  if (newCoords) {
    // Wait for the next DOM update cycle so the map container is rendered
    await nextTick()
    await initMap()
  }
})

// Watch for address changes
watch(() => props.address, async (newAddress) => {
  if (newAddress) {
    destroyMap()
    coordinates.value = null
    await geocodeAddress(newAddress)
  }
})

onMounted(async () => {
  if (props.address) {
    await geocodeAddress(props.address)
  }
})

onUnmounted(() => {
  destroyMap()
})
</script>
