import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { ensureSession, isAdmin, isLoggedIn } from '@/stores/session'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: 'KfuPet Hub · 桌宠社区与模型包' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/AuthView.vue'),
    meta: { title: '登录 · KfuPet Hub', guestOnly: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/AuthView.vue'),
    meta: { title: '注册 · KfuPet Hub', guestOnly: true },
  },
  {
    path: '/community',
    name: 'community',
    component: () => import('@/views/CommunityListView.vue'),
    meta: { title: '社区交流 · KfuPet Hub' },
  },
  {
    path: '/community/new',
    name: 'community-new',
    component: () => import('@/views/PostCreateView.vue'),
    meta: { title: '发布帖子 · KfuPet Hub', requiresAuth: true },
  },
  {
    path: '/community/posts/:id',
    name: 'post-detail',
    component: () => import('@/views/PostDetailView.vue'),
    meta: { title: '帖子详情 · KfuPet Hub' },
  },
  {
    path: '/guidelines/posting',
    name: 'guidelines-posting',
    component: () => import('@/views/GuidelinesView.vue'),
    meta: { title: '发帖规范 · KfuPet Hub', doc: 'posting' },
  },
  {
    path: '/guidelines/review',
    name: 'guidelines-review',
    component: () => import('@/views/GuidelinesView.vue'),
    meta: { title: '审核规则 · KfuPet Hub', doc: 'review' },
  },
  {
    path: '/models',
    name: 'models',
    component: () => import('@/views/ModelsListView.vue'),
    meta: { title: '模型包 · KfuPet Hub' },
  },
  {
    path: '/models/new',
    name: 'model-new',
    component: () => import('@/views/ModelCreateView.vue'),
    meta: { title: '上传模型包 · KfuPet Hub', requiresAuth: true },
  },
  {
    path: '/me/models',
    name: 'my-models',
    component: () => import('@/views/MyModelsView.vue'),
    meta: { title: '我的模型 · KfuPet Hub', requiresAuth: true },
  },
  {
    path: '/me/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { title: '个人信息 · KfuPet Hub', requiresAuth: true },
  },
  {
    path: '/models/:id',
    name: 'model-detail',
    component: () => import('@/views/ModelDetailView.vue'),
    meta: { title: '模型包详情 · KfuPet Hub' },
  },
  {
    path: '/admin/models',
    name: 'admin-models',
    component: () => import('@/views/AdminModelsView.vue'),
    meta: { title: '模型审核 · KfuPet Hub', requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
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
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresAdmin && !isAdmin.value) {
    return { path: '/community' }
  }

  if (to.meta.guestOnly && isLoggedIn.value) {
    return { path: '/' }
  }

  return true
})

router.afterEach((to) => {
  const title = to.meta.title
  document.title = typeof title === 'string' ? title : 'KfuPet Hub'
})

export default router
