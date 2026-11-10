<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { NSpin, useMessage } from 'naive-ui'
import { useRoute } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import {
  createModelVersion,
  downloadUrl,
  getModel,
  listModelVersions,
  type ApiModel,
  type ApiModelVersion,
} from '@/api/models'
import { isAdmin, isLoggedIn, session } from '@/stores/session'
import {
  formatCount,
  formatDate,
  formatSize,
} from '@/utils/format'

const route = useRoute()
const message = useMessage()

const model = ref<ApiModel | null>(null)
const versions = ref<ApiModelVersion[]>([])
const loading = ref(true)
const error = ref('')

const showUpload = ref(false)
const uploading = ref(false)
const uploadError = ref('')
const versionFile = ref<File | null>(null)

const versionForm = reactive({
  version: '',
  changelog: '',
  minClientVersion: '',
})

const modelId = computed(() => String(route.params.id))
const latestVersion = computed(() => versions.value[0] ?? model.value?.latestVersion ?? null)
const canManage = computed(
  () =>
    isLoggedIn.value &&
    model.value !== null &&
    (model.value.author.id === session.user?.id || isAdmin.value),
)

onMounted(load)

async function load() {
  loading.value = true
  error.value = ''

  try {
    const [modelData, versionData] = await Promise.all([
      getModel(modelId.value),
      listModelVersions(modelId.value),
    ])
    model.value = modelData
    versions.value = versionData
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '模型包加载失败'
  } finally {
    loading.value = false
  }
}

function onVersionFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  uploadError.value = ''

  if (file && !file.name.toLowerCase().endsWith('.kfupet')) {
    uploadError.value = '模型包文件需为 .kfupet 格式'
    input.value = ''
    versionFile.value = null
    return
  }

  versionFile.value = file
}

async function submitVersion() {
  uploadError.value = ''

  if (!/^v?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(versionForm.version.trim())) {
    uploadError.value = '版本号需符合 1.0.0 或 v1.0.0 格式'
    return
  }
  if (!versionForm.changelog.trim()) {
    uploadError.value = '请填写更新日志'
    return
  }
  if (!versionFile.value) {
    uploadError.value = '请选择 .kfupet 模型包文件'
    return
  }

  uploading.value = true
  try {
    await createModelVersion(modelId.value, {
      version: versionForm.version.trim(),
      changelog: versionForm.changelog.trim(),
      minClientVersion: versionForm.minClientVersion.trim() || undefined,
      packageFile: versionFile.value,
    })
    message.success('新版本已上传')
    showUpload.value = false
    versionForm.version = ''
    versionForm.changelog = ''
    versionForm.minClientVersion = ''
    versionFile.value = null
    await load()
  } catch (reason) {
    uploadError.value = reason instanceof Error ? reason.message : '上传失败'
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="container detail-container">
      <div class="breadcrumb">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/models">模型包</RouterLink>
        <span>/</span>
        <span>详情</span>
      </div>

      <div v-if="loading" class="loading-state"><NSpin /></div>

      <div v-else-if="error" class="empty-state">
        <p>{{ error }}</p>
        <RouterLink to="/models" class="btn btn-outline retry-link">返回模型包列表</RouterLink>
      </div>

      <template v-else-if="model">
        <section class="panel model-hero">
          <div class="hero-cover">
            <img
              v-if="model.coverUrl"
              :src="model.coverUrl"
              :alt="`模型包「${model.name}」封面`"
            />
            <div v-else class="cover-fallback"><AppIcon name="paw" /></div>
          </div>

          <div class="hero-info">
            <div class="hero-badges">
              <span class="cat">{{ model.category.name }}</span>
              <span class="version-pill">{{ latestVersion?.version ?? model.version ?? 'v1.0.0' }}</span>
            </div>

            <h1>{{ model.name }}</h1>
            <p class="hero-summary">{{ model.summary }}</p>

            <div class="hero-author">
              <UserAvatar
                :name="model.author.name"
                :avatar-url="model.author.avatarUrl"
                :seed="model.author.id"
              />
              <span>
                <strong>{{ model.author.name }}</strong>
                <em>发布于 {{ formatDate(model.publishedAt) }}</em>
              </span>
            </div>

            <div v-if="model.tags.length" class="tag-row">
              <span v-for="tag in model.tags" :key="tag" class="meta-tag">#{{ tag }}</span>
            </div>

            <dl class="stat-row">
              <div>
                <dt>累计下载</dt>
                <dd>{{ formatCount(model.downloads) }}</dd>
              </div>
              <div>
                <dt>最新版本</dt>
                <dd>{{ latestVersion?.version ?? '—' }}</dd>
              </div>
              <div>
                <dt>文件大小</dt>
                <dd>{{ formatSize(latestVersion?.sizeBytes ?? model.sizeBytes) }}</dd>
              </div>
            </dl>

            <div class="hero-actions">
              <a
                v-if="latestVersion"
                class="btn btn-primary"
                :href="downloadUrl(model.id, latestVersion.id)"
                :download="`${model.name}-${latestVersion.version}.kfupet`"
              >
                <AppIcon name="download" />
                下载 {{ latestVersion.version }}
              </a>
              <button
                v-if="canManage"
                type="button"
                class="btn btn-outline"
                @click="showUpload = !showUpload"
              >
                {{ showUpload ? '收起上传' : '上传新版本' }}
              </button>
            </div>
          </div>
        </section>

        <section class="panel detail-panel">
          <h2>模型说明</h2>
          <p class="description">{{ model.description }}</p>
        </section>

        <form v-if="canManage && showUpload" class="panel upload-panel" @submit.prevent="submitVersion">
          <h2>上传新版本</h2>
          <p class="upload-sub">新版本发布后会立即更新公开下载入口，并记录在版本历史中。</p>

          <div class="form-grid">
            <div class="form-field">
              <label for="new-version">版本号</label>
              <input
                id="new-version"
                v-model="versionForm.version"
                class="form-control"
                type="text"
                placeholder="1.1.0"
              />
            </div>

            <div class="form-field">
              <label for="new-min-client">最低客户端版本 <span class="optional">（可选）</span></label>
              <input
                id="new-min-client"
                v-model="versionForm.minClientVersion"
                class="form-control"
                type="text"
                maxlength="32"
                placeholder="例如 0.2.0"
              />
            </div>

            <div class="form-field full">
              <label for="new-changelog">更新日志</label>
              <textarea
                id="new-changelog"
                v-model="versionForm.changelog"
                class="form-control"
                maxlength="5000"
                placeholder="这次更新了哪些内容？"
              />
            </div>

            <div class="form-field full">
              <label for="new-package">模型包文件</label>
              <input
                id="new-package"
                class="form-control"
                type="file"
                accept=".kfupet"
                @change="onVersionFileChange"
              />
              <span v-if="versionFile" class="form-hint">
                {{ versionFile.name }} · {{ formatSize(versionFile.size) }}
              </span>
            </div>

            <p v-if="uploadError" class="form-error full">{{ uploadError }}</p>

            <div class="form-actions full">
              <button type="button" class="btn btn-outline" @click="showUpload = false">取消</button>
              <button type="submit" class="btn btn-primary" :disabled="uploading">
                {{ uploading ? '上传中…' : '发布新版本' }}
              </button>
            </div>
          </div>
        </form>

        <section class="versions">
          <div class="versions-head">
            <h2>版本历史</h2>
            <span>{{ versions.length }} 个版本</span>
          </div>

          <div class="version-list">
            <article v-for="(version, index) in versions" :key="version.id" class="panel version-item">
              <div class="version-head">
                <div class="version-title">
                  <strong>{{ version.version }}</strong>
                  <span v-if="index === 0" class="latest-badge">最新</span>
                </div>
                <a class="version-download" :href="downloadUrl(model.id, version.id)">
                  <AppIcon name="download" />
                  下载
                </a>
              </div>

              <div class="version-meta">
                <span>{{ formatDate(version.createdAt) }}</span>
                <span>{{ formatSize(version.sizeBytes) }}</span>
                <span>{{ formatCount(version.downloads) }} 次下载</span>
                <span v-if="version.minClientVersion">
                  需要客户端 {{ version.minClientVersion }}+
                </span>
              </div>

              <p class="changelog">{{ version.changelog }}</p>

              <div class="sha">SHA-256 · {{ version.sha256 }}</div>
            </article>

            <p v-if="!versions.length" class="empty-state">还没有已发布的版本。</p>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.detail-container {
  max-width: 960px;
}

.model-hero {
  display: grid;
  grid-template-columns: 0.95fr 1.05fr;
  gap: 30px;
  padding: 24px;
}

.hero-cover {
  overflow: hidden;
  border-radius: 16px;
  aspect-ratio: 16 / 11;
  background: var(--bg-soft);
}

.hero-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  width: 52px;
  height: 52px;
  opacity: 0.75;
}

.hero-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 4px;
}

.hero-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.cat {
  padding: 4px 11px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-deep);
  font-size: 11.5px;
  font-weight: 700;
}

.version-pill {
  padding: 4px 10px;
  border-radius: 8px;
  background: var(--ink);
  color: #fff;
  font-size: 11.5px;
  font-weight: 650;
}

.hero-info h1 {
  font-size: clamp(28px, 3.2vw, 38px);
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.22;
}

.hero-summary {
  font-size: 14.5px;
  line-height: 1.8;
  color: var(--muted);
}

.hero-author {
  display: flex;
  align-items: center;
  gap: 9px;
}

.hero-author strong {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-soft);
}

.hero-author em {
  display: block;
  font-style: normal;
  font-size: 11.5px;
  color: #9a918f;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.meta-tag {
  padding: 3px 9px;
  border-radius: 7px;
  background: #f6efe6;
  color: #8a7460;
  font-size: 11.5px;
}

.stat-row {
  display: flex;
  gap: 26px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.stat-row dt {
  font-size: 11px;
  color: #9a918f;
}

.stat-row dd {
  margin-top: 2px;
  font-size: 17px;
  font-weight: 750;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: auto;
  padding-top: 8px;
}

.detail-panel {
  margin-top: 22px;
}

.detail-panel h2 {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.015em;
  margin-bottom: 12px;
}

.description {
  font-size: 14.5px;
  line-height: 1.95;
  color: var(--ink-soft);
  white-space: pre-wrap;
  word-break: break-word;
}

.upload-panel {
  margin-top: 22px;
}

.upload-panel h2 {
  font-size: 18px;
  font-weight: 800;
}

.upload-sub {
  margin: 6px 0 20px;
  font-size: 13px;
  color: var(--muted);
}

.upload-panel .form-error.full,
.upload-panel .form-actions.full {
  grid-column: 1 / -1;
}

.upload-panel .btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.versions {
  margin-top: 34px;
}

.versions-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
}

.versions-head h2 {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.versions-head span {
  font-size: 12.5px;
  color: #9a918f;
}

.version-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.version-item {
  padding: 20px 24px;
}

.version-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.version-title {
  display: flex;
  align-items: center;
  gap: 9px;
}

.version-title strong {
  font-size: 16px;
  font-weight: 750;
}

.latest-badge {
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--teal-soft);
  color: #087a65;
  font-size: 10.5px;
  font-weight: 700;
}

.version-download {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  font-weight: 650;
  color: var(--accent-deep);
}

.version-download :deep(.icon) {
  width: 13px;
  height: 13px;
}

.version-download:hover {
  text-decoration: underline;
}

.version-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 8px;
  font-size: 12px;
  color: #9a918f;
}

.changelog {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--line);
  font-size: 13.5px;
  line-height: 1.8;
  color: var(--ink-soft);
  white-space: pre-wrap;
  word-break: break-word;
}

.sha {
  margin-top: 10px;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 11px;
  color: #a79e9a;
  word-break: break-all;
}

.retry-link {
  margin-top: 16px;
}

@media (max-width: 860px) {
  .model-hero {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .hero-info {
    padding: 0 2px;
  }
}
</style>
