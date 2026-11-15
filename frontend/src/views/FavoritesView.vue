<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { NSpin, useMessage } from 'naive-ui'
import AppIcon from '@/components/ui/AppIcon.vue'
import {
  listMyFavorites,
  toggleFavorite,
  type FavoriteLists,
} from '@/api/favorites'
import { formatCount, formatDate } from '@/utils/format'

const message = useMessage()

const favorites = ref<FavoriteLists>({ posts: [], models: [] })
const activeTab = ref<'posts' | 'models'>('posts')
const loading = ref(true)
const error = ref('')
const removingId = ref('')

const currentPosts = computed(() => favorites.value.posts)
const currentModels = computed(() => favorites.value.models)

onMounted(load)

async function load() {
  loading.value = true
  error.value = ''

  try {
    favorites.value = await listMyFavorites()
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '收藏加载失败'
  } finally {
    loading.value = false
  }
}

async function removePost(id: string) {
  if (removingId.value) return
  removingId.value = id

  try {
    await toggleFavorite('POST', id)
    favorites.value.posts = favorites.value.posts.filter((post) => post.id !== id)
    message.success('已取消收藏')
  } catch (reason) {
    message.error(reason instanceof Error ? reason.message : '操作失败')
  } finally {
    removingId.value = ''
  }
}

async function removeModel(id: string) {
  if (removingId.value) return
  removingId.value = id

  try {
    await toggleFavorite('MODEL', id)
    favorites.value.models = favorites.value.models.filter((model) => model.id !== id)
    message.success('已取消收藏')
  } catch (reason) {
    message.error(reason instanceof Error ? reason.message : '操作失败')
  } finally {
    removingId.value = ''
  }
}
</script>

<template>
  <div class="page">
    <div class="container favorites-container">
      <div class="breadcrumb">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <span>我的收藏</span>
      </div>

      <div class="page-head">
        <div>
          <h1>我的收藏</h1>
          <p>收藏的帖子与模型包会集中显示在这里。</p>
        </div>
      </div>

      <div class="tabs">
        <button
          type="button"
          class="tab"
          :class="{ active: activeTab === 'posts' }"
          @click="activeTab = 'posts'"
        >
          帖子 ({{ favorites.posts.length }})
        </button>
        <button
          type="button"
          class="tab"
          :class="{ active: activeTab === 'models' }"
          @click="activeTab = 'models'"
        >
          模型包 ({{ favorites.models.length }})
        </button>
      </div>

      <div v-if="loading" class="loading-state"><NSpin /></div>

      <div v-else-if="error" class="empty-state">
        <p>{{ error }}</p>
        <button type="button" class="btn btn-outline retry-link" @click="load">重试</button>
      </div>

      <template v-else>
        <template v-if="activeTab === 'posts'">
          <div v-if="currentPosts.length" class="post-list">
            <article
              v-for="post in currentPosts"
              :key="post.id"
              class="panel post-item"
            >
              <div class="post-main">
                <div class="post-head">
                  <RouterLink :to="`/community/posts/${post.id}`" class="post-title">
                    {{ post.title }}
                  </RouterLink>
                  <span class="cat">{{ post.category.name }}</span>
                  <span v-if="post.pinned" class="pin">置顶</span>
                </div>
                <p class="post-excerpt">{{ post.excerpt }}</p>
                <div class="post-meta">
                  <span>{{ post.author.name }}</span>
                  <span>{{ formatDate(post.publishedAt) }}</span>
                  <span>{{ formatCount(post.views) }} 浏览</span>
                  <span>{{ post.likes }} 赞</span>
                  <span>{{ post.comments }} 评论</span>
                </div>
              </div>
              <button
                type="button"
                class="remove-btn"
                :disabled="removingId === post.id"
                @click="removePost(post.id)"
              >
                取消收藏
              </button>
            </article>
          </div>
          <div v-else class="empty-state">
            <p>还没有收藏帖子。</p>
            <RouterLink to="/community" class="btn btn-outline">去社区看看</RouterLink>
          </div>
        </template>

        <template v-else>
          <div v-if="currentModels.length" class="model-grid">
            <article
              v-for="model in currentModels"
              :key="model.id"
              class="panel model-card"
            >
              <RouterLink :to="`/models/${model.id}`" class="model-cover">
                <img v-if="model.coverUrl" :src="model.coverUrl" :alt="`${model.name} 封面`" />
                <div v-else class="cover-fallback"><AppIcon name="paw" /></div>
              </RouterLink>
              <div class="model-body">
                <RouterLink :to="`/models/${model.id}`" class="model-title">
                  {{ model.name }}
                </RouterLink>
                <p>{{ model.summary }}</p>
                <div class="model-meta">
                  <span>{{ model.version ?? 'v1.0.0' }}</span>
                  <span>{{ formatCount(model.downloads) }} 下载</span>
                  <span>{{ formatCount(model.favorites) }} 收藏</span>
                </div>
                <button
                  type="button"
                  class="remove-btn inline"
                  :disabled="removingId === model.id"
                  @click="removeModel(model.id)"
                >
                  取消收藏
                </button>
              </div>
            </article>
          </div>
          <div v-else class="empty-state">
            <p>还没有收藏模型包。</p>
            <RouterLink to="/models" class="btn btn-outline">去模型库看看</RouterLink>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<style scoped>
.favorites-container {
  max-width: 920px;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 22px;
}

.post-main {
  min-width: 0;
}

.post-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
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

.pin {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--teal-soft);
  color: var(--teal);
  font-size: 11px;
  font-weight: 650;
}

.post-excerpt {
  margin: 7px 0 9px;
  font-size: 13px;
  color: var(--muted);
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

.remove-btn {
  flex-shrink: 0;
  padding: 7px 12px;
  border-radius: 9px;
  border: 1px solid var(--line);
  background: #fff;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  transition:
    border-color 0.2s,
    color 0.2s;
}

.remove-btn:hover {
  border-color: #f0b4a3;
  color: var(--accent-deep);
}

.remove-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.model-card {
  overflow: hidden;
}

.model-cover {
  display: block;
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
  padding: 15px 17px 17px;
}

.model-title {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--ink);
}

.model-title:hover {
  color: var(--accent-deep);
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

.remove-btn.inline {
  margin-top: 12px;
  width: 100%;
}

@media (max-width: 640px) {
  .post-item {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
