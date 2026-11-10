<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue'
import type { ModelUpdate, Notice } from '@/data/home'
import { useFeatureNotice } from '@/composables/useFeatureNotice'

defineProps<{ updates: ModelUpdate[]; notices: Notice[] }>()

const notify = useFeatureNotice()

function openUpdates() {
  notify('更新日志列表页将在下一阶段接入。')
}

function openNotice(title: string) {
  notify(`公告《${title}》详情页将在下一阶段接入。`)
}

function openMirrorGuide() {
  notify('镜像节点接入文档将在分发第二阶段发布。')
}
</script>

<template>
  <section id="updates" class="updates">
    <div class="container updates-grid">
      <div class="panel-card">
        <div class="panel-head">
          <h2>最近更新的模型包</h2>
          <button type="button" class="text-link" @click="openUpdates">
            查看全部
            <AppIcon name="arrow" />
          </button>
        </div>

        <ul class="update-list">
          <li v-for="update in updates" :key="update.id">
            <span class="up-cover">
              <img class="up-art" :src="update.cover" alt="" loading="lazy" />
            </span>
            <div>
              <div class="up-title">
                {{ update.name }}
                <span class="ver">{{ update.version }}</span>
              </div>
              <p class="up-desc">{{ update.note }}</p>
            </div>
            <span class="up-time">{{ update.timeLabel }}</span>
          </li>
        </ul>
      </div>

      <aside id="notices" class="panel-card notice-card">
        <div class="panel-head">
          <h2>站点公告</h2>
        </div>

        <ul class="notice-list">
          <li v-for="notice in notices" :key="notice.id">
            <span v-if="notice.pinned" class="notice-tag">置顶</span>
            <span v-else class="notice-dot" aria-hidden="true" />
            <button type="button" class="notice-link" @click="openNotice(notice.title)">
              {{ notice.title }}
            </button>
            <time>{{ notice.date }}</time>
          </li>
        </ul>

        <div class="notice-cta">
          贡献一份带宽，成为 KfuPet 镜像节点。模型包经 sha256 校验后同步，客户端会自动选择最快的节点。
          <button type="button" class="cta-link" @click="openMirrorGuide">
            了解接入方式
            <AppIcon name="arrow" />
          </button>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.updates {
  padding: 74px 0;
  scroll-margin-top: 92px;
}

.updates-grid {
  display: grid;
  grid-template-columns: 1.5fr 0.9fr;
  gap: 24px;
  align-items: start;
}

.panel-card {
  padding: 28px;
  border-radius: 26px;
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-sm);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 6px;
}

.panel-head h2 {
  font-size: 21px;
  font-weight: 800;
  letter-spacing: -0.015em;
}

.update-list li {
  display: grid;
  grid-template-columns: 52px 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 15px 0;
  border-top: 1px solid var(--line);
}

.update-list li:first-child {
  border-top: 0;
}

.update-list li:last-child {
  padding-bottom: 0;
}

.up-cover {
  width: 52px;
  height: 52px;
  border-radius: 13px;
  overflow: hidden;
  background: var(--bg-soft);
}

.up-art {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.up-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 14px;
  font-weight: 700;
}

.ver {
  padding: 2px 7px;
  border-radius: 6px;
  background: var(--accent-soft);
  color: var(--accent-deep);
  font-size: 10.5px;
  font-weight: 700;
}

.up-desc {
  margin-top: 3px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--muted);
}

.up-time {
  font-size: 11.5px;
  color: #a297a0;
  white-space: nowrap;
}

.notice-card {
  scroll-margin-top: 92px;
}

.notice-list li {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 13px 0;
  border-top: 1px solid var(--line);
  font-size: 13px;
}

.notice-list li:first-child {
  border-top: 0;
}

.notice-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  flex: none;
}

.notice-link {
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font-size: 13px;
  text-align: left;
  transition: color 0.2s;
}

.notice-link:hover {
  color: var(--accent-deep);
}

.notice-list time {
  margin-left: auto;
  font-size: 11.5px;
  color: #a297a0;
}

.notice-tag {
  padding: 2px 5px;
  border-radius: 4px;
  background: var(--accent);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  flex: none;
}

.notice-cta {
  margin-top: 20px;
  padding: 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, #fff3ec, #ffede4);
  border: 1px solid #ffdccb;
  font-size: 12.5px;
  line-height: 1.7;
  color: #7a5b4c;
}

.cta-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--accent-deep);
  font-size: 12.5px;
  font-weight: 700;
}

.cta-link :deep(.icon) {
  width: 13px;
  height: 13px;
}

@media (max-width: 1024px) {
  .updates-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .updates {
    padding: 56px 0;
  }

  .panel-card {
    padding: 20px;
  }

  .up-desc {
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}
</style>
