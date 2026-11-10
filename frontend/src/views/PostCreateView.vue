<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import { createPost, listPostCategories, type ApiCategory } from '@/api/community'

const router = useRouter()
const message = useMessage()

const categories = ref<ApiCategory[]>([])
const loading = ref(false)
const error = ref('')

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
