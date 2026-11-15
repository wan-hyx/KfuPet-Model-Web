<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NSpin } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import { searchAll, type SearchResult } from '@/api/search'
import { formatCount, formatDate } from '@/utils/format'

const route = useRoute()
const router = useRouter()

const keyword = ref('')
const result = ref<SearchResult | null>(null)
const loading = ref(false)
const error = ref('')

const hasResults = computed(() => {
  if (!result.value) return false
  return (
    result.value.posts.length > 0 ||
    result.value.models.length > 0 ||
    result.value.users.length > 0 ||
    result.value.tags.length > 0
  )
})

watch(
  () => route.query.q,
  (value) => {
    keyword.value = typeof value === 'string' ? value : ''
    void run(keyword.value)
  },
  { immediate: true },
)

async function run(raw: string) {
  const q = raw.trim()
  if (!q) {
    result.value = null
    error.value = ''
    return
  }

  loading.value = true
  error.value = ''

  try {
    result.value = await searchAll(q, 8)
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '搜索失败，请稍后重试'
    result.value = null
  } finally {
    loading.value = false
  }
}

function submit() {
  const q = keyword.value.trim()
  if (!q) return
  void router.push({ path: '/search', query: { q } })
}

function searchTag(name: string) {
  keyword.value = name
  void router.push({ path: '/search', query: { q: name } })
}
</script>

<template>
  <div class="page">
    <div class="container search-container">
      <div class="breadcrumb">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <span>搜索</span>
      </div>

      <div class="page-head">
        <div>
          <h1>站内搜索</h1>
          <p>同时搜索社区帖子、模型包、创作者与标签。</p>
        </div>
      </div>

      <form class="search-panel panel" @submit.prevent="submit">
        <label class="search-box">
          <AppIcon name="search" />
          <input
            v-model="keyword"
            type="search"
            maxlength="60"
            placeholder="搜索帖子、模型包、作者或标签"
            aria-label="搜索关键词"
          />
        </label>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? '搜索中…' : '搜索' }}
        </button>
      </form>

      <div v-if="loading" class="loading-state"><NSpin /></div>

      <div v-else-if="error" class="empty-state">
        <p>{{ error }}</p>
      </div>

      <div v-else-if="!keyword.trim()" class="empty-state">
        <p>输入关键词开始搜索，例如「猫娘」「教程」「Live2D」。</p>
      </div>

      <div v-else-if="!hasResults" class="empty-state">
        <p>没有找到与「{{ keyword.trim() }}」相关的内容。</p>
      </div>

      <div v-else class="result-sections">
        <section v-if="result?.tags.length" class="panel result-block">
          <h2>相关标签</h2>
          <div class="chip-row">
            <button
              v-for="tag in result.tags"
              :key="tag.name"
              type="button"
              class="chip"
              @click="searchTag(tag.name)"
            >
              #{{ tag.name }}
              <em>{{ tag.posts + tag.models }}</em>
            </button>
          </div>
        </section>

        <section v-if="result?.posts.length" class="panel result-block">
          <div class="block-head">
            <h2>社区帖子</h2>
            <span>{{ result.posts.length }} 条结果</span>
          </div>
          <div class="post-list">
            <article v-for="post in result.posts" :key="post.id" class="post-item">
              <div class="post-head">
                <RouterLink :to="`/community/posts/${post.id}`" class="post-title">
                  {{ post.title }}
                </RouterLink>
                <span class="cat">{{ post.category.name }}</span>
              </div>
              <p class="post-excerpt">{{ post.excerpt }}</p>
              <div class="post-meta">
                <span>{{ post.author.name }}</span>
                <span>{{ formatDate(post.publishedAt) }}</span>
                <span>{{ formatCount(post.views) }} 浏览</span>
                <span>{{ post.comments }} 评论</span>
              </div>
            </article>
          </div>
        </section>

        <section v-if="result?.models.length" class="panel result-block">
          <div class="block-head">
            <h2>模型包</h2>
            <span>{{ result.models.length }} 条结果</span>
          </div>
          <div class="model-grid">
            <RouterLink
              v-for="model in result.models"
              :key="model.id"
              :to="`/models/${model.id}`"
              class="model-card"
            >
              <div class="model-cover">
                <img v-if="model.coverUrl" :src="model.coverUrl" :alt="`${model.name} 封面`" />
                <div v-else class="cover-fallback"><AppIcon name="paw" /></div>
              </div>
              <div class="model-body">
                <strong>{{ model.name }}</strong>
                <p>{{ model.summary }}</p>
                <div class="model-meta">
                  <span>{{ model.author.name }}</span>
                  <span>{{ model.version ?? 'v1.0.0' }}</span>
                  <span>{{ formatCount(model.downloads) }} 下载</span>
                </div>
              </div>
            </RouterLink>
          </div>
        </section>

        <section v-if="result?.users.length" class="panel result-block">
          <div class="block-head">
            <h2>创作者</h2>
            <span>{{ result.users.length }} 条结果</span>
          </div>
          <div class="user-list">
            <RouterLink
              v-for="user in result.users"
              :key="user.id"
              :to="`/users/${user.id}`"
              class="user-item"
            >
              <UserAvatar :name="user.name" :avatar-url="user.avatarUrl" :seed="user.id" />
              <span class="user-info">
                <strong>{{ user.name }}</strong>
                <em>{{ user.bio || `@${user.username}` }}</em>
              </span>
              <span class="user-stats">
                {{ user.stats.posts }} 帖子 · {{ user.stats.models }} 模型包
              </span>
            </RouterLink>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-container {
  max-width: 920px;
}

.search-panel {
  display: flex;
  gap: 12px;
  padding: 14px;
  margin-bottom: 22px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--bg);
  color: var(--muted);
}

.search-box:focus-within {
  border-color: #f0b4a3;
  box-shadow: 0 0 0 3px rgba(255, 107, 74, 0.1);
}

.search-box input {
  flex: 1;
  height: 42px;
  border: 0;
  background: none;
  outline: none;
  color: var(--ink);
  font-size: 14px;
}

.result-sections {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.result-block {
  padding: 22px 24px;
}

.block-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
}

.block-head h2 {
  font-size: 17px;
}

.block-head span {
  font-size: 12px;
  color: var(--muted);
}

.chip em {
  margin-left: 4px;
  font-style: normal;
  color: var(--muted);
}

.post-list {
  display: flex;
  flex-direction: column;
}

.post-item {
  padding: 14px 0;
  border-top: 1px dashed var(--line);
}

.post-item:first-child {
  border-top: 0;
  padding-top: 0;
}

.post-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.post-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
}

.post-title:hover {
  color: var(--accent-deep);
}

.cat {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-deep);
  font-size: 11px;
  font-weight: 650;
}

.post-excerpt {
  margin: 6px 0 8px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.65;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 12px;
  color: var(--muted);
}

.model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 14px;
}

.model-card {
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: var(--surface);
  overflow: hidden;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.model-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.model-cover {
  aspect-ratio: 16 / 10;
  background: var(--bg-soft);
}

.model-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--muted);
}

.model-body {
  padding: 14px 16px 16px;
}

.model-body strong {
  font-size: 14px;
}

.model-body p {
  margin: 6px 0 10px;
  font-size: 12px;
  color: var(--muted);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.model-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 11px;
  color: var(--muted);
}

.user-list {
  display: flex;
  flex-direction: column;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px dashed var(--line);
}

.user-item:first-child {
  border-top: 0;
  padding-top: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-info strong {
  font-size: 14px;
  color: var(--ink);
}

.user-info em {
  font-style: normal;
  font-size: 12px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-stats {
  margin-left: auto;
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
}

@media (max-width: 640px) {
  .search-panel {
    flex-direction: column;
  }

  .user-stats {
    display: none;
  }
}
</style>
