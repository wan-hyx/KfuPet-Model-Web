<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { NSpin, useMessage } from 'naive-ui'
import AppIcon from '@/components/ui/AppIcon.vue'
import {
  fetchMyProfile,
  fetchUserProfile,
  updateMyProfile,
  uploadAvatar,
  uploadCover,
  type MyProfile,
  type PublicProfile,
} from '@/api/users'
import { patchSessionUser, session } from '@/stores/session'
import {
  formatCount,
  formatDate,
  initialOf,
  relativeTime,
  toneFromId,
} from '@/utils/format'

const message = useMessage()

const profile = ref<MyProfile | null>(null)
const publicProfile = ref<PublicProfile | null>(null)
const loading = ref(true)
const error = ref('')

const editing = ref(false)
const saving = ref(false)
const saveError = ref('')
const avatarFile = ref<File | null>(null)
const avatarPreview = ref('')
const avatarInput = ref<HTMLInputElement | null>(null)
const coverFile = ref<File | null>(null)
const coverPreview = ref('')
const coverInput = ref<HTMLInputElement | null>(null)
const useDefaultCover = ref(false)
const coverPositionX = ref(50)
const coverPositionY = ref(50)
const coverPreviewBox = ref<HTMLElement | null>(null)
const draggingCover = ref(false)
let coverDragStart: { x: number; y: number; posX: number; posY: number } | null = null

const form = reactive({
  displayName: '',
  bio: '',
})

const displayName = computed(() => profile.value?.name ?? session.user?.name ?? '')
const avatarUrl = computed(() => profile.value?.avatarUrl ?? session.user?.avatarUrl ?? null)
const heroCoverUrl = computed(
  () => coverPreview.value || profile.value?.coverUrl || '',
)
const previewCoverUrl = computed(() => {
  if (coverPreview.value) return coverPreview.value
  if (useDefaultCover.value) return ''
  return profile.value?.coverUrl || ''
})
const coverObjectPosition = computed(
  () => `${coverPositionX.value}% ${coverPositionY.value}%`,
)
const isAdminUser = computed(() => profile.value?.role === 'ADMIN')
const stats = computed(() => publicProfile.value?.stats ?? { posts: 0, models: 0, downloads: 0 })
const recentPosts = computed(() => publicProfile.value?.posts ?? [])
const recentModels = computed(() => publicProfile.value?.models ?? [])

onMounted(load)

async function load() {
  loading.value = true
  error.value = ''

  try {
    const me = await fetchMyProfile()
    profile.value = me
    syncCoverPosition(me.coverPosition)

    try {
      publicProfile.value = await fetchUserProfile(me.id)
    } catch {
      publicProfile.value = null
    }
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '个人信息加载失败'
  } finally {
    loading.value = false
  }
}

function startEdit() {
  if (!profile.value) return
  form.displayName = profile.value.name
  form.bio = profile.value.bio ?? ''
  avatarFile.value = null
  coverFile.value = null
  useDefaultCover.value = false
  syncCoverPosition(profile.value.coverPosition)
  clearAvatarPreview()
  clearCoverPreview()
  saveError.value = ''
  editing.value = true
}

function syncCoverPosition(value: string | null | undefined) {
  const matched = /^(\d{1,3})% (\d{1,3})%$/.exec(value ?? '')
  coverPositionX.value = matched ? Math.min(100, Number(matched[1])) : 50
  coverPositionY.value = matched ? Math.min(100, Number(matched[2])) : 50
}

function clearAvatarPreview() {
  if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value)
  avatarPreview.value = ''
}

function clearCoverPreview() {
  if (coverPreview.value) URL.revokeObjectURL(coverPreview.value)
  coverPreview.value = ''
}

function cancelEdit() {
  editing.value = false
  saveError.value = ''
  avatarFile.value = null
  coverFile.value = null
  useDefaultCover.value = false
  clearAvatarPreview()
  clearCoverPreview()
}

function onAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null

  saveError.value = ''
  avatarFile.value = null
  clearAvatarPreview()

  if (!file) return

  if (!/\.(jpe?g|png|webp)$/i.test(file.name)) {
    saveError.value = '头像仅支持 JPG / PNG / WebP 格式'
    input.value = ''
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    saveError.value = '头像图片不能超过 5 MB'
    input.value = ''
    return
  }

  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

function onCoverChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null

  saveError.value = ''
  coverFile.value = null
  clearCoverPreview()

  if (!file) return

  if (!/\.(jpe?g|png|webp)$/i.test(file.name)) {
    saveError.value = '背景仅支持 JPG / PNG / WebP 格式'
    input.value = ''
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    saveError.value = '背景图片不能超过 10 MB'
    input.value = ''
    return
  }

  coverFile.value = file
  coverPreview.value = URL.createObjectURL(file)
  useDefaultCover.value = false
  syncCoverPosition('50% 50%')
}

function resetCover() {
  coverFile.value = null
  clearCoverPreview()
  useDefaultCover.value = true
  syncCoverPosition('50% 50%')
  if (coverInput.value) coverInput.value.value = ''
}

function clampCoverPosition(value: number) {
  return Math.round(Math.min(100, Math.max(0, value)))
}

function startCoverDrag(event: PointerEvent) {
  if (!previewCoverUrl.value) return

  const target = event.currentTarget as HTMLElement
  target.setPointerCapture(event.pointerId)
  coverDragStart = {
    x: event.clientX,
    y: event.clientY,
    posX: coverPositionX.value,
    posY: coverPositionY.value,
  }
  draggingCover.value = true
}

function moveCoverDrag(event: PointerEvent) {
  if (!coverDragStart || !coverPreviewBox.value) return

  const rect = coverPreviewBox.value.getBoundingClientRect()
  const deltaX = ((event.clientX - coverDragStart.x) / rect.width) * 100
  const deltaY = ((event.clientY - coverDragStart.y) / rect.height) * 100
  coverPositionX.value = clampCoverPosition(coverDragStart.posX - deltaX)
  coverPositionY.value = clampCoverPosition(coverDragStart.posY - deltaY)
}

function endCoverDrag(event: PointerEvent) {
  if (!coverDragStart) return

  coverDragStart = null
  draggingCover.value = false

  const target = event.currentTarget as HTMLElement
  if (target.hasPointerCapture(event.pointerId)) {
    target.releasePointerCapture(event.pointerId)
  }
}

onBeforeUnmount(clearAvatarPreview)
onBeforeUnmount(clearCoverPreview)

async function save() {
  if (!profile.value) return

  const name = form.displayName.trim()
  const bio = form.bio.trim()

  if (!name) {
    saveError.value = '昵称不能为空'
    return
  }
  if (name.length > 32) {
    saveError.value = '昵称不能超过 32 个字符'
    return
  }
  if (bio.length > 280) {
    saveError.value = '个人简介不能超过 280 个字符'
    return
  }

  saving.value = true
  try {
    if (avatarFile.value) {
      const withAvatar = await uploadAvatar(avatarFile.value)
      profile.value = withAvatar
      patchSessionUser({ avatarUrl: withAvatar.avatarUrl })
      avatarFile.value = null
      clearAvatarPreview()
    }

    if (coverFile.value) {
      const withCover = await uploadCover(coverFile.value)
      profile.value = withCover
      coverFile.value = null
      useDefaultCover.value = false
      clearCoverPreview()
    }

    const updated = await updateMyProfile({
      displayName: name,
      bio,
      ...(useDefaultCover.value
        ? { coverUrl: '' }
        : previewCoverUrl.value
          ? { coverPosition: coverObjectPosition.value }
          : {}),
    })
    profile.value = updated
    syncCoverPosition(updated.coverPosition)
    if (publicProfile.value) {
      publicProfile.value = {
        ...publicProfile.value,
        name: updated.name,
        avatarUrl: updated.avatarUrl,
        bio: updated.bio,
      }
    }
    patchSessionUser({ name: updated.name, avatarUrl: updated.avatarUrl })
    editing.value = false
    message.success('个人信息已更新')
  } catch (reason) {
    saveError.value = reason instanceof Error ? reason.message : '保存失败，请稍后重试'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="container profile-container">
      <div class="breadcrumb">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <span>个人信息</span>
      </div>

      <div v-if="loading" class="loading-state"><NSpin /></div>

      <div v-else-if="error" class="empty-state">
        <p>{{ error }}</p>
        <RouterLink to="/login" class="btn btn-outline retry-link">重新登录</RouterLink>
      </div>

      <template v-else-if="profile">
        <section class="panel profile-hero">
          <div class="profile-cover">
            <img
              v-if="heroCoverUrl"
              :src="heroCoverUrl"
              alt="个人主页背景"
              class="cover-img"
              :style="{ objectPosition: coverObjectPosition }"
            />
            <div
              v-else
              class="cover-fallback"
              :class="`cover-tone-${toneFromId(profile.id)}`"
              aria-hidden="true"
            >
              <span class="cover-orb cover-orb-a"></span>
              <span class="cover-orb cover-orb-b"></span>
              <AppIcon name="paw" class="cover-paw" />
            </div>
            <span class="cover-shade"></span>
          </div>

          <div class="profile-hero-body">
            <span v-if="avatarUrl" class="avatar avatar-lg avatar-img">
              <img :src="avatarUrl" :alt="`${displayName} 的头像`" />
            </span>
            <span v-else class="avatar avatar-lg" :class="`av-${toneFromId(profile.id)}`">
              {{ initialOf(displayName) }}
            </span>

            <div class="hero-main">
              <div class="name-row">
                <h1>{{ displayName }}</h1>
                <span class="role-badge" :class="{ admin: isAdminUser }">
                  {{ isAdminUser ? '管理员' : '社区成员' }}
                </span>
              </div>
              <p class="username">@{{ profile.username }}</p>
              <p class="meta-line">
                <span v-if="profile.email">{{ profile.email }}</span>
                <span v-if="profile.createdAt">加入于 {{ formatDate(profile.createdAt) }}</span>
              </p>
              <p class="bio">{{ profile.bio || '还没有填写个人简介，介绍一下自己吧。' }}</p>
            </div>

            <div class="hero-actions">
              <button v-if="!editing" type="button" class="btn btn-outline" @click="startEdit">
                编辑资料
              </button>
              <RouterLink to="/me/models" class="btn btn-ghost">我的模型</RouterLink>
            </div>

            <div class="stat-row">
              <div>
                <strong>{{ formatCount(stats.posts) }}</strong>
                <span>发布的帖子</span>
              </div>
              <div>
                <strong>{{ formatCount(stats.models) }}</strong>
                <span>公开模型包</span>
              </div>
              <div>
                <strong>{{ formatCount(stats.downloads) }}</strong>
                <span>模型累计下载</span>
              </div>
            </div>
          </div>
        </section>

        <form v-if="editing" class="panel edit-panel" @submit.prevent="save">
          <h2>编辑个人信息</h2>

          <div class="form-grid">
            <div class="form-field">
              <label for="profile-name">昵称</label>
              <input
                id="profile-name"
                v-model="form.displayName"
                class="form-control"
                type="text"
                maxlength="32"
                placeholder="展示在帖子与模型包上的名称"
              />
            </div>

            <div class="form-field">
              <label>头像</label>
              <div class="avatar-upload">
                <span
                  class="avatar avatar-md"
                  :class="avatarPreview || avatarUrl ? 'avatar-img' : `av-${toneFromId(profile.id)}`"
                >
                  <img
                    v-if="avatarPreview || avatarUrl"
                    :src="avatarPreview || avatarUrl || ''"
                    alt="头像预览"
                  />
                  <template v-else>{{ initialOf(form.displayName || displayName) }}</template>
                </span>

                <div class="avatar-actions">
                  <button
                    type="button"
                    class="btn btn-outline avatar-btn"
                    @click="avatarInput?.click()"
                  >
                    <AppIcon name="spark" />
                    选择头像图片
                  </button>
                  <span class="form-hint">
                    {{ avatarFile ? avatarFile.name : '支持 JPG / PNG / WebP，最大 5 MB' }}
                  </span>
                </div>

                <input
                  ref="avatarInput"
                  class="avatar-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  @change="onAvatarChange"
                />
              </div>
              <span class="form-hint">选择图片后点击「保存修改」生效。</span>
            </div>

            <div class="form-field full">
              <label>主页背景</label>
              <div class="cover-upload">
                <div
                  v-if="previewCoverUrl"
                  ref="coverPreviewBox"
                  class="cover-preview-stage"
                  :class="{ dragging: draggingCover }"
                  @pointerdown="startCoverDrag"
                  @pointermove="moveCoverDrag"
                  @pointerup="endCoverDrag"
                  @pointercancel="endCoverDrag"
                >
                  <img
                    :src="previewCoverUrl"
                    alt="背景预览"
                    :style="{ objectPosition: coverObjectPosition }"
                    draggable="false"
                  />
                  <span class="cover-drag-hint">拖动图片调整显示位置</span>
                </div>
                <span
                  v-else
                  class="cover-preview"
                  :class="`cover-tone-${toneFromId(profile.id)}`"
                >
                  <span class="cover-preview-empty">默认背景</span>
                </span>

                <div class="avatar-actions">
                  <div class="cover-buttons">
                    <button
                      type="button"
                      class="btn btn-outline avatar-btn"
                      @click="coverInput?.click()"
                    >
                      <AppIcon name="spark" />
                      选择背景图片
                    </button>
                    <button
                      v-if="previewCoverUrl"
                      type="button"
                      class="btn btn-ghost avatar-btn"
                      @click="resetCover"
                    >
                      使用默认背景
                    </button>
                  </div>
                  <span class="form-hint">
                    {{ coverFile ? coverFile.name : '支持 JPG / PNG / WebP，最大 10 MB，建议 16:9 横图' }}
                  </span>
                </div>

                <input
                  ref="coverInput"
                  class="avatar-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  @change="onCoverChange"
                />
              </div>
              <span class="form-hint">背景会显示在个人信息页顶部，选择图片后点击「保存修改」生效。</span>
            </div>

            <div class="form-field full">
              <label for="profile-bio">个人简介 <span class="optional">（最多 280 字）</span></label>
              <textarea
                id="profile-bio"
                v-model="form.bio"
                class="form-control bio-input"
                maxlength="280"
                placeholder="介绍一下你的创作方向，例如：Live2D 角色制作 / 像素风模型"
              />
            </div>

            <p v-if="saveError" class="form-error full">{{ saveError }}</p>

            <div class="form-actions full">
              <button type="button" class="btn btn-outline" :disabled="saving" @click="cancelEdit">
                取消
              </button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <AppIcon name="check" />
                {{ saving ? '保存中…' : '保存修改' }}
              </button>
            </div>
          </div>
        </form>

        <div class="activity-grid">
          <section class="panel activity-panel">
            <div class="activity-head">
              <h2>最近帖子</h2>
              <RouterLink to="/community/new" class="text-link">
                发帖
                <AppIcon name="arrow" />
              </RouterLink>
            </div>

            <ul v-if="recentPosts.length" class="activity-list">
              <li v-for="post in recentPosts" :key="post.id">
                <RouterLink :to="`/community/posts/${post.id}`" class="activity-item">
                  <span class="activity-title">{{ post.title }}</span>
                  <span class="activity-time">{{ relativeTime(post.createdAt) }}</span>
                </RouterLink>
              </li>
            </ul>
            <p v-else class="activity-empty">还没有发布过帖子。</p>
          </section>

          <section class="panel activity-panel">
            <div class="activity-head">
              <h2>最近模型</h2>
              <RouterLink to="/me/models" class="text-link">
                管理
                <AppIcon name="arrow" />
              </RouterLink>
            </div>

            <ul v-if="recentModels.length" class="activity-list">
              <li v-for="model in recentModels" :key="model.id">
                <RouterLink :to="`/models/${model.id}`" class="activity-item model-item">
                  <span class="model-thumb">
                    <img v-if="model.coverUrl" :src="model.coverUrl" :alt="model.name" />
                    <AppIcon v-else name="paw" />
                  </span>
                  <span class="activity-title">{{ model.name }}</span>
                  <span class="activity-time">
                    <AppIcon name="download" />
                    {{ formatCount(model.downloadCount) }}
                  </span>
                </RouterLink>
              </li>
            </ul>
            <p v-else class="activity-empty">还没有公开的模型包。</p>
          </section>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  max-width: 900px;
}

.profile-hero {
  padding: 0;
  overflow: hidden;
}

.profile-cover {
  position: relative;
  height: 240px;
  overflow: hidden;
}

.cover-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-fallback {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.cover-tone-1 {
  background: linear-gradient(135deg, #ffe4d8 0%, #ffb9a2 55%, #f79a80 100%);
}

.cover-tone-2 {
  background: linear-gradient(135deg, #e2ddff 0%, #c5bcf8 55%, #a99cee 100%);
}

.cover-tone-3 {
  background: linear-gradient(135deg, #d8f4eb 0%, #b0e7d8 55%, #8bd6c4 100%);
}

.cover-tone-4 {
  background: linear-gradient(135deg, #fff0cd 0%, #f9dda1 55%, #eec27f 100%);
}

.cover-tone-5 {
  background: linear-gradient(135deg, #dcecff 0%, #b6d8fb 55%, #8fbfef 100%);
}

.cover-tone-6 {
  background: linear-gradient(135deg, #ffe0ef 0%, #f7c1db 55%, #ec9fc3 100%);
}

.cover-orb {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.26);
}

.cover-orb-a {
  width: 190px;
  height: 190px;
  top: -80px;
  left: 14%;
}

.cover-orb-b {
  width: 130px;
  height: 130px;
  left: 42%;
  bottom: -60px;
  background: rgba(255, 255, 255, 0.18);
}

.cover-paw {
  position: absolute;
  right: 28px;
  bottom: -18px;
  width: 150px;
  height: 150px;
  color: rgba(255, 255, 255, 0.32);
  transform: rotate(-12deg);
}

.cover-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(24, 17, 28, 0) 55%, rgba(24, 17, 28, 0.22) 100%);
  pointer-events: none;
}

.profile-hero-body {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 22px;
  align-items: start;
  padding: 0 30px 30px;
}

.avatar-lg {
  width: 88px;
  height: 88px;
  margin-top: -46px;
  border: 4px solid #fff;
  border-radius: 28px;
  font-size: 30px;
  font-weight: 750;
  box-shadow: 0 14px 30px -18px rgba(29, 23, 38, 0.55);
}

.avatar-img {
  overflow: hidden;
}

.avatar-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-main {
  min-width: 0;
  padding-top: 16px;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.name-row h1 {
  font-size: clamp(24px, 2.8vw, 30px);
  font-weight: 800;
  letter-spacing: -0.02em;
}

.role-badge {
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--bg-soft);
  color: #6b5d7e;
  font-size: 11.5px;
  font-weight: 700;
}

.role-badge.admin {
  background: var(--accent-soft);
  color: var(--accent-deep);
}

.username {
  margin-top: 3px;
  font-size: 13px;
  color: #9a918f;
}

.meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 10px;
  font-size: 12.5px;
  color: var(--muted);
}

.bio {
  margin-top: 12px;
  font-size: 13.5px;
  line-height: 1.8;
  color: var(--ink-soft);
  white-space: pre-wrap;
  word-break: break-word;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  padding-top: 16px;
}

.hero-actions .btn {
  padding: 8px 16px;
  font-size: 13px;
}

.stat-row {
  grid-column: 1 / -1;
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
  margin-top: 6px;
  padding-top: 20px;
  border-top: 1px dashed var(--line);
}

.stat-row div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-row strong {
  font-size: 21px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.stat-row span {
  font-size: 11.5px;
  color: #9a918f;
}

.edit-panel {
  margin-top: 18px;
}

.edit-panel h2 {
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.015em;
}

.bio-input {
  min-height: 100px;
}

.avatar-upload {
  display: flex;
  align-items: center;
  gap: 14px;
}

.avatar-md {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  font-size: 18px;
}

.avatar-img {
  overflow: hidden;
}

.avatar-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  min-width: 0;
}

.avatar-btn {
  padding: 8px 15px;
  font-size: 13px;
}

.avatar-input {
  display: none;
}

.cover-upload {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
}

.cover-preview-stage,
.cover-preview {
  position: relative;
  width: 100%;
  max-width: 520px;
  aspect-ratio: 15 / 4;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--line);
}

.cover-preview-stage {
  cursor: grab;
  touch-action: none;
  background: var(--bg-soft);
}

.cover-preview-stage.dragging {
  cursor: grabbing;
}

.cover-preview-stage img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
  pointer-events: none;
}

.cover-drag-hint {
  position: absolute;
  right: 10px;
  bottom: 8px;
  padding: 4px 9px;
  border-radius: 999px;
  background: rgba(20, 16, 25, 0.52);
  color: #fff;
  font-size: 11px;
  line-height: 1.4;
  pointer-events: none;
}

.cover-preview {
  display: grid;
  place-items: center;
}

.cover-preview-empty {
  position: relative;
  z-index: 1;
  font-size: 11.5px;
  font-weight: 650;
  color: rgba(43, 35, 48, 0.55);
}

.cover-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.edit-panel .form-error.full,
.edit-panel .form-actions.full {
  grid-column: 1 / -1;
}

.edit-panel .btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.activity-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 18px;
}

.activity-panel {
  padding: 22px;
}

.activity-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.activity-head h2 {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.activity-head .text-link {
  font-size: 12.5px;
}

.activity-list {
  display: flex;
  flex-direction: column;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px dashed var(--line);
  font-size: 13px;
}

.activity-list li:last-child .activity-item {
  border-bottom: 0;
}

.activity-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ink-soft);
  transition: color 0.2s;
}

.activity-item:hover .activity-title {
  color: var(--accent-deep);
}

.activity-time {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: none;
  font-size: 11.5px;
  color: #9a918f;
}

.activity-time :deep(.icon) {
  width: 12px;
  height: 12px;
}

.model-thumb {
  display: grid;
  place-items: center;
  width: 38px;
  height: 28px;
  border-radius: 7px;
  overflow: hidden;
  background: var(--bg-soft);
  color: #c7a893;
  flex: none;
}

.model-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.model-thumb :deep(.icon) {
  width: 15px;
  height: 15px;
}

.activity-empty {
  padding: 22px 0;
  text-align: center;
  font-size: 12.5px;
  color: var(--muted);
}

.retry-link {
  margin-top: 16px;
}

@media (max-width: 760px) {
  .profile-cover {
    height: 180px;
  }

  .profile-hero-body {
    grid-template-columns: auto 1fr;
    padding: 0 20px 24px;
  }

  .avatar-lg {
    width: 76px;
    height: 76px;
    margin-top: -38px;
    border-radius: 24px;
    font-size: 26px;
  }

  .hero-main {
    padding-top: 12px;
  }

  .hero-actions {
    grid-column: 1 / -1;
    flex-direction: row;
    align-items: center;
    padding-top: 0;
  }

  .activity-grid {
    grid-template-columns: 1fr;
  }

  .stat-row {
    gap: 26px;
  }
}
</style>
