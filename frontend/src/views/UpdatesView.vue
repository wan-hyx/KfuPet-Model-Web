<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { NSpin } from 'naive-ui'
import AppIcon from '@/components/ui/AppIcon.vue'
import { listModelUpdates, type ApiModelUpdate } from '@/api/models'
import { formatDate, relativeTime } from '@/utils/format'

const updates = ref<ApiModelUpdate[]>([])
const loading = ref(true)
const error = ref('')

onMounted(load)

async function load() {
  loading.value = true
  error.value = ''

  try {
    updates.value = await listModelUpdates(100)
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '更新日志加载失败'
    updates.value = []
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="container updates-container">
      <div class="breadcrumb">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <span>更新日志</span>
      </div>

      <div class="page-head">
        <div>
          <span class="eyebrow"><span class="dot"></span>Model Updates</span>
          <h1>模型包更新日志</h1>
          <p>所有已发布模型包的新版本记录，按发布时间从新到旧排列。</p>
        </div>
        <RouterLink to="/models" class="btn btn-outline">
          浏览全部模型包
          <AppIcon name="arrow" />
        </RouterLink>
      </div>

      <NSpin :show="loading">
        <p v-if="error" class="form-error">{{ error }}</p>

        <div v-else-if="!updates.length" class="empty-state">
          <p>暂时还没有版本更新记录。</p>
        </div>

        <div v-else class="update-list">
          <article v-for="update in updates" :key="update.id" class="panel update-item">
            <RouterLink :to="`/models/${update.modelId}`" class="up-cover">
              <img
                v-if="update.coverUrl"
                :src="update.coverUrl"
                :alt="`模型包「${update.name}」封面`"
                loading="lazy"
              />
              <span v-else class="cover-fallback"><AppIcon name="paw" /></span>
            </RouterLink>

            <div class="up-body">
              <div class="up-head">
                <RouterLink :to="`/models/${update.modelId}`" class="up-name">
                  {{ update.name }}
                </RouterLink>
                <span class="up-version">{{ update.version }}</span>
                <span class="up-time">{{ relativeTime(update.createdAt) }}</span>
              </div>
              <p class="up-note">{{ update.note }}</p>
              <div class="up-foot">
                <span>{{ formatDate(update.createdAt) }}</span>
                <RouterLink :to="`/models/${update.modelId}`" class="text-link">
                  查看模型
                  <AppIcon name="arrow" />
                </RouterLink>
              </div>
            </div>
          </article>
        </div>
      </NSpin>
    </div>
  </div>
</template>

<style scoped>
.updates-container {
  max-width: 900px;
}

.update-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.update-item {
  display: flex;
  gap: 16px;
  padding: 18px 20px;
}

.up-cover {
  width: 68px;
  height: 68px;
  border-radius: 14px;
  overflow: hidden;
  background: var(--bg-soft);
  flex: none;
}

.up-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--accent-deep);
}

.up-body {
  min-width: 0;
  flex: 1;
}

.up-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.up-name {
  font-size: 15px;
  font-weight: 750;
  color: var(--ink);
}

.up-name:hover {
  color: var(--accent-deep);
}

.up-version {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-deep);
  font-size: 11px;
  font-weight: 700;
}

.up-time {
  margin-left: auto;
  font-size: 11.5px;
  color: #9a918f;
}

.up-note {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.75;
  color: var(--ink-soft);
  white-space: pre-wrap;
  word-break: break-word;
}

.up-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
  font-size: 12px;
  color: #9a918f;
}

@media (max-width: 640px) {
  .update-item {
    padding: 16px;
  }

  .up-cover {
    width: 54px;
    height: 54px;
  }
}
</style>
