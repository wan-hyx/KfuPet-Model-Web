<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import { parentRouteOf } from '@/router/parents'

const route = useRoute()
const router = useRouter()

const parent = computed(() => parentRouteOf(route.name))

/** 上一个站内页面；直接打开当前页时为 null */
const previousPath = computed(() => {
  void route.fullPath // 路由变化后重新读取历史状态
  const back = window.history.state?.back
  return typeof back === 'string' && back.startsWith('/') ? back : ''
})

const backHref = computed(() => {
  if (previousPath.value) return previousPath.value
  return parent.value ? router.resolve(parent.value.to).href : ''
})

const backLabel = computed(() => {
  if (previousPath.value) return '返回'
  return parent.value ? `返回${parent.value.label}` : ''
})
</script>

<template>
  <div v-if="parent" class="back-bar">
    <div class="container">
      <!-- 使用真实链接：优先返回进入当前页之前的页面，避免复用已冻结的渲染状态 -->
      <a :href="backHref" class="back-link">
        <AppIcon name="arrow" class="back-icon" />
        {{ backLabel }}
      </a>
    </div>
  </div>
</template>

<style scoped>
.back-bar {
  position: relative;
  z-index: 2;
  padding-top: 14px;
  margin-bottom: -38px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 2px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--muted);
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--accent-deep);
}

.back-icon {
  width: 14px;
  height: 14px;
  transform: rotate(180deg);
}
</style>
