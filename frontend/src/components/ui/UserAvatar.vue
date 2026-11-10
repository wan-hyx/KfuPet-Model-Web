<script setup lang="ts">
import { computed } from 'vue'
import { initialOf, toneFromId } from '@/utils/format'

const props = withDefaults(
  defineProps<{
    name: string
    avatarUrl?: string | null
    seed?: string
    size?: 'sm' | 'md'
  }>(),
  { avatarUrl: null, seed: '', size: 'md' },
)

const tone = computed(() => toneFromId(props.seed || props.name))
const initial = computed(() => initialOf(props.name))
const sizeClass = computed(() => (props.size === 'sm' ? 'avatar-sm' : ''))
</script>

<template>
  <span
    class="avatar user-avatar"
    :class="[sizeClass, avatarUrl ? 'user-avatar-image' : `av-${tone}`]"
  >
    <img v-if="avatarUrl" :src="avatarUrl" :alt="`${name} 的头像`" loading="lazy" />
    <template v-else>{{ initial }}</template>
  </span>
</template>

<style scoped>
.user-avatar {
  overflow: hidden;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
