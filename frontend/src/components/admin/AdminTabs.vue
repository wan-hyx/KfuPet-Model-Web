<script setup lang="ts">
const tabs = [
  { label: '模型审核', to: '/admin/models' },
  { label: '社区管理', to: '/admin/posts' },
  { label: '用户管理', to: '/admin/users' },
  { label: '举报处理', to: '/admin/reports' },
]
</script>

<template>
  <nav class="admin-tabs" aria-label="管理后台导航">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="admin-tab"
      active-class="active"
    >
      {{ tab.label }}
    </RouterLink>
  </nav>
</template>

<style scoped>
.admin-tabs {
  display: inline-flex;
  gap: 3px;
  padding: 4px;
  margin-bottom: 20px;
  border-radius: 12px;
  background: var(--bg-soft);
  border: 1px solid var(--line);
}

.admin-tab {
  padding: 8px 16px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 650;
  color: var(--muted);
  transition:
    background 0.2s,
    color 0.2s,
    box-shadow 0.2s;
}

.admin-tab:hover {
  color: var(--ink);
}

.admin-tab.active {
  background: #fff;
  color: var(--ink);
  box-shadow: 0 4px 12px -8px rgba(29, 23, 38, 0.4);
}
</style>
