<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { NPagination, NSpin, useMessage } from 'naive-ui'
import AdminTabs from '@/components/admin/AdminTabs.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import {
  listAdminUsers,
  updateAdminUser,
  type AdminRole,
  type AdminUser,
} from '@/api/admin'
import { session } from '@/stores/session'
import { formatDate } from '@/utils/format'

const message = useMessage()

const users = ref<AdminUser[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref('')
const actingId = ref('')

const filters = reactive({
  q: '',
  role: '' as '' | AdminRole,
  status: '' as '' | 'active' | 'banned',
  page: 1,
  pageSize: 20,
})

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / filters.pageSize)))

let searchTimer: number | undefined

onMounted(load)

async function load() {
  loading.value = true
  error.value = ''

  try {
    const result = await listAdminUsers({
      q: filters.q.trim() || undefined,
      role: filters.role || undefined,
      status: filters.status || undefined,
      page: filters.page,
      pageSize: filters.pageSize,
    })
    users.value = result.items
    total.value = result.total
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '用户列表加载失败'
    users.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function onSearch() {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    filters.page = 1
    void load()
  }, 300)
}

function selectRole(role: '' | AdminRole) {
  if (filters.role === role) return
  filters.role = role
  filters.page = 1
  void load()
}

function selectStatus(status: '' | 'active' | 'banned') {
  if (filters.status === status) return
  filters.status = status
  filters.page = 1
  void load()
}

function changePage(page: number) {
  filters.page = page
  void load()
}

async function patchUser(
  user: AdminUser,
  payload: { role?: AdminRole; isBanned?: boolean },
  confirmText?: string,
) {
  if (confirmText && !window.confirm(confirmText)) return

  actingId.value = user.id
  try {
    await updateAdminUser(user.id, payload)
    message.success('用户信息已更新')
    await load()
  } catch (reason) {
    message.error(reason instanceof Error ? reason.message : '操作失败')
  } finally {
    actingId.value = ''
  }
}

function toggleRole(user: AdminUser) {
  if (user.role === 'ADMIN') {
    void patchUser(
      user,
      { role: 'USER' },
      `确定取消「${user.name}」的管理员权限吗？`,
    )
    return
  }
  void patchUser(user, { role: 'ADMIN' }, `确定将「${user.name}」设为管理员吗？`)
}

function toggleBan(user: AdminUser) {
  if (user.isBanned) {
    void patchUser(user, { isBanned: false })
    return
  }
  void patchUser(
    user,
    { isBanned: true },
    `确定禁用「${user.name}」吗？禁用后该账号将无法登录。`,
  )
}

function isSelf(user: AdminUser) {
  return user.id === session.user?.id
}
</script>

<template>
  <div class="page">
    <div class="container admin-container">
      <div class="breadcrumb">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <span>管理后台</span>
        <span>/</span>
        <span>用户管理</span>
      </div>

      <AdminTabs />

      <div class="page-head">
        <div>
          <h1>用户管理</h1>
          <p>查看社区用户、调整角色权限，或禁用违规账号。禁用后该账号无法登录。</p>
        </div>
        <span class="total-badge">共 {{ total }} 位用户</span>
      </div>

      <div class="user-toolbar">
        <label class="search-box">
          <AppIcon name="search" />
          <input
            v-model="filters.q"
            type="search"
            placeholder="搜索用户名、昵称或邮箱"
            aria-label="搜索用户"
            @input="onSearch"
          />
        </label>

        <div class="chip-row">
          <button
            type="button"
            class="chip"
            :class="{ 'is-active': filters.role === '' }"
            @click="selectRole('')"
          >
            全部角色
          </button>
          <button
            type="button"
            class="chip"
            :class="{ 'is-active': filters.role === 'USER' }"
            @click="selectRole('USER')"
          >
            普通用户
          </button>
          <button
            type="button"
            class="chip"
            :class="{ 'is-active': filters.role === 'ADMIN' }"
            @click="selectRole('ADMIN')"
          >
            管理员
          </button>
        </div>

        <div class="chip-row">
          <button
            type="button"
            class="chip"
            :class="{ 'is-active': filters.status === '' }"
            @click="selectStatus('')"
          >
            全部状态
          </button>
          <button
            type="button"
            class="chip"
            :class="{ 'is-active': filters.status === 'active' }"
            @click="selectStatus('active')"
          >
            正常
          </button>
          <button
            type="button"
            class="chip"
            :class="{ 'is-active': filters.status === 'banned' }"
            @click="selectStatus('banned')"
          >
            已禁用
          </button>
        </div>
      </div>

      <NSpin :show="loading">
        <p v-if="error" class="form-error">{{ error }}</p>

        <div v-else-if="!users.length" class="empty-state">没有匹配的用户。</div>

        <div v-else class="user-list">
          <article v-for="user in users" :key="user.id" class="panel user-item">
            <UserAvatar
              :name="user.name"
              :avatar-url="user.avatarUrl"
              :seed="user.id"
            />

            <div class="user-main">
              <div class="title-row">
                <h2>{{ user.name }}</h2>
                <span class="role-badge" :class="{ admin: user.role === 'ADMIN' }">
                  {{ user.role === 'ADMIN' ? '管理员' : '普通用户' }}
                </span>
                <span v-if="user.isBanned" class="status-badge status-rejected">已禁用</span>
                <span v-if="isSelf(user)" class="self-badge">当前账号</span>
              </div>
              <p class="meta-line">
                <span>@{{ user.username }}</span>
                <span v-if="user.email">{{ user.email }}</span>
                <span>注册于 {{ formatDate(user.createdAt) }}</span>
              </p>
              <p class="stats-line">
                <span>{{ user.stats.posts }} 帖子</span>
                <span>{{ user.stats.comments }} 评论</span>
                <span>{{ user.stats.models }} 模型包</span>
              </p>
            </div>

            <div class="user-actions">
              <button
                type="button"
                class="btn btn-outline"
                :disabled="isSelf(user) || actingId === user.id"
                @click="toggleRole(user)"
              >
                {{ user.role === 'ADMIN' ? '设为普通用户' : '设为管理员' }}
              </button>
              <button
                type="button"
                class="btn"
                :class="user.isBanned ? 'btn-outline' : 'btn-outline danger'"
                :disabled="isSelf(user) || actingId === user.id"
                @click="toggleBan(user)"
              >
                {{ user.isBanned ? '解除禁用' : '禁用账号' }}
              </button>
            </div>
          </article>
        </div>

        <div v-if="pageCount > 1" class="pager">
          <NPagination
            :page="filters.page"
            :page-count="pageCount"
            :page-slot="7"
            @update:page="changePage"
          />
        </div>
      </NSpin>
    </div>
  </div>
</template>

<style scoped>
.admin-container {
  max-width: 1000px;
}

.total-badge {
  padding: 6px 13px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--line);
  font-size: 12.5px;
  font-weight: 650;
  color: var(--ink-soft);
}

.user-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.user-toolbar .chip-row {
  margin-bottom: 0;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 240px;
  padding: 9px 14px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--line);
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

.user-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
}

.user-main {
  flex: 1;
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.title-row h2 {
  font-size: 16px;
  font-weight: 750;
}

.role-badge {
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--bg-soft);
  color: #6b5d7e;
  font-size: 11px;
  font-weight: 700;
}

.role-badge.admin {
  background: var(--accent-soft);
  color: var(--accent-deep);
}

.self-badge {
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--teal-soft);
  color: #087a65;
  font-size: 10.5px;
  font-weight: 700;
}

.meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 5px;
  font-size: 12px;
  color: #8b8292;
}

.stats-line {
  display: flex;
  gap: 14px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--ink-soft);
}

.user-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.user-actions .btn {
  padding: 7px 14px;
  font-size: 12.5px;
}

.user-actions .danger {
  color: #b7472a;
  border-color: #f0c9bd;
}

.user-actions .danger:hover {
  border-color: #d99b89;
}

.user-actions .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.pager {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

@media (max-width: 720px) {
  .user-item {
    flex-wrap: wrap;
  }

  .user-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .search-box {
    width: 100%;
    min-width: 0;
  }
}
</style>
