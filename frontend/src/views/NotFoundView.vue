<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue'
</script>

<template>
  <div class="page">
    <div class="container not-found">
      <span class="eyebrow"><span class="dot"></span>404</span>
      <h1>这个页面走丢了</h1>
      <p>链接可能已失效，或者内容已经被移除。去社区或模型包列表看看吧。</p>
      <div class="actions">
        <RouterLink to="/" class="btn btn-primary">返回首页</RouterLink>
        <RouterLink to="/community" class="btn btn-outline">逛逛社区</RouterLink>
        <RouterLink to="/models" class="btn btn-ghost">
          模型包
          <AppIcon name="arrow" />
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 80px 0 120px;
}

.not-found h1 {
  margin-top: 14px;
  font-size: clamp(30px, 4vw, 44px);
  font-weight: 800;
  letter-spacing: -0.03em;
}

.not-found p {
  margin-top: 12px;
  max-width: 440px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--muted);
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 26px;
}
</style>
