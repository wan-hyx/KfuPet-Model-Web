import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { ModelStatus, PrismaClient, Role } from '@prisma/client'
import { hash } from 'bcryptjs'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: resolve(process.cwd(), '.env') })
loadEnv({ path: resolve(process.cwd(), '../.env') })

const prisma = new PrismaClient()
const uploadDir = resolve(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads')

const demoUserSeeds = [
  { key: 'luye', username: 'luye', name: '芦野' },
  { key: 'quansi', username: 'quansi', name: '犬饲' },
  { key: 'shiguang', username: 'shiguang', name: '拾光' },
  { key: 'qinghe', username: 'qinghe', name: '青禾' },
  { key: 'nuonuo', username: 'nuonuo', name: '糯糯研究所' },
  { key: 'pix', username: 'pix_studio', name: 'PIX 工作室' },
  { key: 'alan', username: 'alan', name: '阿岚' },
  { key: 'kafu', username: 'kafu', name: '卡芙' },
  { key: 'baize', username: 'baize', name: '白泽' },
  { key: 'neo', username: 'neo', name: 'Neo' },
  { key: 'zhenzi', username: 'zhenzi', name: '榛子' },
  { key: 'xiaoman', username: 'xiaoman', name: '小满' },
]

const postCategorySeeds = [
  { name: '综合讨论', slug: 'general', sortOrder: 1 },
  { name: 'KfuPet 使用', slug: 'usage', sortOrder: 2 },
  { name: '问题反馈', slug: 'feedback', sortOrder: 3 },
  { name: '角色制作', slug: 'character', sortOrder: 4 },
  { name: '模型制作', slug: 'model', sortOrder: 5 },
  { name: '开发交流', slug: 'development', sortOrder: 6 },
  { name: '插件 / 工具', slug: 'tools', sortOrder: 7 },
  { name: '公告', slug: 'notice', sortOrder: 8 },
]

const modelCategorySeeds = [
  { name: '角色', slug: 'character', sortOrder: 1 },
  { name: '宠物', slug: 'pet', sortOrder: 2 },
  { name: '桌宠', slug: 'desktop', sortOrder: 3 },
  { name: '场景', slug: 'scene', sortOrder: 4 },
  { name: '测试', slug: 'test', sortOrder: 5 },
  { name: '其他', slug: 'other', sortOrder: 6 },
]

const postSeeds = [
  {
    title: '从零做一个能跑能跳的角色包（附动作拆分示例）',
    excerpt: '整理了骨骼、动作与贴图的三段式流程，文末附可直接下载的示例工程。',
    content:
      '记录一次完整的角色包制作过程：从骨骼绑定、动作拆分到贴图导出。\n\n' +
      '1. 先确定动作列表，再拆分待机 / 互动 / 移动三类动作。\n' +
      '2. 贴图统一使用 WebP，控制单张尺寸不超过 2048。\n' +
      '3. 上传前用示例工程跑一遍 manifest 校验。',
    authorKey: 'alan',
    categorySlug: 'character',
    tags: ['KfuPet', '角色制作', '教程'],
    hoursAgo: 2,
    views: 1204,
    likes: 86,
    commentCount: 24,
  },
  {
    title: 'KfuPet 0.2.0 更新解读：桌面行为系统重做了',
    excerpt: '新的行为调度让桌宠不再只会原地待机，聊聊实测下来的细节与改进。',
    content:
      '0.2.0 最大的变化是行为调度器：桌宠现在会根据时间、窗口状态和互动次数切换行为。\n\n' +
      '实测下来，待机动作之间的衔接更自然，同时 CPU 占用保持在可接受范围。',
    authorKey: 'kafu',
    categorySlug: 'general',
    tags: ['KfuPet', '更新'],
    hoursAgo: 4,
    views: 2310,
    likes: 142,
    commentCount: 63,
  },
  {
    title: '模型包加载失败？先看这份排查清单',
    excerpt: '从 manifest 校验、版本要求到贴图格式，最常见的 6 个原因与解决办法。',
    content:
      '模型包加载失败通常集中在以下原因：\n\n' +
      '- manifest.json 缺失或字段不完整\n' +
      '- 客户端版本低于模型包要求的最低版本\n' +
      '- 贴图格式或路径大小写不一致\n' +
      '- 音频采样率超出支持范围\n\n' +
      '建议先校验 sha256，再逐项检查资源引用。',
    authorKey: 'baize',
    categorySlug: 'feedback',
    tags: ['Bug', '模型包', '排查'],
    hoursAgo: 6,
    views: 1876,
    likes: 97,
    commentCount: 41,
  },
  {
    title: '把桌宠接入自己的 Electron 项目',
    excerpt: '分享一套透明窗口 + 全局置顶的接入方案，含 IPC 通信与资源加载示例。',
    content:
      '这里记录把 KfuPet 桌宠嵌入 Electron 应用的方案：透明窗口、点击穿透、全局置顶，' +
      '以及如何通过 IPC 把模型包目录传给渲染进程。',
    authorKey: 'neo',
    categorySlug: 'development',
    tags: ['Electron', '开发'],
    hoursAgo: 8,
    views: 932,
    likes: 54,
    commentCount: 18,
  },
  {
    title: '开源了一个批量压缩贴图的小工具',
    excerpt: '支持 WebP 转换与批量重命名，把 20 MB 的角色包压到了 7 MB。',
    content:
      '工具支持批量把 PNG 转成 WebP、统一命名并生成压缩前后的对比报表。' +
      '在保证视觉质量的前提下，测试角色包从 20 MB 降到了 7 MB。',
    authorKey: 'zhenzi',
    categorySlug: 'tools',
    tags: ['工具', '贴图', 'WebP'],
    hoursAgo: 26,
    views: 1540,
    likes: 88,
    commentCount: 32,
  },
  {
    title: 'Android 桌面权限怎么给才不会被杀后台',
    excerpt: '不同厂商的省电策略差异很大，这里整理了一份逐项设置的对照表。',
    content:
      'Android 端需要重点关注电池优化、后台活动限制和自启动权限。' +
      '不同厂商的设置路径差异很大，本文整理了一份逐项对照表。',
    authorKey: 'xiaoman',
    categorySlug: 'usage',
    tags: ['Android', '权限', '后台'],
    hoursAgo: 50,
    views: 1122,
    likes: 61,
    commentCount: 37,
  },
]

const modelSeeds = [
  {
    slug: 'snow',
    name: '雪团 · 猫娘',
    authorKey: 'luye',
    categorySlug: 'character',
    summary: '日常系猫娘角色，含 8 组待机动作与 3 套表情，适合新手直接使用。',
    description:
      '日常系猫娘角色，包含 8 组待机动作、3 套表情和完整的摸头互动。' +
      '资源已做压缩处理，建议在 KfuPet 0.2.0 及以上版本使用。',
    tags: ['猫娘', '日常', 'Live2D'],
    downloads: 8210,
    favorites: 1240,
    version: 'v1.2.0',
    changelog: '新增摸头互动动画，修复尾巴在快速转身时的穿模问题。',
    minClientVersion: '0.2.0',
    sizeMb: 12.4,
    publishedHoursAgo: 5,
    versionHoursAgo: 2,
  },
  {
    slug: 'neo',
    name: 'NEO-07 机械猫',
    authorKey: 'shiguang',
    categorySlug: 'character',
    summary: '赛博风格的机械猫，带有呼吸灯与开机自检动画，贴图已做压缩优化。',
    description:
      '赛博风格机械猫，包含开机自检、呼吸灯和低电量三种特殊状态。' +
      '贴图使用压缩格式，显存占用相比旧版本下降约 40%。',
    tags: ['赛博', '机械', '3D'],
    downloads: 3120,
    favorites: 610,
    version: 'v1.0.3',
    changelog: '贴图改为压缩格式，显存占用下降约 40%。',
    minClientVersion: '0.2.0',
    sizeMb: 18.2,
    publishedHoursAgo: 26,
    versionHoursAgo: 20,
  },
  {
    slug: 'shiba',
    name: '豆柴小次郎',
    authorKey: 'quansi',
    categorySlug: 'pet',
    summary: '会追着鼠标跑的小柴犬，支持摸头、投喂与睡觉三种互动状态。',
    description:
      '会追着鼠标跑的小柴犬，支持摸头、投喂与睡觉三种互动状态。' +
      '新增 3 个待机动作，并修正了投喂状态下的音效循环。',
    tags: ['柴犬', '互动', '治愈'],
    downloads: 6432,
    favorites: 980,
    version: 'v2.0.1',
    changelog: '新增 3 个待机动作，修正投喂状态的音效循环。',
    minClientVersion: '0.2.0',
    sizeMb: 9.8,
    publishedHoursAgo: 53,
    versionHoursAgo: 48,
  },
  {
    slug: 'dragon',
    name: '青鳞 · 龙娘',
    authorKey: 'qinghe',
    categorySlug: 'character',
    summary: '幻想题材龙娘角色，含尾巴摆动与飞行姿态，需要 KfuPet 0.1.8 以上版本。',
    description:
      '幻想题材龙娘角色，包含尾巴摆动、飞行姿态和两套表情。' +
      '本次版本重新绑定骨骼，最低客户端版本要求调整为 0.1.8。',
    tags: ['龙娘', '幻想', '高精度'],
    downloads: 2845,
    favorites: 540,
    version: 'v0.9.5',
    changelog: '重新绑定骨骼，最低客户端版本要求调整为 0.1.8。',
    minClientVersion: '0.1.8',
    sizeMb: 22.6,
    publishedHoursAgo: 120,
    versionHoursAgo: 72,
  },
  {
    slug: 'ghost',
    name: '小幽灵糯糯',
    authorKey: 'nuonuo',
    categorySlug: 'pet',
    summary: '半透明的小幽灵，会在屏幕边缘飘动，夜间会自动调暗发光效果。',
    description:
      '半透明小幽灵，会在屏幕边缘缓慢飘动，夜间自动调暗发光效果。' +
      '资源体积轻量，适合长时间挂机使用。',
    tags: ['幽灵', '轻量', '夜间模式'],
    downloads: 5760,
    favorites: 870,
    version: 'v1.1.0',
    changelog: '优化夜间模式的发光强度，降低长时间运行的内存占用。',
    minClientVersion: '0.2.0',
    sizeMb: 6.1,
    publishedHoursAgo: 168,
    versionHoursAgo: 144,
  },
  {
    slug: 'pixel',
    name: '像素柴犬 PIX-8',
    authorKey: 'pix',
    categorySlug: 'other',
    summary: '复古像素风格的低资源占用模型，适合旧设备与长时间挂机使用。',
    description:
      '复古像素风格的低资源占用模型，动画帧率可调，适合旧设备与长时间挂机使用。' +
      '本次更新增加了两套新的像素动作。',
    tags: ['像素风', '低占用', '测试'],
    downloads: 1980,
    favorites: 320,
    version: 'v1.4.0',
    changelog: '新增两套像素动作，降低动画帧率开销。',
    minClientVersion: '0.2.0',
    sizeMb: 4.3,
    publishedHoursAgo: 216,
    versionHoursAgo: 96,
  },
]

const noticeSeeds = [
  {
    title: '模型包审核规则更新（附常见驳回原因）',
    content: '为保证模型库内容质量，审核规则已更新，请上传前确认资源结构与授权信息。',
    pinned: true,
    daysAgo: 7,
  },
  {
    title: 'KfuPet 0.2.0 客户端正式发布',
    content: '桌面行为系统全面重做，Windows 与 Android 客户端同步更新。',
    pinned: false,
    daysAgo: 11,
  },
  {
    title: '镜像节点招募：一台服务器即可加入分发',
    content: '贡献一份带宽，成为 KfuPet 镜像节点。模型包经 sha256 校验后同步。',
    pinned: false,
    daysAgo: 17,
  },
]

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin1234'
  const demoPassword = process.env.SEED_USER_PASSWORD ?? 'demo1234'

  const [adminHash, demoHash] = await Promise.all([
    hash(adminPassword, 10),
    hash(demoPassword, 10),
  ])

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { role: Role.ADMIN, displayName: 'KfuPet 管理员' },
    create: {
      username: 'admin',
      passwordHash: adminHash,
      displayName: 'KfuPet 管理员',
      role: Role.ADMIN,
      bio: 'KfuPet Hub 站点管理员',
    },
  })

  const users = new Map<string, { id: string }>()

  for (const seed of demoUserSeeds) {
    const user = await prisma.user.upsert({
      where: { username: seed.username },
      update: { displayName: seed.name },
      create: {
        username: seed.username,
        passwordHash: demoHash,
        displayName: seed.name,
      },
      select: { id: true },
    })
    users.set(seed.key, user)
  }

  for (const seed of postCategorySeeds) {
    await prisma.postCategory.upsert({
      where: { slug: seed.slug },
      update: { name: seed.name, sortOrder: seed.sortOrder },
      create: seed,
    })
  }

  for (const seed of modelCategorySeeds) {
    await prisma.modelCategory.upsert({
      where: { slug: seed.slug },
      update: { name: seed.name, sortOrder: seed.sortOrder },
      create: seed,
    })
  }

  if ((await prisma.post.count()) === 0) {
    for (const seed of postSeeds) {
      const author = users.get(seed.authorKey)
      const category = await prisma.postCategory.findUniqueOrThrow({
        where: { slug: seed.categorySlug },
      })
      const tagIds = await ensureTagIds(seed.tags)

      await prisma.post.create({
        data: {
          title: seed.title,
          content: seed.content,
          excerpt: seed.excerpt,
          views: seed.views,
          likes: seed.likes,
          commentCount: seed.commentCount,
          createdAt: hoursAgo(seed.hoursAgo),
          authorId: author!.id,
          categoryId: category.id,
          tags: {
            create: tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })),
          },
        },
      })
    }
  }

  if ((await prisma.modelPackage.count()) === 0) {
    for (const seed of modelSeeds) {
      const author = users.get(seed.authorKey)
      const category = await prisma.modelCategory.findUniqueOrThrow({
        where: { slug: seed.categorySlug },
      })
      const tagIds = await ensureTagIds(seed.tags)
      const demoPackage = await writeDemoPackage(seed.slug, seed.version, seed.sizeMb)

      await prisma.modelPackage.create({
        data: {
          name: seed.name,
          summary: seed.summary,
          description: seed.description,
          authorId: author!.id,
          categoryId: category.id,
          status: ModelStatus.PUBLISHED,
          downloadCount: seed.downloads,
          favoriteCount: seed.favorites,
          createdAt: hoursAgo(seed.publishedHoursAgo),
          tags: {
            create: tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })),
          },
          versions: {
            create: {
              version: seed.version,
              fileKey: demoPackage.fileKey,
              fileSize: demoPackage.fileSize,
              sha256: demoPackage.sha256,
              changelog: seed.changelog,
              minClientVersion: seed.minClientVersion,
              downloadCount: seed.downloads,
              createdAt: hoursAgo(seed.versionHoursAgo),
            },
          },
        },
      })
    }
  }

  for (const seed of noticeSeeds) {
    await prisma.notice.upsert({
      where: { title: seed.title },
      update: {
        content: seed.content,
        pinned: seed.pinned,
        publishedAt: daysAgo(seed.daysAgo),
      },
      create: {
        title: seed.title,
        content: seed.content,
        pinned: seed.pinned,
        publishedAt: daysAgo(seed.daysAgo),
      },
    })
  }

  console.log('Seed 完成：用户、分类、帖子、模型包与公告已就绪。')
  console.log('管理员账号：admin（密码取自 SEED_ADMIN_PASSWORD）')
  console.log('演示账号密码取自 SEED_USER_PASSWORD')
}

async function ensureTagIds(names: string[]) {
  const ids: string[] = []

  for (const name of names) {
    const tag = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
      select: { id: true },
    })
    ids.push(tag.id)
  }

  return ids
}

async function writeDemoPackage(slug: string, version: string, sizeMb: number) {
  const key = `packages/seed/${slug}-${version}.kfupet`
  const filePath = resolve(uploadDir, key)
  const content = JSON.stringify(
    {
      format: 'kfupet-demo',
      model: slug,
      version,
      note: '演示用模型包占位文件，请勿用于客户端正式导入。',
    },
    null,
    2,
  )
  const buffer = Buffer.from(content)

  await mkdir(resolve(filePath, '..'), { recursive: true })
  await writeFile(filePath, buffer)

  return {
    fileKey: key,
    fileSize: Math.round(sizeMb * 1024 * 1024),
    sha256: createHash('sha256').update(buffer).digest('hex'),
  }
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000)
}

function daysAgo(days: number) {
  return hoursAgo(days * 24)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
