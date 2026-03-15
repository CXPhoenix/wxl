<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ slug: string }>()

type Tab = 'browser' | 'terminal' | 'repeater'
const activeTab = ref<Tab>('browser')

const tabs: { id: Tab; label: string }[] = [
  { id: 'browser', label: 'Browser' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'repeater', label: 'Repeater' },
]

const browserUrl = ref(`https://challenge-${props.slug}.localhost/`)
</script>

<template>
  <div class="challenge-layout">
    <nav class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :data-tab="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div v-show="activeTab === 'browser'" :data-panel="'browser'" class="panel">
      <input data-url v-model="browserUrl" type="text" placeholder="URL" />
      <slot name="browser" />
    </div>

    <div v-show="activeTab === 'terminal'" :data-panel="'terminal'" class="panel">
      <slot name="terminal" />
    </div>

    <div v-show="activeTab === 'repeater'" :data-panel="'repeater'" class="panel">
      <slot name="repeater" />
    </div>
  </div>
</template>
