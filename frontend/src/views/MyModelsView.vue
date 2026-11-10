<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { NSpin } from 'naive-ui'
import AppIcon from '@/components/ui/AppIcon.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import { listMyModels, type ApiModel, type ModelStatus } from '@/api/models'
import { formatCount, formatDate, formatSize } from '@/utils/format'

const statusLabels: Record<ModelStatus, string> = {
  DRAFT: '草稿',
  PENDING: '待审核',
  REVIEWING: '审核中',
  PUBLISHED: '已发布',
  REJECTED: '已拒绝',
  DELISTED: '已下架',
}

const statusClasses: Record<ModelStatus, string> = {
  DRAFT: 'status-draft',
  PENDING: 'status-pending',
  REVIEWING: 'status-reviewing',
  PUBLISHED: 'status-published',
  REJECTED: 'status-rejected',
  DELISTED: 'status-delisted',
}

const models = ref<ApiModel[]>([])
const loading = ref(true)
const error = ref('')

onMounted(load)

async function load() {
  loading.value = true
  error.value = ''

  try {
    models.value = await listMyModels()
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '加载失败'
    models.value = []
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="container my-container">
      <div class="breadcrumb">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/models">模型包</RouterLink>
        <span>/</span>
        <span>我的模型</span>
      </div>

      <div class="page-head">
        <div>
          <h1>我的模型</h1>
          <p>查看你提交的模型包与审核状态。审核通过后会自动出现在公开列表中。</p>
        </div>
        <RouterLink to="/models/new" class="btn btn-primary">
          <AppIcon name="spark" />
          上传模型包
        </RouterLink>
      </div>

      <NSpin :show="loading">
        <p v-if="error" class="form-error">{{ error }}</p>

        <div v-else-if="!models.length" class="empty-state">
          <p>还没有提交过模型包。</p>
          <RouterLink to="/models/new" class="btn btn-outline empty-action">
            上传第一个模型包
          </RouterLink>
        </div>

        <div v-else class="model-list">
          <article v-for="model in models" :key="model.id" class="panel model-item">
            <div class="item-cover">
              <img
                v-if="model.coverUrl"
                :src="model.coverUrl"
                :alt="`模型包「${model.name}」封面`"
                loading="lazy"
              />
              <div v-else class="cover-fallback"><AppIcon name="paw" /></div>
            </div>

            <div class="item-body">
              <div class="item-head">
                <div class="title-wrap">
                  <h2>{{ model.name }}</h2>
                  <span class="status-badge" :class="statusClasses[model.status]">
                    {{ statusLabels[model.status] }}
                  </span>
                  <span class="cat">{{ model.category.name }}</span>
                </div>

                <RouterLink
                  v-if="model.status === 'PUBLISHED'"
                  :to="`/models/${model.id}`"
                  class="text-link"
                >
                  查看公开页
                  <AppIcon name="arrow" />
                </RouterLink>
              </div>

              <p class="item-summary">{{ model.summary }}</p>

              <div class="item-meta">
                <span class="author">
                  <UserAvatar
                    :name="model.author.name"
                    :avatar-url="model.author.avatarUrl"
                    :seed="model.author.id"
                    size="sm"
                  />
                  {{ model.author.name }}
                </span>
                <span>提交于 {{ formatDate(model.publishedAt) }}</span>
                <span v-if="model.latestVersion">
                  {{ model.latestVersion.version }} · {{ formatSize(model.latestVersion.sizeBytes) }}
                </span>
                <span class="dl">
                  <AppIcon name="download" />
                  {{ formatCount(model.downloads) }}
                </span>
              </div>

              <p v-if="model.status === 'PENDING' || model.status === 'REVIEWING'" class="item-hint">
                正在人工审核中，通常会在 1-2 个工作日内处理完成。
              </p>
              <p v-else-if="model.status === 'REJECTED'" class="item-hint rejected">
                本次提交未通过审核，可以检查内容后重新上传。
              </p>
              <p v-else-if="model.status === 'DELISTED'" class="item-hint rejected">
                该模型包已被下架，公开页面暂时无法访问。
              </p>

              <div class="item-actions">
                <RouterLink
                  v-if="model.status === 'PUBLISHED'"
                  :to="`/models/${model.id}`"
                  class="btn btn-outline"
                >
                  管理版本与下载
                </RouterLink>
                <RouterLink
                  v-else-if="model.status === 'REJECTED' || model.status === 'DELISTED'"
                  to="/models/new"
                  class="btn btn-outline"
                >
                  重新提交
                </RouterLink>
                <RouterLink
                  v-if="model.status !== 'PUBLISHED' && model.status !== 'REJECTED'"
                  to="/models/new"
                  class="btn btn-ghost"
                >
                  再传一个
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
.my-container {
  max-width: 960px;
}

.model-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.model-item {
  display: flex;
  gap: 20px;
  padding: 20px;
}

.item-cover {
  flex: none;
  width: 168px;
  aspect-ratio: 16 / 11;
  border-radius: 13px;
  overflow: hidden;
  background: var(--bg-soft);
}

.item-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-fallback {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: #c7a893;
  background:
    radial-gradient(220px 120px at 70% 0%, rgba(255, 166, 138, 0.4), transparent 70%),
    linear-gradient(135deg, #fdf1e7, #f2e7db);
}

.cover-fallback :deep(.icon) {
  width: 32px;
  height: 32px;
  opacity: 0.75;
}

.item-body {
  flex: 1;
  min-width: 0;
}

.item-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
}

.title-wrap h2 {
  font-size: 18px;
  font-weight: 750;
  letter-spacing: -0.01em;
}

.cat {
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-deep);
  font-size: 11px;
  font-weight: 700;
}

.item-summary {
  margin-top: 8px;
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--muted);
}

.item-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 13px;
  margin-top: 10px;
  font-size: 12px;
  color: #8b8292;
}

.author {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: var(--ink-soft);
}

.dl {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}

.dl :deep(.icon) {
  width: 13px;
  height: 13px;
}

.item-hint {
  margin-top: 10px;
  font-size: 12.5px;
  line-height: 1.7;
  color: #9c6610;
}

.item-hint.rejected {
  color: #b7472a;
}

.item-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
}

.item-actions .btn {
  padding: 8px 15px;
  font-size: 13px;
}

.empty-action {
  margin-top: 16px;
}

@media (max-width: 720px) {
  .model-item {
    flex-direction: column;
  }

  .item-cover {
    width: 100%;
  }
}
</style>
