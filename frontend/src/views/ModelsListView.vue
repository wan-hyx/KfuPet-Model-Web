<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { NPagination, NSpin } from 'naive-ui'
import AppIcon from '@/components/ui/AppIcon.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import {
  listModelCategories,
  listModels,
  type ApiCategory,
  type ApiModel,
} from '@/api/models'
import { formatCount, formatSize } from '@/utils/format'

const categories = ref<ApiCategory[]>([])
const models = ref<ApiModel[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref('')

const filters = reactive({
  category: '',
  sort: 'latest' as 'latest' | 'hot' | 'updated',
  q: '',
  page: 1,
  pageSize: 12,
})

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / filters.pageSize)))

let searchTimer: number | undefined

onMounted(async () => {
  void fetchCategories()
  await load()
})

async function fetchCategories() {
  try {
    categories.value = await listModelCategories()
  } catch {
    categories.value = []
  }
}

async function load() {
  loading.value = true
  error.value = ''

  try {
    const result = await listModels({
      sort: filters.sort,
      category: filters.category || undefined,
      q: filters.q.trim() || undefined,
      page: filters.page,
      pageSize: filters.pageSize,
    })
    models.value = result.items
    total.value = result.total
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '模型包加载失败'
    models.value = []
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

function selectSort(sort: 'latest' | 'hot' | 'updated') {
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
</script>

<template>
  <div class="page">
    <div class="container">
      <div class="page-head">
        <div>
          <div class="breadcrumb">
            <RouterLink to="/">首页</RouterLink>
            <span>/</span>
            <span>模型包</span>
          </div>
          <h1>模型包</h1>
          <p>下载、追踪版本、查看更新日志 —— 所有模型包都经过人工审核后发布。</p>
        </div>
        <RouterLink to="/models/new" class="btn btn-primary">
          <AppIcon name="download" />
          上传模型包
        </RouterLink>
      </div>

      <div class="list-toolbar">
        <div class="tabs" role="group" aria-label="模型包排序">
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
          <button
            type="button"
            class="tab"
            :class="{ active: filters.sort === 'updated' }"
            :aria-pressed="filters.sort === 'updated'"
            @click="selectSort('updated')"
          >
            最近更新
          </button>
        </div>

        <label class="search-box">
          <AppIcon name="search" />
          <input
            v-model="filters.q"
            type="search"
            placeholder="搜索模型、简介或标签"
            aria-label="搜索模型包"
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

        <div v-else-if="!models.length" class="empty-state">
          没有找到匹配的模型包，换个关键词试试，或上传你的第一个作品。
        </div>

        <div v-else class="model-grid">
          <RouterLink
            v-for="model in models"
            :key="model.id"
            :to="`/models/${model.id}`"
            class="model-card"
          >
            <div class="model-cover">
              <img
                v-if="model.coverUrl"
                class="cover-art"
                :src="model.coverUrl"
                :alt="`模型包「${model.name}」封面`"
                loading="lazy"
              />
              <div v-else class="cover-fallback">
                <AppIcon name="paw" />
              </div>
              <div class="cover-badges">
                <span class="pill pill-version">{{ model.version ?? 'v1.0.0' }}</span>
                <span class="pill pill-cat">{{ model.category.name }}</span>
              </div>
            </div>

            <div class="model-body">
              <div class="model-title">
                <h2>{{ model.name }}</h2>
                <span class="model-size">{{ formatSize(model.sizeBytes) }}</span>
              </div>
              <p class="model-desc">{{ model.summary }}</p>
              <div v-if="model.tags.length" class="tags">
                <span v-for="tag in model.tags" :key="tag" class="meta-tag">#{{ tag }}</span>
              </div>
              <div class="model-foot">
                <span class="model-author">
                  <UserAvatar
                    :name="model.author.name"
                    :avatar-url="model.author.avatarUrl"
                    :seed="model.author.id"
                    size="sm"
                  />
                  {{ model.author.name }}
                </span>
                <span class="dl-stat">
                  <AppIcon name="download" />
                  {{ formatCount(model.downloads) }}
                </span>
              </div>
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

.model-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
}

.model-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 22px;
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-sm);
  transition:
    transform 0.35s ease,
    box-shadow 0.35s ease,
    border-color 0.35s ease;
}

.model-card:hover {
  transform: translateY(-5px);
  border-color: #e6cfbe;
  box-shadow: var(--shadow-lg);
}

.model-cover {
  position: relative;
  aspect-ratio: 16 / 11;
  overflow: hidden;
  background: var(--bg-soft);
}

.cover-art {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.model-card:hover .cover-art {
  transform: scale(1.05);
}

.cover-fallback {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: #c7a893;
  background:
    radial-gradient(340px 180px at 70% 0%, rgba(255, 166, 138, 0.4), transparent 70%),
    linear-gradient(135deg, #fdf1e7, #f2e7db);
}

.cover-fallback :deep(.icon) {
  width: 44px;
  height: 44px;
  opacity: 0.75;
}

.cover-badges {
  position: absolute;
  inset: 0;
  padding: 12px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  pointer-events: none;
}

.pill {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 9px;
  border-radius: 8px;
  backdrop-filter: blur(6px);
}

.pill-version {
  color: #fff;
  background: rgba(20, 15, 28, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.pill-cat {
  color: var(--ink);
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.92);
}

.model-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 20px 20px;
}

.model-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.model-title h2 {
  font-size: 17px;
  font-weight: 750;
  letter-spacing: -0.01em;
}

.model-size {
  font-size: 11.5px;
  color: #9a918f;
  white-space: nowrap;
}

.model-desc {
  min-height: 44px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.meta-tag {
  padding: 3px 8px;
  border-radius: 7px;
  background: #f6efe6;
  color: #8a7460;
  font-size: 11.5px;
}

.model-foot {
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px dashed var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  color: #8b8292;
}

.model-author {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-weight: 600;
  color: var(--ink-soft);
}

.dl-stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 650;
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}

.dl-stat :deep(.icon) {
  width: 13px;
  height: 13px;
}

.pager {
  display: flex;
  justify-content: center;
  margin-top: 28px;
}

@media (max-width: 1024px) {
  .model-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .model-grid {
    grid-template-columns: 1fr;
  }

  .search-box {
    width: 100%;
    min-width: 0;
  }
}
</style>
