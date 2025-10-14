<template>
  <div class="min-h-screen flex flex-col">
    <SessionTimeoutWarning />
    <LayoutHeader />

    <main class="flex-grow">
      <slot />
    </main>

    <LayoutFooter />
  </div>
</template>

<script setup lang="ts">
// Default layout with header and footer
</script>
