<script setup lang="ts">
// wxlsh terminal — placeholder, full implementation in task 8.x
defineProps<{
  slug: string
  dispatch: (request: Request) => Promise<Response>
  disabled?: boolean
}>()
</script>

<template>
  <div class="flex items-center justify-center h-full color-[var(--ch-text-2)]">
    wxlsh terminal (loading…)
  </div>
</template>
