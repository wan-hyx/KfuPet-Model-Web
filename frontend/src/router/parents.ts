import type { RouteLocationRaw } from 'vue-router'

export interface ParentRoute {
  to: RouteLocationRaw
  label: string
}

/**
 * 页面层级：每个子页面的“返回上一级”目标。
 * 返回目标固定为结构上的上级页面，不依赖浏览历史。
 */
export const routeParents: Record<string, ParentRoute> = {
  login: { to: '/', label: '首页' },
  register: { to: '/', label: '首页' },
  community: { to: '/', label: '首页' },
  'community-new': { to: '/community', label: '社区' },
  'post-detail': { to: '/community', label: '社区' },
  search: { to: '/', label: '首页' },
  author: { to: '/', label: '首页' },
  'guidelines-posting': { to: '/', label: '首页' },
  'guidelines-review': { to: '/', label: '首页' },
  download: { to: '/', label: '首页' },
  updates: { to: '/', label: '首页' },
  'notice-detail': { to: '/', label: '首页' },
  models: { to: '/', label: '首页' },
  'model-new': { to: '/models', label: '模型包' },
  'my-models': { to: '/models', label: '模型包' },
  profile: { to: '/', label: '首页' },
  'my-favorites': { to: '/', label: '首页' },
  'my-notifications': { to: '/', label: '首页' },
  'model-detail': { to: '/models', label: '模型包' },
  'admin-models': { to: '/', label: '首页' },
  'admin-posts': { to: '/', label: '首页' },
  'admin-users': { to: '/', label: '首页' },
  'admin-reports': { to: '/', label: '首页' },
}

export function parentRouteOf(name: unknown): ParentRoute | null {
  if (typeof name !== 'string') return null
  return routeParents[name] ?? null
}
