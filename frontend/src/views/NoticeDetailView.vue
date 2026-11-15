<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { NSpin } from 'naive-ui'
import { useRoute } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import { getNotice, listNotices, type ApiNotice } from '@/api/notices'
import { formatDate } from '@/utils/format'

const route = useRoute()

const notice = ref<ApiNotice | null>(null)
const others = ref<ApiNotice[]>([])
const loading = ref(true)
const error = ref('')

const noticeId = computed(() => String(route.params.id ?? ''))

onMounted(load)
watch(noticeId, load)

async function load() {
  loading.value = true
  error.value = ''
  notice.value = null

  try {
    const [detail, all] = await Promise.all([getNotice(noticeId.value), listNotices()])
    notice.value = detail
    others.value = all.filter((item) => item.id !== detail.id).slice(0, 5)
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '公告加载失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="container notice-container">
      <div class="breadcrumb">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/#notices">站点公告</RouterLink>
        <span>/</span>
        <span>详情</span>
      </div>

      <NSpin :show="loading">
        <div v-if="error" class="empty-state">
          <p>{{ error }}</p>
          <RouterLink to="/" class="btn btn-outline retry-link">返回首页</RouterLink>
        </div>

        <template v-else-if="notice">
          <article class="panel notice-panel">
            <div class="notice-head">
              <span v-if="notice.pinned" class="notice-tag">置顶</span>
              <time>{{ formatDate(notice.publishedAt) }}</time>
            </div>
            <h1>{{ notice.title }}</h1>
            <p class="notice-content">{{ notice.content }}</p>
          </article>

          <section v-if="others.length" class="panel others-panel">
            <h2>其他公告</h2>
            <ul>
              <li v-for="item in others" :key="item.id">
                <RouterLink :to="`/notices/${item.id}`" class="other-link">
                  <span>{{ item.title }}</span>
                  <AppIcon name="arrow" />
                </RouterLink>
                <time>{{ formatDate(item.publishedAt) }}</time>
              </li>
            </ul>
          </section>

          <div class="notice-actions">
            <RouterLink to="/" class="btn btn-outline">返回首页</RouterLink>
          </div>
        </template>
      </NSpin>
    </div>
  </div>
</template>

<style scoped>
.notice-container {
  max-width: 760px;
}

.notice-panel {
  padding: 32px;
}

.notice-head {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #9a918f;
}

.notice-tag {
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--accent);
  color: #fff;
  font-size: 10.5px;
  font-weight: 700;
}

.notice-panel h1 {
  margin-top: 14px;
  font-size: 24px;
  line-height: 1.5;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.notice-content {
  margin-top: 18px;
  font-size: 14.5px;
  line-height: 1.95;
  color: var(--ink-soft);
  white-space: pre-wrap;
  word-break: break-word;
}

.others-panel {
  margin-top: 16px;
  padding: 24px 28px;
}

.others-panel h2 {
  font-size: 15px;
  font-weight: 750;
  margin-bottom: 8px;
}

.others-panel li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid var(--line);
  font-size: 13px;
}

.others-panel li:first-of-type {
  border-top: 0;
}

.other-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--ink-soft);
  font-weight: 600;
}

.other-link:hover {
  color: var(--accent-deep);
}

.other-link :deep(.icon) {
  width: 13px;
  height: 13px;
}

.others-panel time {
  font-size: 11.5px;
  color: #9a918f;
  white-space: nowrap;
}

.notice-actions {
  display: flex;
  margin-top: 18px;
}

.retry-link {
  margin-top: 14px;
}

@media (max-width: 640px) {
  .notice-panel {
    padding: 22px;
  }

  .notice-panel h1 {
    font-size: 20px;
  }
}
</style>
