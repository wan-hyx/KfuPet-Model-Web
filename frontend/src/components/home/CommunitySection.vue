<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import { communityCategories } from '@/data/home'
import type { Post } from '@/data/home'
import { formatCount } from '@/utils/format'

type SortMode = 'latest' | 'hot'

const props = defineProps<{ posts: Post[] }>()

const activeTab = ref<SortMode>('latest')
const activeCategory = ref<string>('全部')

const visiblePosts = computed(() => {
  const source =
    activeCategory.value === '全部'
      ? props.posts
      : props.posts.filter((post) => post.category === activeCategory.value)

  return [...source].sort((a, b) => {
    if (activeTab.value === 'hot') return b.views - a.views
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  })
})
</script>

<template>
  <section id="community" class="section band">
    <div class="container">
      <div class="section-head">
        <div>
          <span class="eyebrow">Community</span>
          <h2>社区交流</h2>
          <p>从角色制作到问题排查，和社区创作者一起把桌宠做得更好。</p>
        </div>
        <div class="section-tools">
          <div class="tabs" role="group" aria-label="帖子排序">
            <button
              type="button"
              class="tab"
              :class="{ active: activeTab === 'latest' }"
              :aria-pressed="activeTab === 'latest'"
              @click="activeTab = 'latest'"
            >
              最新
            </button>
            <button
              type="button"
              class="tab"
              :class="{ active: activeTab === 'hot' }"
              :aria-pressed="activeTab === 'hot'"
              @click="activeTab = 'hot'"
            >
              热门
            </button>
          </div>
          <RouterLink to="/community" class="text-link">
            全部帖子
            <AppIcon name="arrow" />
          </RouterLink>
          <RouterLink to="/community/new" class="btn btn-outline publish-btn">
            发布帖子
          </RouterLink>
        </div>
      </div>

      <div class="chip-row">
        <button
          v-for="category in communityCategories"
          :key="category"
          type="button"
          class="chip"
          :class="{ 'is-active': activeCategory === category }"
          @click="activeCategory = category"
        >
          {{ category }}
        </button>
      </div>

      <div v-if="visiblePosts.length" class="post-grid">
        <RouterLink
          v-for="post in visiblePosts"
          :key="post.id"
          :to="`/community/posts/${post.id}`"
          class="post-card"
        >
          <div class="post-top">
            <span class="cat" :class="`cat-${post.categoryTone}`">{{ post.category }}</span>
            <span class="post-time">{{ post.timeLabel }}</span>
          </div>
          <h3>{{ post.title }}</h3>
          <p class="post-excerpt">{{ post.excerpt }}</p>
          <div class="post-meta">
            <span class="author">
              <UserAvatar
                :name="post.author"
                :avatar-url="post.avatarUrl"
                :seed="String(post.id)"
              />
              {{ post.author }}
            </span>
            <span class="meta-item"><AppIcon name="eye" />{{ formatCount(post.views) }}</span>
            <span class="meta-item"><AppIcon name="heart" />{{ post.likes }}</span>
            <span class="meta-item"><AppIcon name="comment" />{{ post.comments }}</span>
          </div>
        </RouterLink>
      </div>

      <p v-else class="empty-posts">这个分类还没有帖子，发一篇来破冰吧。</p>
    </div>
  </section>
</template>

<style scoped>
.post-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.post-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 22px;
  border-radius: 20px;
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-sm);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease,
    border-color 0.3s ease;
}

.post-card:hover {
  transform: translateY(-4px);
  border-color: #e6cdbd;
  box-shadow: var(--shadow-md);
}

.post-top {
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

.post-time {
  margin-left: auto;
  font-size: 12px;
  color: #9a918f;
  white-space: nowrap;
}

.post-card h3 {
  font-size: 17px;
  font-weight: 750;
  line-height: 1.48;
  letter-spacing: -0.01em;
  transition: color 0.2s;
}

.post-card:hover h3 {
  color: var(--accent-deep);
}

.post-excerpt {
  font-size: 13px;
  line-height: 1.7;
  color: var(--muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-meta {
  margin-top: auto;
  padding-top: 15px;
  border-top: 1px dashed var(--line);
  display: flex;
  align-items: center;
  gap: 13px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #8b8292;
}

.author {
  display: inline-flex;
  align-items: center;
  gap: 8px;
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

.publish-btn {
  padding: 8px 15px;
  font-size: 13px;
}

.empty-posts {
  padding: 56px 0;
  text-align: center;
  font-size: 14px;
  color: var(--muted);
}

@media (max-width: 1024px) {
  .post-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .post-grid {
    grid-template-columns: 1fr;
  }
}
</style>
