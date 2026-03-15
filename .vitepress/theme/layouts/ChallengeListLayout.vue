<script setup lang="ts">
import { withBase } from 'vitepress'

interface ChallengeData {
  title: string
  url: string
  difficulty?: string
  category?: string
}

// Load frontmatter from all challenge markdown files at build time via Vite glob
const frontmatters = import.meta.glob('/docs/challenges/*.md', {
  eager: true,
  import: 'frontmatter',
}) as Record<string, Record<string, unknown>>

const challenges: ChallengeData[] = Object.entries(frontmatters)
  .filter(([path]) => !path.endsWith('/index.md'))
  .map(([path, fm]) => ({
    title: (fm.title as string) ?? '',
    url: withBase(path.replace(/^\/docs/, '').replace(/\.md$/, '').replace(/\/index$/, '/')),
    difficulty: fm.difficulty as string | undefined,
    category: fm.category as string | undefined,
  }))
</script>

<template>
  <div class="challenge-list-page">
    <header class="list-header">
      <h1>Challenges</h1>
      <p class="subtitle">Choose a challenge to begin</p>
    </header>

    <div class="challenge-grid">
      <a
        v-for="c in challenges"
        :key="c.url"
        data-challenge-card
        data-challenge-link
        :href="c.url"
        class="challenge-card"
      >
        <div class="card-title">{{ c.title }}</div>
        <div class="card-meta">
          <span v-if="c.difficulty" class="badge badge-difficulty">{{ c.difficulty }}</span>
          <span v-if="c.category" class="badge badge-category">{{ c.category }}</span>
        </div>
      </a>
    </div>
  </div>
</template>

<style scoped>
.challenge-list-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 40px 24px;
}

.list-header {
  margin-bottom: 32px;
}
.list-header h1 {
  font-size: 2em;
  font-weight: 700;
  margin: 0 0 8px;
}
.subtitle {
  color: var(--vp-c-text-2);
  margin: 0;
}

.challenge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.challenge-card {
  display: block;
  padding: 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  text-decoration: none;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.challenge-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.card-title {
  font-weight: 600;
  font-size: 1.05em;
  margin-bottom: 12px;
}

.card-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75em;
  font-weight: 500;
}
.badge-difficulty { background: var(--vp-c-yellow-soft); color: var(--vp-c-yellow-3); }
.badge-category   { background: var(--vp-c-indigo-soft); color: var(--vp-c-indigo-3); }
</style>
