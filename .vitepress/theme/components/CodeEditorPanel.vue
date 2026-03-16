<script setup lang="ts">
// Code Editor Panel — placeholder, full implementation in task 9.x
defineProps<{
  slug: string
  dispatch: (request: Request) => Promise<Response>
  disabled?: boolean
}>()
</script>

<template>
  <div class="flex items-center justify-center h-full color-[var(--ch-text-2)]">
    Code editor (loading…)
  </div>
</template>
