<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { NPopover } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import BrandLogo from '@/components/ui/BrandLogo.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { initialOf, toneFromId } from '@/utils/format'
import { isAdmin, logout, session } from '@/stores/session'

const route = useRoute()
const router = useRouter()

const navItems = [
  { id: 'top', label: '首页', to: '/' },
  { id: 'community', label: '社区', to: '/community' },
  { id: 'models', label: '模型包', to: '/models' },
  { id: 'updates', label: '更新', to: '/#updates' },
  { id: 'download', label: '客户端', to: '/#download' },
]

const activeSection = ref('top')
const showUserMenu = ref(false)
let observer: IntersectionObserver | undefined

const isHome = computed(() => route.path === '/')
const displayName = computed(() => session.user?.name ?? '')

function isNavActive(id: string) {
  if (id === 'community') return route.path.startsWith('/community')
  if (id === 'models') return route.path.startsWith('/models')
  if (!isHome.value) return false
  if (id === 'top') return activeSection.value === 'top'
  return activeSection.value === id
}

async function observeSections() {
  observer?.disconnect()
  observer = undefined

  if (!isHome.value || !('IntersectionObserver' in window)) return

  await nextTick()

  const ids = ['top', 'community', 'models', 'updates', 'download']
  const sections = ids
    .map((id) => document.getElementById(id))
    .filter((section): section is HTMLElement => section !== null)

  if (!sections.length) return

  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

      if (visible) activeSection.value = visible.target.id
    },
    { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.2, 0.5] },
  )

  sections.forEach((section) => observer?.observe(section))
}

watch(
  () => route.fullPath,
  () => {
    showUserMenu.value = false
    void observeSections()
  },
  { immediate: true },
)

onBeforeUnmount(() => observer?.disconnect())

async function onLogout() {
  showUserMenu.value = false
  logout()
  await router.push('/')
}
</script>

<template>
  <header class="site-header">
    <div class="container nav-inner">
      <BrandLogo />

      <nav class="nav-links" aria-label="主导航">
        <RouterLink
          v-for="item in navItems"
          :key="item.id"
          :to="item.to"
          :class="{ active: isNavActive(item.id) }"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="nav-actions">
        <template v-if="session.user">
          <NPopover v-model:show="showUserMenu" trigger="click" placement="bottom-end" :width="190">
            <template #trigger>
              <button type="button" class="user-trigger" aria-label="账号菜单">
                <span v-if="session.user.avatarUrl" class="avatar avatar-sm avatar-img">
                  <img :src="session.user.avatarUrl" :alt="`${displayName} 的头像`" />
                </span>
                <span v-else class="avatar avatar-sm" :class="`av-${toneFromId(session.user.id)}`">
                  {{ initialOf(displayName) }}
                </span>
                <span class="user-name">{{ displayName }}</span>
              </button>
            </template>

            <div class="user-menu">
              <RouterLink class="menu-item" to="/me/profile" @click="showUserMenu = false">
                个人信息
              </RouterLink>
              <RouterLink class="menu-item" to="/community/new" @click="showUserMenu = false">
                发布帖子
              </RouterLink>
              <RouterLink class="menu-item" to="/models/new" @click="showUserMenu = false">
                上传模型包
              </RouterLink>
              <RouterLink class="menu-item" to="/me/models" @click="showUserMenu = false">
                我的模型
              </RouterLink>
              <RouterLink
                v-if="isAdmin"
                class="menu-item admin"
                to="/admin/models"
                @click="showUserMenu = false"
              >
                模型审核
              </RouterLink>
              <button type="button" class="menu-item logout" @click="onLogout">退出登录</button>
            </div>
          </NPopover>
        </template>

        <template v-else>
          <RouterLink to="/login" class="btn btn-ghost login-btn">登录</RouterLink>
          <RouterLink to="/register" class="btn btn-outline register-btn">注册</RouterLink>
        </template>

        <RouterLink to="/#download" class="btn btn-primary download-btn">
          <AppIcon name="download" />
          <span class="download-text">下载客户端</span>
        </RouterLink>
      </div>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(251, 247, 241, 0.84);
  backdrop-filter: blur(14px) saturate(1.3);
  border-bottom: 1px solid rgba(234, 225, 213, 0.8);
}

.nav-inner {
  display: flex;
  align-items: center;
  gap: 28px;
  height: 72px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 26px;
}

.nav-links a {
  position: relative;
  font-size: 14.5px;
  font-weight: 550;
  color: var(--ink-soft);
  padding: 6px 0;
  transition: color 0.2s;
}

.nav-links a:hover {
  color: var(--accent-deep);
}

.nav-links a.active::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -2px;
  transform: translateX(-50%);
  width: 16px;
  height: 3px;
  border-radius: 3px;
  background: var(--accent);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.user-trigger {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 10px 5px 6px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.78);
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-soft);
  transition:
    border-color 0.2s,
    color 0.2s;
}

.user-trigger:hover {
  border-color: #e6cdbd;
  color: var(--accent-deep);
}

.avatar-img {
  overflow: hidden;
}

.avatar-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-name {
  max-width: 96px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: -4px;
}

.menu-item {
  display: block;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  border-radius: 8px;
  background: none;
  text-align: left;
  font-size: 13px;
  font-weight: 550;
  color: var(--ink-soft);
  transition:
    background 0.15s,
    color 0.15s;
}

.menu-item:hover {
  background: var(--bg-soft);
  color: var(--accent-deep);
}

.menu-item.admin {
  color: var(--accent-deep);
}

.menu-item.logout {
  margin-top: 2px;
  border-top: 1px dashed var(--line);
  border-radius: 0 0 8px 8px;
  color: #a2492f;
}

@media (max-width: 1024px) {
  .nav-links {
    gap: 18px;
  }

  .nav-inner {
    gap: 20px;
  }
}

@media (max-width: 900px) {
  .nav-links {
    display: none;
  }
}

@media (max-width: 640px) {
  .nav-inner {
    height: 64px;
    gap: 14px;
  }

  .login-btn,
  .register-btn {
    display: none;
  }

  .download-text {
    display: none;
  }

  .nav-actions .btn {
    padding: 9px 12px;
    font-size: 13px;
  }
}
</style>
