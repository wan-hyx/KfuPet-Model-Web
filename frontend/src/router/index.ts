import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { ensureSession, isAdmin, isLoggedIn } from '@/stores/session'
import AdminModelsView from '@/views/AdminModelsView.vue'
import AdminPostsView from '@/views/AdminPostsView.vue'
import AdminReportsView from '@/views/AdminReportsView.vue'
import AdminUsersView from '@/views/AdminUsersView.vue'
import AuthView from '@/views/AuthView.vue'
import AuthorView from '@/views/AuthorView.vue'
import CommunityListView from '@/views/CommunityListView.vue'
import DownloadView from '@/views/DownloadView.vue'
import FavoritesView from '@/views/FavoritesView.vue'
import GuidelinesView from '@/views/GuidelinesView.vue'
import HomeView from '@/views/HomeView.vue'
import ModelCreateView from '@/views/ModelCreateView.vue'
import ModelDetailView from '@/views/ModelDetailView.vue'
import ModelsListView from '@/views/ModelsListView.vue'
import MyModelsView from '@/views/MyModelsView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import NoticeDetailView from '@/views/NoticeDetailView.vue'
import NotificationsView from '@/views/NotificationsView.vue'
import PostCreateView from '@/views/PostCreateView.vue'
import PostDetailView from '@/views/PostDetailView.vue'
import ProfileView from '@/views/ProfileView.vue'
import SearchView from '@/views/SearchView.vue'
import UpdatesView from '@/views/UpdatesView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: 'KfuPet Hub · 桌宠社区与模型包' },
  },
  {
    path: '/login',
    name: 'login',
    component: AuthView,
    meta: { title: '登录 · KfuPet Hub', guestOnly: true },
  },
  {
    path: '/register',
    name: 'register',
    component: AuthView,
    meta: { title: '注册 · KfuPet Hub', guestOnly: true },
  },
  {
    path: '/community',
    name: 'community',
    component: CommunityListView,
    meta: { title: '社区交流 · KfuPet Hub' },
  },
  {
    path: '/community/new',
    name: 'community-new',
    component: PostCreateView,
    meta: { title: '发布帖子 · KfuPet Hub', requiresAuth: true },
  },
  {
    path: '/community/posts/:id',
    name: 'post-detail',
    component: PostDetailView,
    meta: { title: '帖子详情 · KfuPet Hub' },
  },
  {
    path: '/search',
    name: 'search',
    component: SearchView,
    meta: { title: '搜索 · KfuPet Hub' },
  },
  {
    path: '/users/:id',
    name: 'author',
    component: AuthorView,
    meta: { title: '作者主页 · KfuPet Hub', requiresAuth: true },
  },
  {
    path: '/guidelines/posting',
    name: 'guidelines-posting',
    component: GuidelinesView,
    meta: { title: '发帖规范 · KfuPet Hub', doc: 'posting' },
  },
  {
    path: '/guidelines/review',
    name: 'guidelines-review',
    component: GuidelinesView,
    meta: { title: '审核规则 · KfuPet Hub', doc: 'review' },
  },
  {
    path: '/download',
    name: 'download',
    component: DownloadView,
    meta: { title: '客户端下载 · KfuPet Hub' },
  },
  {
    path: '/updates',
    name: 'updates',
    component: UpdatesView,
    meta: { title: '模型包更新日志 · KfuPet Hub' },
  },
  {
    path: '/notices/:id',
    name: 'notice-detail',
    component: NoticeDetailView,
    meta: { title: '站点公告 · KfuPet Hub' },
  },
  {
    path: '/models',
    name: 'models',
    component: ModelsListView,
    meta: { title: '模型包 · KfuPet Hub' },
  },
  {
    path: '/models/new',
    name: 'model-new',
    component: ModelCreateView,
    meta: { title: '上传模型包 · KfuPet Hub', requiresAuth: true },
  },
  {
    path: '/me/models',
    name: 'my-models',
    component: MyModelsView,
    meta: { title: '我的模型 · KfuPet Hub', requiresAuth: true },
  },
  {
    path: '/me/profile',
    name: 'profile',
    component: ProfileView,
    meta: { title: '个人信息 · KfuPet Hub', requiresAuth: true },
  },
  {
    path: '/me/favorites',
    name: 'my-favorites',
    component: FavoritesView,
    meta: { title: '我的收藏 · KfuPet Hub', requiresAuth: true },
  },
  {
    path: '/me/notifications',
    name: 'my-notifications',
    component: NotificationsView,
    meta: { title: '通知 · KfuPet Hub', requiresAuth: true },
  },
  {
    path: '/models/:id',
    name: 'model-detail',
    component: ModelDetailView,
    meta: { title: '模型包详情 · KfuPet Hub' },
  },
  {
    path: '/admin/models',
    name: 'admin-models',
    component: AdminModelsView,
    meta: { title: '模型审核 · KfuPet Hub', requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/posts',
    name: 'admin-posts',
    component: AdminPostsView,
    meta: { title: '社区管理 · KfuPet Hub', requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: AdminUsersView,
    meta: { title: '用户管理 · KfuPet Hub', requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/reports',
    name: 'admin-reports',
    component: AdminReportsView,
    meta: { title: '举报处理 · KfuPet Hub', requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: { title: '页面不存在 · KfuPet Hub' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: 92, behavior: 'smooth' }
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  await ensureSession()

  if (to.meta.requiresAuth && !isLoggedIn.value) {
    return { path: '/login', query: { redirect: to.fullPath }, replace: true }
  }

  if (to.meta.requiresAdmin && !isAdmin.value) {
    return { path: '/community', replace: true }
  }

  if (to.meta.guestOnly && isLoggedIn.value) {
    return { path: '/', replace: true }
  }

  return true
})

router.afterEach((to) => {
  const title = to.meta.title
  document.title = typeof title === 'string' ? title : 'KfuPet Hub'
})

router.onError((error, to) => {
  const message = error instanceof Error ? error.message : String(error)
  const isChunkError =
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('Loading chunk')

  // 页面资源版本过期时，地址栏已变化但视图无法切换，强制整页加载目标页面
  if (isChunkError) {
    window.location.assign(to?.fullPath || '/')
  }
})

export default router
