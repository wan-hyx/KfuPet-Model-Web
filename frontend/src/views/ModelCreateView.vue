<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useMessage } from 'naive-ui'
import AppIcon from '@/components/ui/AppIcon.vue'
import { createModel, listModelCategories, type ApiCategory, type ApiModel } from '@/api/models'
import { isAdmin } from '@/stores/session'

const message = useMessage()

const categories = ref<ApiCategory[]>([])
const packageFile = ref<File | null>(null)
const coverFile = ref<File | null>(null)
const loading = ref(false)
const error = ref('')
const created = ref<ApiModel | null>(null)

const form = reactive({
  name: '',
  summary: '',
  description: '',
  categorySlug: '',
  tags: '',
  version: '1.0.0',
  changelog: '',
  minClientVersion: '',
})

const packageSizeLabel = computed(() => {
  if (!packageFile.value) return ''
  const mb = packageFile.value.size / 1024 / 1024
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(packageFile.value.size / 1024, 0.1).toFixed(1)} KB`
})

onMounted(async () => {
  try {
    categories.value = await listModelCategories()
    if (categories.value[0]) form.categorySlug = categories.value[0].slug
  } catch {
    categories.value = []
  }
})

function onPackageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  error.value = ''

  if (file && !file.name.toLowerCase().endsWith('.kfupet')) {
    error.value = '模型包文件需为 .kfupet 格式'
    input.value = ''
    packageFile.value = null
    return
  }

  packageFile.value = file
}

function onCoverChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  error.value = ''

  if (file && !/\.(png|jpg|jpeg|webp|svg)$/i.test(file.name)) {
    error.value = '封面仅支持 PNG / JPG / WebP / SVG'
    input.value = ''
    coverFile.value = null
    return
  }

  coverFile.value = file
}

function validate(): string {
  if (form.name.trim().length < 2) return '模型包名称至少需要 2 个字符'
  if (form.summary.trim().length < 2) return '请填写一句简介'
  if (!form.description.trim()) return '请填写详细说明'
  if (!form.categorySlug) return '请选择分类'
  if (!/^v?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(form.version.trim())) {
    return '版本号需符合 1.0.0 或 v1.0.0 格式'
  }
  if (!form.changelog.trim()) return '请填写更新日志'
  if (!packageFile.value) return '请选择 .kfupet 模型包文件'
  return ''
}

async function submit() {
  error.value = validate()
  if (error.value) return

  loading.value = true
  try {
    created.value = await createModel({
      name: form.name.trim(),
      summary: form.summary.trim(),
      description: form.description.trim(),
      categorySlug: form.categorySlug,
      tags: form.tags.trim(),
      version: form.version.trim(),
      changelog: form.changelog.trim(),
      minClientVersion: form.minClientVersion.trim() || undefined,
      packageFile: packageFile.value as File,
      coverFile: coverFile.value,
    })
    message.success('模型包已提交审核')
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '上传失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function uploadAgain() {
  created.value = null
  error.value = ''
  form.name = ''
  form.summary = ''
  form.description = ''
  form.tags = ''
  form.version = '1.0.0'
  form.changelog = ''
  form.minClientVersion = ''
  packageFile.value = null
  coverFile.value = null
}
</script>

<template>
  <div class="page">
    <div class="container form-container">
      <div class="breadcrumb">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/models">模型包</RouterLink>
        <span>/</span>
        <span>上传模型包</span>
      </div>

      <div v-if="created" class="panel success-panel">
        <span class="success-mark"><AppIcon name="check" /></span>
        <h1>已提交审核</h1>
        <p>
          「{{ created.name }}」已进入人工审核队列。审核通过后会出现在公开的模型包列表中，并开放下载。
        </p>
        <div class="success-actions">
          <RouterLink to="/me/models" class="btn btn-primary">查看我的模型</RouterLink>
          <RouterLink to="/models" class="btn btn-outline">返回模型包列表</RouterLink>
          <RouterLink v-if="isAdmin" to="/admin/models" class="btn btn-outline">前往审核</RouterLink>
          <button type="button" class="btn btn-ghost" @click="uploadAgain">继续上传</button>
        </div>
      </div>

      <template v-else>
        <div class="page-head">
          <div>
            <h1>上传模型包</h1>
            <p>
              填写模型信息并上传 .kfupet 文件。提交后将进入人工审核，通过后才会公开发布，请先阅读
              <RouterLink class="inline-link" to="/guidelines/review">审核规则</RouterLink>
              。
            </p>
          </div>
        </div>

        <form class="panel form-grid" enctype="multipart/form-data" @submit.prevent="submit">
          <div class="form-field">
            <label for="model-name">模型包名称</label>
            <input
              id="model-name"
              v-model="form.name"
              class="form-control"
              type="text"
              maxlength="80"
              placeholder="例如 雪团 · 猫娘"
            />
          </div>

          <div class="form-field">
            <label for="model-category">分类</label>
            <select id="model-category" v-model="form.categorySlug" class="form-control">
              <option v-for="category in categories" :key="category.id" :value="category.slug">
                {{ category.name }}
              </option>
            </select>
          </div>

          <div class="form-field full">
            <label for="model-summary">一句话简介</label>
            <input
              id="model-summary"
              v-model="form.summary"
              class="form-control"
              type="text"
              maxlength="200"
              placeholder="用一句话介绍这个模型包的特点"
            />
          </div>

          <div class="form-field full">
            <label for="model-description">详细说明</label>
            <textarea
              id="model-description"
              v-model="form.description"
              class="form-control"
              maxlength="20000"
              placeholder="角色设定、动作数量、贴图规格、使用注意事项…"
            />
          </div>

          <div class="form-field">
            <label for="model-version">版本号</label>
            <input
              id="model-version"
              v-model="form.version"
              class="form-control"
              type="text"
              placeholder="1.0.0"
            />
            <span class="form-hint">符合 1.0.0 或 v1.0.0 格式。</span>
          </div>

          <div class="form-field">
            <label for="model-min-client">最低客户端版本 <span class="optional">（可选）</span></label>
            <input
              id="model-min-client"
              v-model="form.minClientVersion"
              class="form-control"
              type="text"
              maxlength="32"
              placeholder="例如 0.2.0"
            />
          </div>

          <div class="form-field full">
            <label for="model-tags">标签 <span class="optional">（可选）</span></label>
            <input
              id="model-tags"
              v-model="form.tags"
              class="form-control"
              type="text"
              maxlength="200"
              placeholder="猫娘, 日常, Live2D"
            />
            <span class="form-hint">用逗号分隔，最多 6 个标签。</span>
          </div>

          <div class="form-field full">
            <label for="model-changelog">更新日志</label>
            <textarea
              id="model-changelog"
              v-model="form.changelog"
              class="form-control changelog"
              maxlength="5000"
              placeholder="首个版本包含哪些内容？后续版本在这里记录改动。"
            />
          </div>

          <div class="form-field">
            <label for="model-package">模型包文件 <span class="optional">（.kfupet）</span></label>
            <input
              id="model-package"
              class="form-control"
              type="file"
              accept=".kfupet"
              required
              @change="onPackageChange"
            />
            <span class="form-hint">
              {{ packageFile ? `${packageFile.name} · ${packageSizeLabel}` : '必填，仅支持 .kfupet 格式。' }}
            </span>
          </div>

          <div class="form-field">
            <label for="model-cover">封面图 <span class="optional">（可选）</span></label>
            <input
              id="model-cover"
              class="form-control"
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.svg"
              @change="onCoverChange"
            />
            <span class="form-hint">
              {{ coverFile ? coverFile.name : '支持 PNG / JPG / WebP / SVG，建议 16:11 比例。' }}
            </span>
          </div>

          <p v-if="error" class="form-error full">{{ error }}</p>

          <div class="form-actions full">
            <RouterLink to="/models" class="btn btn-outline">取消</RouterLink>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <AppIcon name="check" />
              {{ loading ? '上传中…' : '提交审核' }}
            </button>
          </div>
        </form>
      </template>
    </div>
  </div>
</template>

<style scoped>
.form-container {
  max-width: 900px;
}

.form-grid {
  padding: 30px;
}

.changelog {
  min-height: 120px;
}

.inline-link {
  font-weight: 650;
  color: var(--accent-deep);
}

.inline-link:hover {
  text-decoration: underline;
}

.form-error.full,
.form-actions.full {
  grid-column: 1 / -1;
}

.form-actions .btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.success-panel {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 44px;
}

.success-mark {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: var(--teal-soft);
  color: var(--teal);
}

.success-mark :deep(.icon) {
  width: 26px;
  height: 26px;
}

.success-panel h1 {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.success-panel p {
  max-width: 560px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--muted);
}

.success-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}

@media (max-width: 640px) {
  .success-panel {
    padding: 26px;
  }
}
</style>
