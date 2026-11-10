<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { NSpin, useMessage } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import {
  deleteComment,
  deletePost,
  getPost,
  listComments,
  createComment,
  togglePostLike,
  type ApiComment,
  type ApiPostDetail,
} from '@/api/community'
import { isAdmin, isLoggedIn, session } from '@/stores/session'
import { formatCount, relativeTime } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const post = ref<ApiPostDetail | null>(null)
const comments = ref<ApiComment[]>([])
const loading = ref(true)
const error = ref('')
const commentText = ref('')
const submittingComment = ref(false)
const liking = ref(false)

const postId = computed(() => String(route.params.id))
const canDeletePost = computed(
  () =>
    isLoggedIn.value &&
    post.value !== null &&
    (post.value.author.id === session.user?.id || isAdmin.value),
)
const isOwnPost = computed(
  () => isLoggedIn.value && post.value !== null && post.value.author.id === session.user?.id,
)
const loginLink = computed(() => ({
  path: '/login',
  query: { redirect: route.fullPath },
}))

onMounted(load)

async function load() {
  loading.value = true
  error.value = ''

  try {
    const [postData, commentData] = await Promise.all([
      getPost(postId.value),
      listComments(postId.value),
    ])
    post.value = postData
    comments.value = commentData
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '帖子加载失败'
  } finally {
    loading.value = false
  }
}

async function toggleLike() {
  if (!post.value) return

  if (!isLoggedIn.value) {
    await router.push(loginLink.value)
    return
  }

  if (liking.value) return
  liking.value = true

  try {
    const result = await togglePostLike(post.value.id)
    post.value.liked = result.liked
    post.value.likes = result.likes
  } catch (reason) {
    message.error(reason instanceof Error ? reason.message : '操作失败，请稍后重试')
  } finally {
    liking.value = false
  }
}

async function submitComment() {
  if (!isLoggedIn.value) {
    await router.push(loginLink.value)
    return
  }

  const content = commentText.value.trim()
  if (!content) {
    message.warning('请先写点内容再发送')
    return
  }

  submittingComment.value = true
  try {
    const comment = await createComment(postId.value, { content })
    comments.value.push(comment)
    commentText.value = ''
    if (post.value) post.value.comments += 1
    message.success('评论已发布')
  } catch (reason) {
    message.error(reason instanceof Error ? reason.message : '评论失败')
  } finally {
    submittingComment.value = false
  }
}

async function removePost() {
  if (!post.value) return
  if (!window.confirm('确定删除这篇帖子吗？删除后无法恢复。')) return

  try {
    await deletePost(post.value.id)
    message.success('帖子已删除')
    await router.push('/community')
  } catch (reason) {
    message.error(reason instanceof Error ? reason.message : '删除失败')
  }
}

async function removeComment(comment: ApiComment) {
  if (!window.confirm('确定删除这条评论吗？')) return

  try {
    await deleteComment(comment.id)
    comments.value = comments.value.filter((item) => item.id !== comment.id)
    if (post.value) post.value.comments = Math.max(0, post.value.comments - 1)
    message.success('评论已删除')
  } catch (reason) {
    message.error(reason instanceof Error ? reason.message : '删除失败')
  }
}

function canDeleteComment(comment: ApiComment) {
  return isLoggedIn.value && (comment.author.id === session.user?.id || isAdmin.value)
}
</script>

<template>
  <div class="page">
    <div class="container post-container">
      <div class="breadcrumb">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/community">社区</RouterLink>
        <span>/</span>
        <span>帖子详情</span>
      </div>

      <div v-if="loading" class="loading-state"><NSpin /></div>

      <div v-else-if="error" class="empty-state">
        <p>{{ error }}</p>
        <RouterLink to="/community" class="btn btn-outline retry-link">返回社区</RouterLink>
      </div>

      <template v-else-if="post">
        <article class="panel post-panel">
          <div class="post-tags">
            <span class="cat">{{ post.category.name }}</span>
            <span v-if="post.pinned" class="pin">置顶</span>
          </div>

          <h1>{{ post.title }}</h1>

          <div class="post-meta">
            <span class="author">
              <UserAvatar
                :name="post.author.name"
                :avatar-url="post.author.avatarUrl"
                :seed="post.author.id"
              />
              <span class="author-name">{{ post.author.name }}</span>
            </span>
            <span class="meta-item"><AppIcon name="clock" />{{ relativeTime(post.publishedAt) }}</span>
            <span class="meta-item"><AppIcon name="eye" />{{ formatCount(post.views) }}</span>
            <span class="meta-item"><AppIcon name="comment" />{{ post.comments }}</span>
            <button
              v-if="!isOwnPost"
              type="button"
              class="like-btn"
              :class="{ 'is-liked': post.liked }"
              :aria-pressed="Boolean(post.liked)"
              :disabled="liking"
              :title="isLoggedIn ? (post.liked ? '取消点赞' : '点赞') : '登录后点赞'"
              @click="toggleLike"
            >
              <AppIcon name="heart" />
              {{ post.likes }}
            </button>
            <span v-else class="like-static">
              <AppIcon name="heart" />
              {{ post.likes }}
              <em>不能给自己点赞</em>
            </span>

            <button
              v-if="canDeletePost"
              type="button"
              class="delete-link"
              @click="removePost"
            >
              删除帖子
            </button>
          </div>

          <p class="post-body">{{ post.content }}</p>

          <div v-if="post.tags.length" class="tag-row">
            <span v-for="tag in post.tags" :key="tag" class="meta-tag">#{{ tag }}</span>
          </div>
        </article>

        <section class="comments">
          <div class="comments-head">
            <h2>评论 <span>{{ comments.length }}</span></h2>
          </div>

          <div v-if="comments.length" class="comment-list">
            <article v-for="comment in comments" :key="comment.id" class="comment-item">
              <UserAvatar
                :name="comment.author.name"
                :avatar-url="comment.author.avatarUrl"
                :seed="comment.author.id"
              />
              <div class="comment-body">
                <div class="comment-head">
                  <span class="comment-author">{{ comment.author.name }}</span>
                  <span class="comment-time">{{ relativeTime(comment.createdAt) }}</span>
                  <button
                    v-if="canDeleteComment(comment)"
                    type="button"
                    class="delete-link"
                    @click="removeComment(comment)"
                  >
                    删除
                  </button>
                </div>
                <p>{{ comment.content }}</p>
              </div>
            </article>
          </div>
          <p v-else class="empty-state comment-empty">还没有评论，来说点什么吧。</p>

          <form v-if="isLoggedIn" class="panel comment-form" @submit.prevent="submitComment">
            <div class="form-field">
              <label for="comment-input">发表评论</label>
              <textarea
                id="comment-input"
                v-model="commentText"
                class="form-control"
                maxlength="2000"
                placeholder="友善交流，分享你的看法…"
              />
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="submittingComment">
                {{ submittingComment ? '发送中…' : '发送评论' }}
              </button>
            </div>
          </form>

          <div v-else class="comment-login">
            <p>登录后即可参与讨论。</p>
            <RouterLink :to="loginLink" class="btn btn-primary">去登录</RouterLink>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.post-container {
  max-width: 880px;
}

.post-panel {
  padding: 34px;
}

.post-tags {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 14px;
}

.cat {
  padding: 4px 11px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-deep);
  font-size: 11.5px;
  font-weight: 700;
}

.pin {
  padding: 3px 9px;
  border-radius: 6px;
  background: var(--ink);
  color: #fff;
  font-size: 10.5px;
  font-weight: 700;
}

.post-panel h1 {
  font-size: clamp(26px, 3.2vw, 38px);
  font-weight: 800;
  line-height: 1.3;
  letter-spacing: -0.025em;
}

.post-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 18px;
  padding-bottom: 20px;
  border-bottom: 1px dashed var(--line);
  font-size: 12.5px;
  color: #8b8292;
}

.author {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-right: 4px;
}

.author-name {
  font-size: 13px;
  font-weight: 650;
  color: var(--ink-soft);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.meta-item :deep(.icon) {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.like-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  margin: -4px 0;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  font-size: 12.5px;
  font-weight: 600;
  color: #8b8292;
  font-variant-numeric: tabular-nums;
  transition:
    background 0.2s,
    color 0.2s,
    border-color 0.2s;
}

.like-btn :deep(.icon) {
  width: 14px;
  height: 14px;
  opacity: 0.75;
}

.like-btn:hover:not(:disabled) {
  background: var(--accent-soft);
  color: var(--accent-deep);
}

.like-btn.is-liked {
  background: var(--accent-soft);
  border-color: #ffd3c6;
  color: var(--accent-deep);
}

.like-btn.is-liked :deep(.icon) {
  opacity: 1;
}

.like-btn:disabled {
  cursor: default;
  opacity: 0.65;
}

.like-static {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  color: #8b8292;
  font-variant-numeric: tabular-nums;
}

.like-static :deep(.icon) {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.like-static em {
  font-style: normal;
  margin-left: 2px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--bg-soft);
  color: #9a8f86;
  font-size: 11px;
  font-weight: 600;
}

.delete-link {
  margin-left: auto;
  padding: 0;
  border: 0;
  background: none;
  font-size: 12px;
  font-weight: 600;
  color: #b7472a;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.delete-link:hover {
  opacity: 1;
  text-decoration: underline;
}

.post-body {
  margin-top: 24px;
  font-size: 15px;
  line-height: 1.95;
  color: var(--ink-soft);
  white-space: pre-wrap;
  word-break: break-word;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 26px;
}

.meta-tag {
  padding: 4px 10px;
  border-radius: 8px;
  background: #f6efe6;
  color: #8a7460;
  font-size: 12px;
}

.comments {
  margin-top: 36px;
}

.comments-head {
  margin-bottom: 18px;
}

.comments-head h2 {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.comments-head h2 span {
  margin-left: 4px;
  font-size: 13px;
  font-weight: 650;
  color: #9a918f;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px dashed var(--line);
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.comment-author {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-soft);
}

.comment-time {
  font-size: 11.5px;
  color: #9a918f;
}

.comment-head .delete-link {
  font-size: 11.5px;
}

.comment-body p {
  margin-top: 6px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--ink-soft);
  white-space: pre-wrap;
  word-break: break-word;
}

.comment-empty {
  padding: 40px 0;
}

.comment-form {
  margin-top: 24px;
}

.comment-form textarea {
  min-height: 110px;
}

.comment-login {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 24px;
  padding: 20px 24px;
  border-radius: 16px;
  background: #fffdf9;
  border: 1px dashed var(--line);
  font-size: 13.5px;
  color: var(--muted);
}

.retry-link {
  margin-top: 16px;
}

@media (max-width: 640px) {
  .post-panel {
    padding: 22px;
  }
}
</style>
