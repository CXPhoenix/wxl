<script setup lang="ts">
import { withBase } from 'vitepress'

interface ChallengeData {
  id: number
  title: string
  url: string
  difficulty?: string
  category?: string
}

const props = defineProps<{
  challenges: ChallengeData[]
}>()

const challenges: ChallengeData[] = [...props.challenges].sort((a, b) => {
  if (a.id === b.id) {
    const difficulties = ['easy', 'medium', 'hard', 'mystery']
    const findDifficulty = (c: ChallengeData) => difficulties.findIndex((v) => v === c.difficulty)
    return findDifficulty(a) - findDifficulty(b)
  }
  return a.id - b.id
})

// Static badge class maps (full class names required for UnoCSS extraction)
const difficultyBadge: Record<string, string> = {
  easy:    'ch-badge-easy',
  medium:  'ch-badge-medium',
  hard:    'ch-badge-hard',
  mystery: 'ch-badge-mystery',
}
const categoryBadge: Record<string, string> = {
  web: 'ch-badge-web',
}

function paddedId(id: number): string {
  return `#${String(id).padStart(3, '0')}`
}
</script>

<template>
  <div class="max-w-[960px] mx-auto px-6 py-10">
    <header class="mb-8">
      <h1 class="text-[2em] font-bold m-0 mb-2 color-[var(--ch-text-1)]">Challenges</h1>
      <p class="m-0 color-[var(--ch-text-2)]">Choose a challenge to begin</p>
    </header>

    <div class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
      <a
        v-for="c in challenges"
        :key="c.url"
        data-challenge-card
        data-challenge-link
        :href="withBase(c.url)"
        :class="['ch-card', 'before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:rounded-t-[10px] before:bg-[var(--ch-accent)] before:opacity-0 before:transition-opacity before:duration-200 hover:before:opacity-100']"
      >
        <div class="flex items-center gap-2 mb-3">
          <span class="font-mono text-[0.75em] color-[var(--ch-accent)] font-bold">{{ paddedId(c.id) }}</span>
          <span class="font-semibold text-[1.05em] color-[var(--ch-text-1)]">{{ c.title }}</span>
        </div>
        <div class="flex gap-[6px] flex-wrap">
          <span
            v-if="c.difficulty"
            :class="difficultyBadge[c.difficulty] ?? 'ch-badge'"
          >{{ c.difficulty }}</span>
          <span
            v-if="c.category"
            :class="categoryBadge[c.category] ?? 'ch-badge'"
          >{{ c.category }}</span>
        </div>
      </a>
    </div>
  </div>
</template>
