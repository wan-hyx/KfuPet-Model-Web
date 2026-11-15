<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import { createPost, listPostCategories, type ApiCategory } from '@/api/community'
import { listModels, type ApiModel } from '@/api/models'

const router = useRouter()
const message = useMessage()

const categories = ref<ApiCategory[]>([])
const loading = ref(false)
const error = ref('')

const modelKeyword = ref('')
const modelResults = ref<ApiModel[]>([])
const searchingModels = ref(false)
const selectedModels = ref<ApiModel[]>([])
let searchTimer: number | undefined

const form = reactive({
  title: '',
  categorySlug: 'general',
  tags: '',
  excerpt: '',
  content: '',
})

onMounted(async () => {
  try {
    categories.value = await listPostCategories()
    if (!categories.value.some((item) => item.slug === form.categorySlug) && categories.value[0]) {
      form.categorySlug = categories.value[0].slug
    }
  } catch {
    categories.value = []
  }
})

onBeforeUnmount(() => window.clearTimeout(searchTimer))

function onModelInput() {
  window.clearTimeout(searchTimer)
  const keyword = modelKeyword.value.trim()

  if (!keyword) {
    modelResults.value = []
    searchingModels.value = false
    return
  }

  searchingModels.value = true
  searchTimer = window.setTimeout(() => void searchModels(keyword), 300)
}

async function searchModels(keyword: string) {
  try {
    const result = await listModels({ q: keyword, pageSize: 6 })
    if (modelKeyword.value.trim() === keyword) {
      modelResults.value = result.items
    }
  } catch {
    modelResults.value = []
  } finally {
    searchingModels.value = false
  }
}

function addModel(model: ApiModel) {
  if (selectedModels.value.length >= 3) {
    message.warning('最多关联 3 个模型包')
    return
  }
  if (selectedModels.value.some((item) => item.id === model.id)) return

  selectedModels.value.push(model)
  modelKeyword.value = ''
  modelResults.value = []
}

function removeModel(id: string) {
  selectedModels.value = selectedModels.value.filter((model) => model.id !== id)
}

function validate(): string {
  if (form.title.trim().length < 3) return '标题至少需要 3 个字符'
  if (!form.content.trim()) return '正文不能为空'
  const tags = splitTags()
  if (tags.length > 6) return '最多添加 6 个标签'
  return ''
}

function splitTags(): string[] {
  return form.tags
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
}

async function submit() {
  error.value = validate()
  if (error.value) return

  loading.value = true
  try {
    const post = await createPost({
      title: form.title.trim(),
      content: form.content.trim(),
      excerpt: form.excerpt.trim() || undefined,
      categorySlug: form.categorySlug,
      tags: splitTags(),
      relatedModelIds: selectedModels.value.map((model) => model.id),
    })
    message.success('帖子已发布')
    await router.push(`/community/posts/${post.id}`)
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '发布失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="container form-container">
      <div class="breadcrumb">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/community">社区</RouterLink>
        <span>/</span>
        <span>发布帖子</span>
      </div>

      <div class="page-head">
        <div>
          <h1>发布新帖子</h1>
          <p>
            分享制作过程、使用心得或问题排查。发布前请阅读
            <RouterLink class="inline-link" to="/guidelines/posting">发帖规范</RouterLink>
            。
          </p>
        </div>
      </div>

      <form class="panel form-grid" @submit.prevent="submit">
        <div class="form-field full">
          <label for="post-title">标题</label>
          <input
            id="post-title"
            v-model="form.title"
            class="form-control"
            type="text"
            maxlength="120"
            placeholder="用一句话说清你想分享的内容"
          />
          <span class="form-hint">3-120 个字符，建议带上关键词，方便其他人搜索。</span>
        </div>

        <div class="form-field">
          <label for="post-category">分类</label>
          <select id="post-category" v-model="form.categorySlug" class="form-control">
            <option v-for="category in categories" :key="category.id" :value="category.slug">
              {{ category.name }}
            </option>
          </select>
        </div>

        <div class="form-field">
          <label for="post-tags">标签 <span class="optional">（可选，最多 6 个）</span></label>
          <input
            id="post-tags"
            v-model="form.tags"
            class="form-control"
            type="text"
            placeholder="角色制作, Live2D, 教程"
          />
          <span class="form-hint">用逗号分隔，例如「教程, 模型制作」。</span>
        </div>

        <div class="form-field full">
          <label for="post-excerpt">摘要 <span class="optional">（可选）</span></label>
          <input
            id="post-excerpt"
            v-model="form.excerpt"
            class="form-control"
            type="text"
            maxlength="200"
            placeholder="留空时自动截取正文前 120 个字符"
          />
        </div>

        <div class="form-field full">
          <label for="post-models">
            关联模型包 <span class="optional">（可选，最多 3 个）</span>
          </label>
          <div class="model-picker">
            <input
              id="post-models"
              v-model="modelKeyword"
              class="form-control"
              type="text"
              placeholder="搜索模型包名称，选中后会展示在帖子中"
              autocomplete="off"
              @input="onModelInput"
            />
            <div v-if="searchingModels" class="picker-status">搜索中…</div>
            <div v-else-if="modelResults.length" class="picker-results">
              <button
                v-for="model in modelResults"
                :key="model.id"
                type="button"
                class="picker-item"
                :disabled="selectedModels.some((item) => item.id === model.id)"
                @mousedown.prevent="addModel(model)"
              >
                <span class="picker-cover">
                  <img v-if="model.coverUrl" :src="model.coverUrl" :alt="`${model.name} 封面`" />
                  <AppIcon v-else name="paw" />
                </span>
                <span class="picker-info">
                  <strong>{{ model.name }}</strong>
                  <em>{{ model.author.name }} · {{ model.version ?? 'v1.0.0' }}</em>
                </span>
              </button>
            </div>
          </div>

          <div v-if="selectedModels.length" class="selected-models">
            <span v-for="model in selectedModels" :key="model.id" class="selected-chip">
              {{ model.name }}
              <button type="button" aria-label="移除关联模型" @click="removeModel(model.id)">
                ×
              </button>
            </span>
          </div>
          <span class="form-hint">帖子会展示这些模型包入口，模型详情页也会出现「相关讨论」。</span>
        </div>

        <div class="form-field full">
          <label for="post-content">正文</label>
          <textarea
            id="post-content"
            v-model="form.content"
            class="form-control post-content"
            maxlength="20000"
            placeholder="写下你的经验、步骤或问题描述…"
          />
        </div>

        <p v-if="error" class="form-error full">{{ error }}</p>

        <div class="form-actions full">
          <RouterLink to="/community" class="btn btn-outline">取消</RouterLink>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <AppIcon name="spark" />
            {{ loading ? '发布中…' : '发布帖子' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.form-container {
  max-width: 860px;
}

.form-grid {
  padding: 30px;
}

.post-content {
  min-height: 260px;
}

.inline-link {
  font-weight: 650;
  color: var(--accent-deep);
}

.inline-link:hover {
  text-decoration: underline;
}

.model-picker {
  position: relative;
}

.picker-status {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  font-size: 12px;
  color: var(--muted);
}

.picker-results {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 10;
  max-height: 260px;
  overflow-y: auto;
  padding: 6px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: #fff;
  box-shadow: var(--shadow-md);
}

.picker-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px;
  border: 0;
  border-radius: 9px;
  background: none;
  text-align: left;
}

.picker-item:hover:not(:disabled) {
  background: var(--bg-soft);
}

.picker-item:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.picker-cover {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  overflow: hidden;
  border-radius: 8px;
  background: var(--bg-soft);
  color: var(--muted);
}

.picker-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.picker-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.picker-info strong {
  font-size: 13px;
  color: var(--ink);
}

.picker-info em {
  font-style: normal;
  font-size: 11px;
  color: var(--muted);
}

.selected-models {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.selected-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px 4px 11px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-deep);
  font-size: 12px;
  font-weight: 600;
}

.selected-chip button {
  display: grid;
  place-items: center;
  width: 17px;
  height: 17px;
  border: 0;
  border-radius: 999px;
  background: rgba(238, 79, 43, 0.14);
  color: var(--accent-deep);
  font-size: 13px;
  line-height: 1;
}

.selected-chip button:hover {
  background: rgba(238, 79, 43, 0.26);
}

.form-error.full {
  grid-column: 1 / -1;
}

.form-actions.full {
  grid-column: 1 / -1;
}

.form-actions .btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}
</style>
