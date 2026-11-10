import coverSnow from '@/assets/art/cover-snow.svg'
import coverShiba from '@/assets/art/cover-shiba.svg'
import coverNeo from '@/assets/art/cover-neo.svg'
import coverDragon from '@/assets/art/cover-dragon.svg'
import coverGhost from '@/assets/art/cover-ghost.svg'
import coverPixel from '@/assets/art/cover-pixel.svg'

export interface HeroStat {
  value: string
  label: string
}

export interface Post {
  id: string | number
  title: string
  excerpt: string
  author: string
  avatar: string
  avatarUrl?: string | null
  avatarTone: number
  category: string
  categoryTone: 'discuss' | 'create' | 'bug' | 'dev' | 'tool' | 'use'
  timeLabel: string
  publishedAt: string
  views: number
  likes: number
  comments: number
}

export interface ModelPackage {
  id: string | number
  name: string
  author: string
  avatar: string
  avatarUrl?: string | null
  avatarTone: number
  cover: string
  coverAlt: string
  version: string
  category: string
  size: string
  description: string
  tags: string[]
  downloads: number
  publishedAt: string
  updatedAt: string
}

export interface ModelUpdate {
  id: string | number
  name: string
  version: string
  cover: string
  note: string
  timeLabel: string
}

export interface Notice {
  id: string | number
  title: string
  date: string
  pinned?: boolean
}

export const heroStats: HeroStat[] = [
  { value: '128', label: '已发布模型包' },
  { value: '64', label: '活跃创作者' },
  { value: '58,420', label: '累计下载' },
]

export const communityCategories = [
  '全部',
  '综合讨论',
  'KfuPet 使用',
  '问题反馈',
  '角色制作',
  '模型制作',
  '开发交流',
  '插件 / 工具',
  '公告',
] as const

export const posts: Post[] = [
  {
    id: 1,
    title: '从零做一个能跑能跳的角色包（附动作拆分示例）',
    excerpt: '整理了骨骼、动作与贴图的三段式流程，文末附可直接下载的示例工程。',
    author: '阿岚',
    avatar: '岚',
    avatarTone: 1,
    category: '角色制作',
    categoryTone: 'create',
    timeLabel: '2 小时前',
    publishedAt: '2026-11-04T14:00:00+08:00',
    views: 1204,
    likes: 86,
    comments: 24,
  },
  {
    id: 2,
    title: 'KfuPet 0.2.0 更新解读：桌面行为系统重做了',
    excerpt: '新的行为调度让桌宠不再只会原地待机，聊聊实测下来的细节与改进。',
    author: '卡芙',
    avatar: '芙',
    avatarTone: 2,
    category: '综合讨论',
    categoryTone: 'discuss',
    timeLabel: '4 小时前',
    publishedAt: '2026-11-04T12:00:00+08:00',
    views: 2310,
    likes: 142,
    comments: 63,
  },
  {
    id: 3,
    title: '模型包加载失败？先看这份排查清单',
    excerpt: '从 manifest 校验、版本要求到贴图格式，最常见的 6 个原因与解决办法。',
    author: '白泽',
    avatar: '泽',
    avatarTone: 3,
    category: '问题反馈',
    categoryTone: 'bug',
    timeLabel: '6 小时前',
    publishedAt: '2026-11-04T10:00:00+08:00',
    views: 1876,
    likes: 97,
    comments: 41,
  },
  {
    id: 4,
    title: '把桌宠接入自己的 Electron 项目',
    excerpt: '分享一套透明窗口 + 全局置顶的接入方案，含 IPC 通信与资源加载示例。',
    author: 'Neo',
    avatar: 'N',
    avatarTone: 4,
    category: '开发交流',
    categoryTone: 'dev',
    timeLabel: '8 小时前',
    publishedAt: '2026-11-04T08:00:00+08:00',
    views: 932,
    likes: 54,
    comments: 18,
  },
  {
    id: 5,
    title: '开源了一个批量压缩贴图的小工具',
    excerpt: '支持 WebP 转换与批量重命名，把 20 MB 的角色包压到了 7 MB。',
    author: '榛子',
    avatar: '榛',
    avatarTone: 5,
    category: '插件 / 工具',
    categoryTone: 'tool',
    timeLabel: '昨天',
    publishedAt: '2026-11-03T16:00:00+08:00',
    views: 1540,
    likes: 88,
    comments: 32,
  },
  {
    id: 6,
    title: 'Android 桌面权限怎么给才不会被杀后台',
    excerpt: '不同厂商的省电策略差异很大，这里整理了一份逐项设置的对照表。',
    author: '小满',
    avatar: '满',
    avatarTone: 6,
    category: 'KfuPet 使用',
    categoryTone: 'use',
    timeLabel: '2 天前',
    publishedAt: '2026-11-02T11:00:00+08:00',
    views: 1122,
    likes: 61,
    comments: 37,
  },
]

export const modelPackages: ModelPackage[] = [
  {
    id: 1,
    name: '雪团 · 猫娘',
    author: '芦野',
    avatar: '芦',
    avatarTone: 1,
    cover: coverSnow,
    coverAlt: '模型包「雪团 · 猫娘」封面插画',
    version: 'v1.2.0',
    category: '角色',
    size: '12.4 MB',
    description: '日常系猫娘角色，含 8 组待机动作与 3 套表情，适合新手直接使用。',
    tags: ['#猫娘', '#日常', '#Live2D'],
    downloads: 8210,
    publishedAt: '2026-11-04T10:30:00+08:00',
    updatedAt: '2026-11-04T13:00:00+08:00',
  },
  {
    id: 2,
    name: 'NEO-07 机械猫',
    author: '拾光',
    avatar: '拾',
    avatarTone: 5,
    cover: coverNeo,
    coverAlt: '模型包「NEO-07 机械猫」封面插画',
    version: 'v1.0.3',
    category: '角色',
    size: '18.2 MB',
    description: '赛博风格的机械猫，带有呼吸灯与开机自检动画，贴图已做压缩优化。',
    tags: ['#赛博', '#机械', '#3D'],
    downloads: 3120,
    publishedAt: '2026-11-03T09:00:00+08:00',
    updatedAt: '2026-11-03T18:00:00+08:00',
  },
  {
    id: 3,
    name: '豆柴小次郎',
    author: '犬饲',
    avatar: '犬',
    avatarTone: 4,
    cover: coverShiba,
    coverAlt: '模型包「豆柴小次郎」封面插画',
    version: 'v2.0.1',
    category: '宠物',
    size: '9.8 MB',
    description: '会追着鼠标跑的小柴犬，支持摸头、投喂与睡觉三种互动状态。',
    tags: ['#柴犬', '#互动', '#治愈'],
    downloads: 6432,
    publishedAt: '2026-11-02T12:00:00+08:00',
    updatedAt: '2026-11-02T20:00:00+08:00',
  },
  {
    id: 4,
    name: '青鳞 · 龙娘',
    author: '青禾',
    avatar: '禾',
    avatarTone: 3,
    cover: coverDragon,
    coverAlt: '模型包「青鳞 · 龙娘」封面插画',
    version: 'v0.9.5',
    category: '角色',
    size: '22.6 MB',
    description: '幻想题材龙娘角色，含尾巴摆动与飞行姿态，需要 KfuPet 0.1.8 以上版本。',
    tags: ['#龙娘', '#幻想', '#高精度'],
    downloads: 2845,
    publishedAt: '2026-10-30T15:00:00+08:00',
    updatedAt: '2026-10-31T18:00:00+08:00',
  },
  {
    id: 5,
    name: '小幽灵糯糯',
    author: '糯糯研究所',
    avatar: '糯',
    avatarTone: 6,
    cover: coverGhost,
    coverAlt: '模型包「小幽灵糯糯」封面插画',
    version: 'v1.1.0',
    category: '宠物',
    size: '6.1 MB',
    description: '半透明的小幽灵，会在屏幕边缘飘动，夜间会自动调暗发光效果。',
    tags: ['#幽灵', '#轻量', '#夜间模式'],
    downloads: 5760,
    publishedAt: '2026-10-28T11:00:00+08:00',
    updatedAt: '2026-10-30T09:00:00+08:00',
  },
  {
    id: 6,
    name: '像素柴犬 PIX-8',
    author: 'PIX 工作室',
    avatar: 'P',
    avatarTone: 2,
    cover: coverPixel,
    coverAlt: '模型包「像素柴犬 PIX-8」封面插画',
    version: 'v1.4.0',
    category: '其他',
    size: '4.3 MB',
    description: '复古像素风格的低资源占用模型，适合旧设备与长时间挂机使用。',
    tags: ['#像素风', '#低占用', '#测试'],
    downloads: 1980,
    publishedAt: '2026-10-26T09:00:00+08:00',
    updatedAt: '2026-10-31T12:00:00+08:00',
  },
]

export const modelUpdates: ModelUpdate[] = [
  {
    id: 1,
    name: '雪团 · 猫娘',
    version: 'v1.2.0',
    cover: coverSnow,
    note: '新增摸头互动动画，修复尾巴在快速转身时的穿模问题。',
    timeLabel: '2 小时前',
  },
  {
    id: 2,
    name: 'NEO-07 机械猫',
    version: 'v1.0.3',
    cover: coverNeo,
    note: '贴图改为压缩格式，显存占用下降约 40%。',
    timeLabel: '昨天',
  },
  {
    id: 3,
    name: '豆柴小次郎',
    version: 'v2.0.1',
    cover: coverShiba,
    note: '新增 3 个待机动作，修正投喂状态的音效循环。',
    timeLabel: '2 天前',
  },
  {
    id: 4,
    name: '青鳞 · 龙娘',
    version: 'v0.9.5',
    cover: coverDragon,
    note: '重新绑定骨骼，最低客户端版本要求调整为 0.1.8。',
    timeLabel: '3 天前',
  },
]

export const notices: Notice[] = [
  { id: 1, title: '模型包审核规则更新（附常见驳回原因）', date: '10-28', pinned: true },
  { id: 2, title: 'KfuPet 0.2.0 客户端正式发布', date: '10-24' },
  { id: 3, title: '镜像节点招募：一台服务器即可加入分发', date: '10-18' },
]
