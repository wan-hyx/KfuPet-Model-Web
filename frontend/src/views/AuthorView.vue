<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NSpin } from 'naive-ui'
import { useRoute } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import { fetchUserProfile, type PublicProfile } from '@/api/users'
import { formatCount, formatDate, formatSize, relativeTime } from '@/utils/format'

const route = useRoute()

const profile = ref<PublicProfile | null>(null)
const loading = ref(true)
const error = ref('')

const userId = computed(() => String(route.params.id))

watch(userId, () => void load(), { immediate: true })

async function load() {
  loading.value = true
  error.value = ''

  try {
    profile.value = await fetchUserProfile(userId.value)
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '作者信息加载失败'
    profile.value = null
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="container author-container">
      <div v-if="loading" class="loading-state"><NSpin /></div>

      <div v-else-if="error || !profile" class="empty-state">
        <p>{{ error || '作者不存在' }}</p>
        <RouterLink to="/" class="btn btn-outline retry-link">返回首页</RouterLink>
      </div>

      <template v-else>
        <section class="panel author-hero">
          <div class="author-avatar">
            <UserAvatar
              :name="profile.name"
              :avatar-url="profile.avatarUrl"
              :seed="profile.id"
            />
          </div>

          <div class="author-info">
            <div class="author-name-row">
              <h1>{{ profile.name }}</h1>
              <span v-if="profile.role === 'ADMIN'" class="role-badge">管理员</span>
            </div>
            <p class="author-username">@{{ profile.username }}</p>
            <p class="author-bio">{{ profile.bio || '这位创作者还没有填写简介。' }}</p>
            <p v-if="profile.createdAt" class="author-joined">
              加入于 {{ formatDate(profile.createdAt) }}
            </p>
          </div>

          <dl class="author-stats">
            <div>
              <dt>帖子</dt>
              <dd>{{ formatCount(profile.stats.posts) }}</dd>
            </div>
            <div>
              <dt>模型包</dt>
              <dd>{{ formatCount(profile.stats.models) }}</dd>
            </div>
            <div>
              <dt>获下载</dt>
              <dd>{{ formatCount(profile.stats.downloads) }}</dd>
            </div>
          </dl>
        </section>

        <section class="author-section">
          <div class="section-title">
            <h2>发布的模型包</h2>
            <span>{{ profile.models.length }} 个</span>
          </div>

          <div v-if="profile.models.length" class="model-grid">
            <RouterLink
              v-for="model in profile.models"
              :key="model.id"
              :to="`/models/${model.id}`"
              class="model-card"
            >
              <div class="model-cover">
                <img v-if="model.coverUrl" :src="model.coverUrl" :alt="`${model.name} 封面`" />
                <div v-else class="cover-fallback"><AppIcon name="paw" /></div>
              </div>
              <div class="model-body">
                <div class="model-title-row">
                  <strong>{{ model.name }}</strong>
                  <span class="version">{{ model.version ?? 'v1.0.0' }}</span>
                </div>
                <p>{{ model.summary }}</p>
                <div class="model-meta">
                  <span>{{ formatCount(model.downloadCount) }} 下载</span>
                  <span>{{ formatCount(model.favoriteCount) }} 收藏</span>
                  <span>{{ formatSize(model.sizeBytes) }}</span>
                </div>
              </div>
            </RouterLink>
          </div>
          <p v-else class="empty-state">还没有发布模型包。</p>
        </section>

        <section class="author-section">
          <div class="section-title">
            <h2>发布的帖子</h2>
            <span>{{ profile.posts.length }} 篇</span>
          </div>

          <div v-if="profile.posts.length" class="panel post-list">
            <RouterLink
              v-for="post in profile.posts"
              :key="post.id"
              :to="`/community/posts/${post.id}`"
              class="post-item"
            >
              <div class="post-main">
                <div class="post-head">
                  <strong>{{ post.title }}</strong>
                  <span class="cat">{{ post.category.name }}</span>
                </div>
                <p>{{ post.excerpt }}</p>
              </div>
              <div class="post-stats">
                <span>{{ relativeTime(post.createdAt) }}</span>
                <span>{{ formatCount(post.views) }} 浏览</span>
                <span>{{ post.likes }} 赞</span>
                <span>{{ post.commentCount }} 评论</span>
              </div>
            </RouterLink>
          </div>
          <p v-else class="empty-state">还没有发布帖子。</p>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.author-container {
  max-width: 1000px;
}

.author-hero {
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 28px;
  margin-bottom: 26px;
  flex-wrap: wrap;
}

.author-avatar :deep(.avatar) {
  width: 72px;
  height: 72px;
  font-size: 26px;
}

.author-info {
  flex: 1;
  min-width: 220px;
}

.author-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.author-name-row h1 {
  font-size: 24px;
  line-height: 1.2;
}

.role-badge {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--violet-soft);
  color: var(--violet);
  font-size: 11px;
  font-weight: 650;
}

.author-username {
  margin-top: 3px;
  font-size: 13px;
  color: var(--muted);
}

.author-bio {
  margin-top: 10px;
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--ink-soft);
}

.author-joined {
  margin-top: 8px;
  font-size: 12px;
  color: var(--muted);
}

.author-stats {
  display: flex;
  gap: 26px;
  padding-left: 22px;
  border-left: 1px solid var(--line);
}

.author-stats dt {
  font-size: 12px;
  color: var(--muted);
}

.author-stats dd {
  margin-top: 4px;
  font-size: 20px;
  font-weight: 750;
  color: var(--ink);
}

.author-section {
  margin-bottom: 30px;
}

.section-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
}

.section-title h2 {
  font-size: 18px;
}

.section-title span {
  font-size: 12px;
  color: var(--muted);
}

.model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
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

.model-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.model-title-row strong {
  font-size: 14px;
}

.version {
  font-size: 11px;
  color: var(--accent-deep);
  font-weight: 650;
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

.post-list {
  padding: 6px 22px;
}

.post-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 0;
  border-top: 1px dashed var(--line);
}

.post-item:first-child {
  border-top: 0;
}

.post-main {
  min-width: 0;
}

.post-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.post-head strong {
  font-size: 14.5px;
  color: var(--ink);
}

.post-main p {
  margin-top: 5px;
  font-size: 12.5px;
  color: var(--muted);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cat {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-deep);
  font-size: 11px;
  font-weight: 650;
}

.post-stats {
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  font-size: 11.5px;
  color: var(--muted);
}

@media (max-width: 720px) {
  .author-stats {
    padding-left: 0;
    border-left: 0;
    width: 100%;
  }

  .post-item {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
