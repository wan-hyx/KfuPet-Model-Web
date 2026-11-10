<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import type { ModelPackage } from '@/data/home'
import { formatCount } from '@/utils/format'

type ModelSort = 'latest' | 'hot' | 'updated'

const props = defineProps<{ models: ModelPackage[] }>()

const activeSort = ref<ModelSort>('latest')
const query = ref('')

const visibleModels = computed(() => {
  const keyword = query.value.trim().toLowerCase()

  const matched = keyword
    ? props.models.filter((model) => {
        const haystack = [
          model.name,
          model.author,
          model.category,
          model.description,
          model.tags.join(' '),
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(keyword)
      })
    : [...props.models]

  return matched.sort((a, b) => {
    if (activeSort.value === 'hot') return b.downloads - a.downloads
    if (activeSort.value === 'updated') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    }
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  })
})
</script>

<template>
  <section id="models" class="section">
    <div class="container">
      <div class="section-head">
        <div>
          <span class="eyebrow">Model Library</span>
          <h2>模型包</h2>
          <p>下载、追踪版本、查看更新日志 —— 所有模型包都经过人工审核。</p>
        </div>
        <div class="section-tools">
          <div class="tabs" role="group" aria-label="模型包排序">
            <button
              type="button"
              class="tab"
              :class="{ active: activeSort === 'latest' }"
              :aria-pressed="activeSort === 'latest'"
              @click="activeSort = 'latest'"
            >
              最新
            </button>
            <button
              type="button"
              class="tab"
              :class="{ active: activeSort === 'hot' }"
              :aria-pressed="activeSort === 'hot'"
              @click="activeSort = 'hot'"
            >
              热门
            </button>
            <button
              type="button"
              class="tab"
              :class="{ active: activeSort === 'updated' }"
              :aria-pressed="activeSort === 'updated'"
              @click="activeSort = 'updated'"
            >
              最近更新
            </button>
          </div>

          <label class="search-box">
            <AppIcon name="search" />
            <input
              v-model="query"
              type="search"
              placeholder="搜索模型、作者或标签"
              aria-label="搜索模型包"
            />
          </label>
        </div>
      </div>

      <div v-if="visibleModels.length" class="model-grid">
        <RouterLink
          v-for="model in visibleModels"
          :key="model.id"
          :to="`/models/${model.id}`"
          class="model-card"
        >
          <div class="model-cover">
            <img class="cover-art" :src="model.cover" :alt="model.coverAlt" loading="lazy" />
            <div class="cover-badges">
              <span class="pill pill-version">{{ model.version }}</span>
              <span class="pill pill-cat">{{ model.category }}</span>
            </div>
          </div>

          <div class="model-body">
            <div class="model-title">
              <h3>{{ model.name }}</h3>
              <span class="model-size">{{ model.size }}</span>
            </div>
            <p class="model-desc">{{ model.description }}</p>
            <div class="tags">
              <span v-for="tag in model.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
            <div class="model-foot">
              <span class="model-author">
                <UserAvatar
                  :name="model.author"
                  :avatar-url="model.avatarUrl"
                  :seed="String(model.id)"
                  size="sm"
                />
                {{ model.author }}
              </span>
              <span class="dl-stat">
                <AppIcon name="download" />
                {{ formatCount(model.downloads) }}
              </span>
            </div>
          </div>
        </RouterLink>
      </div>

      <p v-else class="empty-state">没有找到匹配的模型包，换个关键词试试。</p>

      <div class="section-more">
        <RouterLink to="/models" class="text-link">
          查看全部模型包
          <AppIcon name="arrow" />
        </RouterLink>
        <RouterLink to="/models/new" class="btn btn-outline upload-btn">
          上传模型包
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 220px;
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

.model-title h3 {
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

.tag {
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

.empty-state {
  padding: 56px 0;
  text-align: center;
  font-size: 14px;
  color: var(--muted);
}

.section-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  flex-wrap: wrap;
  margin-top: 32px;
}

.upload-btn {
  padding: 8px 16px;
  font-size: 13px;
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
