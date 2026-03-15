<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import ChallengeLayout from './layouts/ChallengeLayout.vue'

const { frontmatter } = useData()

const layout = computed(() =>
  frontmatter.value.layout === 'challenge' ? ChallengeLayout : DefaultTheme.Layout
)
</script>

<template>
  <component :is="layout" />
</template>
