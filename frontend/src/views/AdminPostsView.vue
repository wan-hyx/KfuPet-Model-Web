<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { NPagination, NSpin, useMessage } from 'naive-ui'
import AdminTabs from '@/components/admin/AdminTabs.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import {
  listAdminPosts,
  updateAdminPostFlags,
  type AdminPost,
  type AdminPostFilter,
} from '@/api/admin'
import { deletePost } from '@/api/community'
import { formatCount, formatDate } from '@/utils/format'

const message = useMessage()

const posts = ref<AdminPost[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref('')
const actingId = ref('')

const filters = reactive({
  q: '',
  filter: 'all' as AdminPostFilter,
  page: 1,
  pageSize: 20,
})

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / filters.pageSize)))

const filterTabs: Array<{ value: AdminPostFilter; label: string }> = [
  { value: 'all', label: '全部帖子' },
  { value: 'hidden', label: '已隐藏' },
  { value: 'pinned', label: '已置顶' },
  { value: 'featured', label: '精华' },
]

let searchTimer: number | undefined

onMounted(load)

async function load() {
  loading.value = true
  error.value = ''

  try {
    const result = await listAdminPosts({
      q: filters.q.trim() || undefined,
      filter: filters.filter,
      page: filters.page,
      pageSize: filters.pageSize,
    })
    posts.value = result.items
    total.value = result.total
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '帖子列表加载失败'
    posts.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function onSearch() {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    filters.page = 1
    void load()
  }, 300)
}

function selectFilter(filter: AdminPostFilter) {
  if (filters.filter === filter) return
  filters.filter = filter
  filters.page = 1
  void load()
}

function changePage(page: number) {
  filters.page = page
  void load()
}

async function toggleHidden(post: AdminPost) {
  await patchFlags(post, { isHidden: !post.hidden }, post.hidden ? '帖子已恢复显示' : '帖子已隐藏')
}

async function togglePinned(post: AdminPost) {
  await patchFlags(post, { isPinned: !post.pinned }, post.pinned ? '已取消置顶' : '帖子已置顶')
}

async function toggleFeatured(post: AdminPost) {
  await patchFlags(post, { isFeatured: !post.featured }, post.featured ? '已取消精华' : '帖子已设为精华')
}

async function patchFlags(
  post: AdminPost,
  payload: { isHidden?: boolean; isPinned?: boolean; isFeatured?: boolean },
  successText: string,
) {
  actingId.value = post.id
  try {
    await updateAdminPostFlags(post.id, payload)
    message.success(successText)
    await load()
  } catch (reason) {
    message.error(reason instanceof Error ? reason.message : '操作失败')
  } finally {
    actingId.value = ''
  }
}

async function removePost(post: AdminPost) {
  if (!window.confirm(`确定删除帖子「${post.title}」吗？删除后无法恢复。`)) return

  actingId.value = post.id
  try {
    await deletePost(post.id)
    message.success('帖子已删除')
    if (posts.value.length === 1 && filters.page > 1) filters.page -= 1
    await load()
  } catch (reason) {
    message.error(reason instanceof Error ? reason.message : '删除失败')
  } finally {
    actingId.value = ''
  }
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
        <span>社区管理</span>
      </div>

      <AdminTabs />

      <div class="page-head">
        <div>
          <h1>社区管理</h1>
          <p>管理社区帖子：隐藏违规内容、设置置顶与精华，或直接删除帖子。</p>
        </div>
        <span class="total-badge">共 {{ total }} 篇帖子</span>
      </div>

      <div class="post-toolbar">
        <label class="search-box">
          <AppIcon name="search" />
          <input
            v-model="filters.q"
            type="search"
            placeholder="搜索帖子标题或正文"
            aria-label="搜索帖子"
            @input="onSearch"
          />
        </label>

        <div class="chip-row">
          <button
            v-for="tab in filterTabs"
            :key="tab.value"
            type="button"
            class="chip"
            :class="{ 'is-active': filters.filter === tab.value }"
            @click="selectFilter(tab.value)"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <NSpin :show="loading">
        <p v-if="error" class="form-error">{{ error }}</p>

        <div v-else-if="!posts.length" class="empty-state">没有匹配的帖子。</div>

        <div v-else class="post-list">
          <article v-for="post in posts" :key="post.id" class="panel post-item">
            <div class="post-head">
              <div class="title-wrap">
                <RouterLink v-if="!post.hidden" :to="`/community/posts/${post.id}`">
                  <h2>{{ post.title }}</h2>
                </RouterLink>
                <h2 v-else class="hidden-title">{{ post.title }}</h2>
                <span class="cat">{{ post.category.name }}</span>
                <span v-if="post.hidden" class="status-badge status-rejected">已隐藏</span>
                <span v-if="post.pinned" class="flag flag-pin">置顶</span>
                <span v-if="post.featured" class="flag flag-feature">精华</span>
              </div>
              <span class="post-date">{{ formatDate(post.publishedAt) }}</span>
            </div>

            <p class="post-excerpt">{{ post.excerpt }}</p>

            <div class="post-meta">
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

            <div class="post-actions">
              <button
                type="button"
                class="btn btn-outline"
                :disabled="actingId === post.id"
                @click="toggleHidden(post)"
              >
                {{ post.hidden ? '恢复显示' : '隐藏帖子' }}
              </button>
              <button
                type="button"
                class="btn btn-outline"
                :disabled="actingId === post.id"
                @click="togglePinned(post)"
              >
                {{ post.pinned ? '取消置顶' : '置顶' }}
              </button>
              <button
                type="button"
                class="btn btn-outline"
                :disabled="actingId === post.id"
                @click="toggleFeatured(post)"
              >
                {{ post.featured ? '取消精华' : '设为精华' }}
              </button>
              <button
                type="button"
                class="btn btn-outline danger"
                :disabled="actingId === post.id"
                @click="removePost(post)"
              >
                删除
              </button>
            </div>
          </article>
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

.post-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.post-toolbar .chip-row {
  margin-bottom: 0;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 240px;
  padding: 9px 14px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--line);
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

.post-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-item {
  padding: 18px 20px;
}

.post-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.title-wrap h2 {
  font-size: 16px;
  font-weight: 750;
  line-height: 1.45;
}

.title-wrap a:hover h2 {
  color: var(--accent-deep);
}

.hidden-title {
  color: #9a918f;
  text-decoration: line-through;
}

.cat {
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-deep);
  font-size: 11px;
  font-weight: 700;
}

.flag {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10.5px;
  font-weight: 700;
}

.flag-pin {
  background: var(--ink);
  color: #fff;
}

.flag-feature {
  background: var(--amber-soft);
  color: #9c6610;
}

.post-date {
  flex: none;
  font-size: 11.5px;
  color: #9a918f;
}

.post-excerpt {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-meta {
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
  margin-right: auto;
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

.post-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 14px;
}

.post-actions .btn {
  padding: 7px 14px;
  font-size: 12.5px;
}

.post-actions .danger {
  color: #b7472a;
  border-color: #f0c9bd;
}

.post-actions .danger:hover {
  border-color: #d99b89;
}

.post-actions .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.pager {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

@media (max-width: 720px) {
  .search-box {
    width: 100%;
    min-width: 0;
  }
}
</style>
