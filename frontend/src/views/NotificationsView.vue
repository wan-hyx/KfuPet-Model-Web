<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { NSpin, useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type ApiNotification,
  type NotificationType,
} from '@/api/notifications'
import { relativeTime } from '@/utils/format'

const router = useRouter()
const message = useMessage()

const items = ref<ApiNotification[]>([])
const page = ref(1)
const total = ref(0)
const unreadCount = ref(0)
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')

const hasMore = computed(() => items.value.length < total.value)

const typeLabels: Record<NotificationType, string> = {
  POST_COMMENT: '帖子评论',
  COMMENT_REPLY: '评论回复',
  MODEL_APPROVED: '审核通过',
  MODEL_REJECTED: '审核未通过',
  MODEL_DELISTED: '模型下架',
  MODEL_RESTORED: '模型恢复',
}

onMounted(() => void load(true))

async function load(reset: boolean) {
  if (reset) {
    loading.value = true
    page.value = 1
  } else {
    loadingMore.value = true
  }
  error.value = ''

  try {
    const result = await listNotifications(page.value, 20)
    items.value = reset ? result.items : [...items.value, ...result.items]
    total.value = result.total
    unreadCount.value = result.unreadCount
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '通知加载失败'
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  page.value += 1
  await load(false)
}

async function readAll() {
  if (!unreadCount.value) return

  try {
    await markAllNotificationsRead()
    items.value = items.value.map((item) => ({ ...item, isRead: true }))
    unreadCount.value = 0
    message.success('已全部标记为已读')
  } catch (reason) {
    message.error(reason instanceof Error ? reason.message : '操作失败')
  }
}

async function open(item: ApiNotification) {
  if (!item.isRead) {
    try {
      await markNotificationRead(item.id)
      item.isRead = true
      unreadCount.value = Math.max(unreadCount.value - 1, 0)
    } catch {
      // 标记已读失败不阻塞跳转
    }
  }

  if (item.link) await router.push(item.link)
}
</script>

<template>
  <div class="page">
    <div class="container notifications-container">
      <div class="breadcrumb">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <span>通知</span>
      </div>

      <div class="page-head">
        <div>
          <h1>通知</h1>
          <p>
            共 {{ total }} 条通知
            <template v-if="unreadCount">，其中 {{ unreadCount }} 条未读</template>
          </p>
        </div>
        <button
          type="button"
          class="btn btn-outline"
          :disabled="!unreadCount"
          @click="readAll"
        >
          <AppIcon name="check" />
          全部标为已读
        </button>
      </div>

      <div v-if="loading" class="loading-state"><NSpin /></div>

      <div v-else-if="error" class="empty-state">
        <p>{{ error }}</p>
        <button type="button" class="btn btn-outline" @click="load(true)">重试</button>
      </div>

      <div v-else-if="!items.length" class="empty-state">
        <p>暂时没有通知。评论、回复和模型审核结果会显示在这里。</p>
      </div>

      <template v-else>
        <div class="notification-list">
          <button
            v-for="item in items"
            :key="item.id"
            type="button"
            class="panel notification-item"
            :class="{ unread: !item.isRead }"
            @click="open(item)"
          >
            <span class="notification-dot" aria-hidden="true"></span>
            <span class="notification-main">
              <span class="notification-head">
                <strong>{{ item.title }}</strong>
                <span class="type-badge">{{ typeLabels[item.type] }}</span>
              </span>
              <span class="notification-content">{{ item.content }}</span>
              <span class="notification-time">{{ relativeTime(item.createdAt) }}</span>
            </span>
          </button>
        </div>

        <div v-if="hasMore" class="load-more">
          <button type="button" class="btn btn-outline" :disabled="loadingMore" @click="loadMore">
            {{ loadingMore ? '加载中…' : '加载更多' }}
          </button>
        </div>
        <p v-else class="list-end">没有更多通知了</p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.notifications-container {
  max-width: 820px;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 16px 20px;
  text-align: left;
  transition:
    border-color 0.2s,
    transform 0.15s;
}

.notification-item:hover {
  border-color: #f0b4a3;
  transform: translateY(-1px);
}

.notification-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  margin-top: 7px;
  border-radius: 999px;
  background: transparent;
}

.notification-item.unread {
  background: #fffaf6;
  border-color: #f4d6c9;
}

.notification-item.unread .notification-dot {
  background: var(--accent);
}

.notification-main {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.notification-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.notification-head strong {
  font-size: 14px;
  color: var(--ink);
}

.type-badge {
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--bg-soft);
  color: var(--muted);
  font-size: 10.5px;
  font-weight: 650;
}

.notification-content {
  font-size: 13px;
  color: var(--ink-soft);
  line-height: 1.65;
}

.notification-time {
  font-size: 11.5px;
  color: var(--muted);
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 18px;
}

.list-end {
  margin-top: 18px;
  text-align: center;
  font-size: 12px;
  color: var(--muted);
}

@media (max-width: 640px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
