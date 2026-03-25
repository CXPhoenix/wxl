<script setup lang="ts">
defineProps<{
  title: string
  difficulty: string
  category: string
}>()

defineEmits<{
  close: []
}>()

const difficultyBadge: Record<string, string> = {
  easy: 'ch-badge-easy',
  medium: 'ch-badge-medium',
  hard: 'ch-badge-hard',
  mystery: 'ch-badge-mystery',
}

const categoryBadge: Record<string, string> = {
  web: 'ch-badge-web',
}
</script>

<template>
  <div
    data-description-modal
    class="fixed inset-0 z-50 flex flex-col bg-[var(--ch-bg)] color-[var(--ch-text-1)]"
  >
    <!-- Modal header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--ch-border)] shrink-0">
      <div class="flex items-center gap-2 min-w-0">
        <span class="font-semibold text-[0.9375em] truncate">{{ title }}</span>
        <span
          v-if="difficulty"
          :class="difficultyBadge[difficulty] ?? 'ch-badge'"
        >{{ difficulty }}</span>
        <span
          v-if="category"
          :class="categoryBadge[category] ?? 'ch-badge'"
        >{{ category }}</span>
      </div>
      <button
        data-modal-close
        class="ch-nav-pill-btn text-[0.8125em] shrink-0"
        @click="$emit('close')"
      >✕ 關閉</button>
    </div>

    <!-- Scrollable content area -->
    <div class="vp-doc flex-1 overflow-y-auto p-4">
      <slot />
    </div>

    <!-- Flag submit slot (bottom) -->
    <div class="shrink-0 p-3 border-t border-[var(--ch-border)] bg-[var(--ch-bg)]">
      <slot name="flag-submit" />
    </div>
  </div>
</template>
