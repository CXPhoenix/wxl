<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  verify: (flag: string) => Promise<boolean>
}>()

const flag = ref('')
type State = 'idle' | 'success' | 'failure'
const state = ref<State>('idle')

async function submit() {
  state.value = (await props.verify(flag.value)) ? 'success' : 'failure'
}
</script>

<template>
  <div class="flag-submit">
    <input data-flag-input v-model="flag" type="text" placeholder="CTF{...}" />
    <button data-submit @click="submit">Submit Flag</button>

    <div v-if="state === 'success'" data-success class="flag-success">
      Correct! Challenge solved.
    </div>
    <div v-if="state === 'failure'" data-failure class="flag-failure">
      Incorrect flag. Try again.
    </div>
  </div>
</template>
