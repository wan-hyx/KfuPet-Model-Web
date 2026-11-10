<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { NPagination, NSpin } from 'naive-ui'
import AppIcon from '@/components/ui/AppIcon.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import {
  listPostCategories,
  listPosts,
  type ApiCategory,
  type ApiPostSummary,
} from '@/api/community'
import { formatCount, relativeTime } from '@/utils/format'

const categories = ref<ApiCategory[]>([])
const posts = ref<ApiPostSummary[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref('')

const filters = reactive({
  category: '',
  sort: 'latest' as 'latest' | 'hot',
  q: '',
  page: 1,
  pageSize: 12,
})

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / filters.pageSize)))

const categoryTones: Record<string, string> = {
  general: 'discuss',
  usage: 'use',
  feedback: 'bug',
  character: 'create',
  model: 'create',
  development: 'dev',
  tools: 'tool',
  notice: 'discuss',
}

let searchTimer: number | undefined

onMounted(async () => {
  void fetchCategories()
  await load()
})

async function fetchCategories() {
  try {
    categories.value = await listPostCategories()
  } catch {
    categories.value = []
  }
}

async function load() {
  loading.value = true
  error.value = ''

  try {
    const result = await listPosts({
      sort: filters.sort,
      category: filters.category || undefined,
      q: filters.q.trim() || undefined,
      page: filters.page,
      pageSize: filters.pageSize,
    })
    posts.value = result.items
    total.value = result.total
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '帖子加载失败'
    posts.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function selectCategory(slug: string) {
  if (filters.category === slug) return
  filters.category = slug
  filters.page = 1
  void load()
}

function selectSort(sort: 'latest' | 'hot') {
  if (filters.sort === sort) return
  filters.sort = sort
  filters.page = 1
  void load()
}

function onSearch() {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    filters.page = 1
    void load()
  }, 350)
}

function changePage(page: number) {
  filters.page = page
  void load()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function categoryTone(slug: string): string {
  return categoryTones[slug] ?? 'discuss'
}
</script>

<template>
  <div class="page">
    <div class="container">
      <div class="page-head">
        <div>
          <div class="breadcrumb">
            <RouterLink to="/">首页</RouterLink>
            <span>/</span>
            <span>社区</span>
          </div>
          <h1>社区交流</h1>
          <p>分享角色制作、使用技巧与问题排查经验，和社区创作者一起把桌宠做得更好。</p>
        </div>
        <RouterLink to="/community/new" class="btn btn-primary">
          <AppIcon name="spark" />
          发布帖子
        </RouterLink>
      </div>

      <div class="list-toolbar">
        <div class="tabs" role="group" aria-label="帖子排序">
          <button
            type="button"
            class="tab"
            :class="{ active: filters.sort === 'latest' }"
            :aria-pressed="filters.sort === 'latest'"
            @click="selectSort('latest')"
          >
            最新
          </button>
          <button
            type="button"
            class="tab"
            :class="{ active: filters.sort === 'hot' }"
            :aria-pressed="filters.sort === 'hot'"
            @click="selectSort('hot')"
          >
            热门
          </button>
        </div>

        <label class="search-box">
          <AppIcon name="search" />
          <input
            v-model="filters.q"
            type="search"
            placeholder="搜索帖子标题或内容"
            aria-label="搜索帖子"
            @input="onSearch"
          />
        </label>
      </div>

      <div class="chip-row">
        <button
          type="button"
          class="chip"
          :class="{ 'is-active': filters.category === '' }"
          @click="selectCategory('')"
        >
          全部
        </button>
        <button
          v-for="category in categories"
          :key="category.id"
          type="button"
          class="chip"
          :class="{ 'is-active': filters.category === category.slug }"
          @click="selectCategory(category.slug)"
        >
          {{ category.name }}
        </button>
      </div>

      <NSpin :show="loading">
        <p v-if="error" class="form-error">{{ error }}</p>

        <div v-else-if="!posts.length" class="empty-state">
          还没有匹配的帖子，换个关键词，或者成为第一个发帖的人。
        </div>

        <div v-else class="thread-list">
          <RouterLink
            v-for="post in posts"
            :key="post.id"
            :to="`/community/posts/${post.id}`"
            class="thread-card"
          >
            <div class="thread-top">
              <span class="cat" :class="`cat-${categoryTone(post.category.slug)}`">
                {{ post.category.name }}
              </span>
              <span v-if="post.pinned" class="pin">置顶</span>
              <span class="thread-time">{{ relativeTime(post.publishedAt) }}</span>
            </div>

            <h2>{{ post.title }}</h2>
            <p class="thread-excerpt">{{ post.excerpt }}</p>

            <div class="thread-meta">
              <span class="author">
                <UserAvatar
                  :name="post.author.name"
                  :avatar-url="post.author.avatarUrl"
                  :seed="post.author.id"
                  size="sm"
                />
                {{ post.author.name }}
              </span>
              <span class="meta-item"><AppIcon name="eye" />{{ formatCount(post.views) }}</span>
              <span class="meta-item"><AppIcon name="heart" />{{ post.likes }}</span>
              <span class="meta-item"><AppIcon name="comment" />{{ post.comments }}</span>
            </div>
          </RouterLink>
        </div>

        <div v-if="pageCount > 1" class="pager">
          <NPagination
            :page="filters.page"
            :page-count="pageCount"
            :page-slot="7"
            @update:page="changePage"
          />
        </div>
      </NSpin>
    </div>
  </div>
</template>

<style scoped>
.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 250px;
  padding: 9px 14px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--line);
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.search-box:focus-within {
  border-color: #f4b39e;
  box-shadow: 0 0 0 4px rgba(255, 107, 74, 0.1);
}

.search-box :deep(.icon) {
  width: 15px;
  height: 15px;
  color: #9a918f;
}

.search-box input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 13px;
  color: var(--ink);
}

.search-box input::placeholder {
  color: #a79e9a;
}

.thread-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.thread-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 22px 24px;
  border-radius: 18px;
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-sm);
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease;
}

.thread-card:hover {
  transform: translateY(-3px);
  border-color: #e6cdbd;
  box-shadow: var(--shadow-md);
}

.thread-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cat {
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.cat-discuss {
  background: var(--violet-soft);
  color: #5b3fe0;
}

.cat-create {
  background: var(--accent-soft);
  color: var(--accent-deep);
}

.cat-bug {
  background: var(--amber-soft);
  color: #9c6610;
}

.cat-dev {
  background: var(--teal-soft);
  color: #087a65;
}

.cat-tool {
  background: var(--blue-soft);
  color: #2463ae;
}

.cat-use {
  background: var(--pink-soft);
  color: var(--pink);
}

.pin {
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--ink);
  color: #fff;
  font-size: 10.5px;
  font-weight: 700;
}

.thread-time {
  margin-left: auto;
  font-size: 12px;
  color: #9a918f;
  white-space: nowrap;
}

.thread-card h2 {
  font-size: 18px;
  font-weight: 750;
  line-height: 1.45;
  letter-spacing: -0.01em;
  transition: color 0.2s;
}

.thread-card:hover h2 {
  color: var(--accent-deep);
}

.thread-excerpt {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 13.5px;
  line-height: 1.75;
  color: var(--muted);
}

.thread-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 2px;
  font-size: 12px;
  color: #8b8292;
}

.author {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-right: auto;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-soft);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.meta-item :deep(.icon) {
  width: 13px;
  height: 13px;
  opacity: 0.7;
}

.pager {
  display: flex;
  justify-content: center;
  margin-top: 28px;
}

@media (max-width: 640px) {
  .search-box {
    width: 100%;
    min-width: 0;
  }

  .thread-card {
    padding: 18px;
  }
}
</style>
