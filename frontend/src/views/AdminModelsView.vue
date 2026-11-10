<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { NSpin, useMessage } from 'naive-ui'
import AppIcon from '@/components/ui/AppIcon.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import {
  listAdminModels,
  updateModelStatus,
  type ApiModel,
  type ModelStatus,
} from '@/api/models'
import { formatCount, formatDate, formatSize, relativeTime } from '@/utils/format'

type FilterStatus = 'ALL' | ModelStatus
type Tab = { value: FilterStatus; label: string }

const tabs: Tab[] = [
  { value: 'PENDING', label: '待审核' },
  { value: 'REVIEWING', label: '审核中' },
  { value: 'PUBLISHED', label: '已发布' },
  { value: 'REJECTED', label: '已拒绝' },
  { value: 'DELISTED', label: '已下架' },
  { value: 'ALL', label: '全部' },
]

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

const message = useMessage()
const activeStatus = ref<FilterStatus>('PENDING')
const models = ref<ApiModel[]>([])
const loading = ref(false)
const error = ref('')
const actingId = ref('')
const total = computed(() => models.value.length)

onMounted(load)

async function load() {
  loading.value = true
  error.value = ''

  try {
    models.value = await listAdminModels(
      activeStatus.value === 'ALL' ? undefined : activeStatus.value,
    )
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '审核列表加载失败'
    models.value = []
  } finally {
    loading.value = false
  }
}

function selectStatus(status: FilterStatus) {
  if (activeStatus.value === status) return
  activeStatus.value = status
  void load()
}

async function changeStatus(model: ApiModel, status: ModelStatus, confirmText?: string) {
  if (confirmText && !window.confirm(confirmText)) return

  actingId.value = model.id
  try {
    await updateModelStatus(model.id, status)
    message.success(`已将「${model.name}」更新为${statusLabels[status]}`)
    await load()
  } catch (reason) {
    message.error(reason instanceof Error ? reason.message : '操作失败')
  } finally {
    actingId.value = ''
  }
}

function approve(model: ApiModel) {
  void changeStatus(model, 'PUBLISHED')
}

function reject(model: ApiModel) {
  void changeStatus(model, 'REJECTED', `确定拒绝「${model.name}」吗？`)
}

function delist(model: ApiModel) {
  void changeStatus(model, 'DELISTED', `确定下架「${model.name}」吗？下架后公开页面将无法访问。`)
}

function republish(model: ApiModel) {
  void changeStatus(model, 'PUBLISHED')
}
</script>

<template>
  <div class="page">
    <div class="container admin-container">
      <div class="breadcrumb">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <span>管理后台</span>
        <span>/</span>
        <span>模型审核</span>
      </div>

      <div class="page-head">
        <div>
          <h1>模型包审核</h1>
          <p>审核用户上传的模型包。通过后会立即出现在公开的模型包列表中，拒绝或下架则不会对外展示。</p>
        </div>
        <span class="total-badge">当前列表 {{ total }} 个</span>
      </div>

      <div class="chip-row">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          class="chip"
          :class="{ 'is-active': activeStatus === tab.value }"
          @click="selectStatus(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>

      <NSpin :show="loading">
        <p v-if="error" class="form-error">{{ error }}</p>

        <div v-else-if="!models.length" class="empty-state">
          当前分类下没有模型包。
        </div>

        <div v-else class="review-list">
          <article v-for="model in models" :key="model.id" class="panel review-item">
            <div class="review-cover">
              <img
                v-if="model.coverUrl"
                :src="model.coverUrl"
                :alt="`模型包「${model.name}」封面`"
                loading="lazy"
              />
              <div v-else class="cover-fallback"><AppIcon name="paw" /></div>
            </div>

            <div class="review-body">
              <div class="review-head">
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

              <p class="review-summary">{{ model.summary }}</p>

              <div class="review-meta">
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
                  最新版本 {{ model.latestVersion.version }}
                  · {{ formatSize(model.latestVersion.sizeBytes) }}
                  · {{ relativeTime(model.latestVersion.createdAt) }}
                </span>
                <span v-if="model.tags.length">{{ model.tags.map((tag) => `#${tag}`).join(' ') }}</span>
              </div>

              <div v-if="model.latestVersion" class="version-box">
                <div class="version-box-head">
                  <span>{{ model.latestVersion.version }} 更新日志</span>
                  <span class="downloads">
                    <AppIcon name="download" />
                    {{ formatCount(model.latestVersion.downloads) }}
                  </span>
                </div>
                <p>{{ model.latestVersion.changelog }}</p>
                <p v-if="model.latestVersion.minClientVersion" class="min-client">
                  最低客户端版本：{{ model.latestVersion.minClientVersion }}+
                </p>
                <p class="sha">SHA-256 · {{ model.latestVersion.sha256 }}</p>
              </div>

              <div class="review-actions">
                <template v-if="model.status === 'PENDING' || model.status === 'REVIEWING' || model.status === 'DRAFT'">
                  <button
                    type="button"
                    class="btn btn-primary"
                    :disabled="actingId === model.id"
                    @click="approve(model)"
                  >
                    <AppIcon name="check" />
                    {{ actingId === model.id ? '处理中…' : '通过并发布' }}
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline danger"
                    :disabled="actingId === model.id"
                    @click="reject(model)"
                  >
                    拒绝
                  </button>
                </template>

                <template v-else-if="model.status === 'PUBLISHED'">
                  <button
                    type="button"
                    class="btn btn-outline danger"
                    :disabled="actingId === model.id"
                    @click="delist(model)"
                  >
                    {{ actingId === model.id ? '处理中…' : '下架模型' }}
                  </button>
                </template>

                <template v-else>
                  <button
                    type="button"
                    class="btn btn-primary"
                    :disabled="actingId === model.id"
                    @click="republish(model)"
                  >
                    <AppIcon name="check" />
                    {{ actingId === model.id ? '处理中…' : '重新发布' }}
                  </button>
                </template>
              </div>
            </div>
          </article>
        </div>
      </NSpin>
    </div>
  </div>
</template>

<style scoped>
.admin-container {
  max-width: 1000px;
}

.total-badge {
  padding: 6px 13px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--line);
  font-size: 12.5px;
  font-weight: 650;
  color: var(--ink-soft);
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-item {
  display: flex;
  gap: 20px;
  padding: 20px;
}

.review-cover {
  flex: none;
  width: 180px;
  aspect-ratio: 16 / 11;
  border-radius: 13px;
  overflow: hidden;
  background: var(--bg-soft);
}

.review-cover img {
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
  width: 34px;
  height: 34px;
  opacity: 0.75;
}

.review-body {
  flex: 1;
  min-width: 0;
}

.review-head {
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

.review-summary {
  margin-top: 8px;
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--muted);
}

.review-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
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

.version-box {
  margin-top: 14px;
  padding: 14px 16px;
  border-radius: 13px;
  background: #fffdf9;
  border: 1px dashed var(--line);
}

.version-box-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ink-soft);
}

.downloads {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  color: #8b8292;
}

.downloads :deep(.icon) {
  width: 13px;
  height: 13px;
}

.version-box > p {
  margin-top: 7px;
  font-size: 13px;
  line-height: 1.75;
  color: var(--ink-soft);
  white-space: pre-wrap;
  word-break: break-word;
}

.min-client {
  color: #8b8292 !important;
  font-size: 12px !important;
}

.sha {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 10.5px !important;
  color: #a79e9a !important;
  word-break: break-all;
}

.review-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.review-actions .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.review-actions .danger {
  color: #b7472a;
  border-color: #f0c9bd;
}

.review-actions .danger:hover {
  border-color: #d99b89;
}

@media (max-width: 720px) {
  .review-item {
    flex-direction: column;
  }

  .review-cover {
    width: 100%;
  }
}
</style>
