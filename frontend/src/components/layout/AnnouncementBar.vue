<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue'
</script>

<template>
  <div class="topbar">
    <div class="topbar-inner">
      <span class="topbar-dot" aria-hidden="true" />
      <span>KfuPet v0.1.7 已发布：新增本地模型、联网搜索与屏幕视觉观察</span>
      <RouterLink to="/#download">
        查看更新内容
        <AppIcon name="arrow" />
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.topbar {
  background: var(--ink);
  color: #f7f2ea;
  font-size: 13px;
}

.topbar-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 9px 24px;
  flex-wrap: wrap;
}

.topbar-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 4px rgba(255, 107, 74, 0.18);
}

.topbar a {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #ffb9a6;
  font-weight: 600;
}

.topbar a:hover {
  color: #fff;
}

.topbar a :deep(.icon) {
  width: 13px;
  height: 13px;
}

@media (max-width: 640px) {
  .topbar-inner {
    padding: 8px 16px;
    font-size: 12px;
    gap: 6px;
  }
}
</style>
