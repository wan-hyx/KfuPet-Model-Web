<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue'

interface DownloadSource {
  key: string
  name: string
  tag: string
  desc: string
  url: string
  action: string
}

const clientVersion = 'v0.1.7'
const clientSize = '25.4 MB'

const sources: DownloadSource[] = [
  {
    key: 'github',
    name: 'GitHub 官方',
    tag: '官方',
    desc: '官方发布页，版本更新最及时，海外网络下载更快。',
    url: 'https://github.com/KfuPet/KfuPet/releases/latest/download/KfuPetInstall.exe',
    action: '直接下载',
  },
  {
    key: 'gitcode',
    name: 'GitCode 镜像',
    tag: '国内镜像',
    desc: '国内镜像仓库，适合无法直接访问 GitHub 的网络环境。',
    url: 'https://gitcode.com/Lrht/KfuPet/releases',
    action: '前往下载',
  },
  {
    key: 'gitee',
    name: 'Gitee 镜像',
    tag: '国内镜像',
    desc: 'Gitee 镜像仓库，下载稳定，可作为备用来源。',
    url: 'https://gitee.com/lrht/kfu-pet/releases',
    action: '前往下载',
  },
]

const steps = [
  '选择上方任意一个下载源，获取 KfuPetInstall.exe 安装包。',
  '下载完成后双击安装，首次启动如提示“未知发布者”，选择信任并继续即可。',
  '打开客户端并使用本站账号登录，即可浏览社区与模型包，下载后自动安装。',
]
</script>

<template>
  <div class="page">
    <div class="container download-container">
      <div class="breadcrumb">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <span>客户端下载</span>
      </div>

      <div class="page-head">
        <div>
          <span class="eyebrow"><span class="dot"></span>Get KfuPet</span>
          <h1>下载 KfuPet 客户端</h1>
          <p>三个下载源内容一致，任选一个即可。镜像源打不开时可以换另一个来源。</p>
        </div>
      </div>

      <div class="panel version-bar">
        <span class="version-tag">Windows</span>
        <strong>{{ clientVersion }}</strong>
        <span>x64 · 安装包 {{ clientSize }} · Windows 10 及以上</span>
      </div>

      <div class="source-grid">
        <article v-for="source in sources" :key="source.key" class="panel source-card">
          <div class="source-head">
            <span class="source-icon"><AppIcon name="download" /></span>
            <div>
              <h2>{{ source.name }}</h2>
              <span class="source-tag" :class="{ official: source.key === 'github' }">
                {{ source.tag }}
              </span>
            </div>
          </div>

          <p>{{ source.desc }}</p>

          <a class="btn btn-primary source-action" :href="source.url" target="_blank" rel="noreferrer">
            <AppIcon name="download" />
            {{ source.action }}
          </a>
        </article>
      </div>

      <section class="panel guide-panel">
        <h2>安装步骤</h2>
        <ol>
          <li v-for="(step, index) in steps" :key="index">
            <span class="step-index">{{ index + 1 }}</span>
            <span>{{ step }}</span>
          </li>
        </ol>
      </section>
    </div>
  </div>
</template>

<style scoped>
.download-container {
  max-width: 960px;
}

.version-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px 20px;
  margin-bottom: 18px;
  font-size: 13px;
  color: var(--ink-soft);
}

.version-bar strong {
  font-size: 15px;
  color: var(--ink);
}

.version-tag {
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-deep);
  font-size: 11.5px;
  font-weight: 700;
}

.source-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.source-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 22px;
}

.source-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.source-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: var(--bg-soft);
  color: var(--accent-deep);
  flex: none;
}

.source-icon :deep(.icon) {
  width: 18px;
  height: 18px;
}

.source-card h2 {
  font-size: 15px;
  font-weight: 750;
}

.source-tag {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--bg-soft);
  color: #8b8292;
  font-size: 11px;
  font-weight: 650;
}

.source-tag.official {
  background: var(--accent-soft);
  color: var(--accent-deep);
}

.source-card p {
  flex: 1;
  font-size: 13px;
  line-height: 1.75;
  color: var(--muted);
}

.source-action {
  justify-content: center;
}

.guide-panel {
  margin-top: 18px;
  padding: 24px;
}

.guide-panel h2 {
  font-size: 16px;
  font-weight: 750;
  margin-bottom: 14px;
}

.guide-panel ol {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.guide-panel li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13.5px;
  line-height: 1.75;
  color: var(--ink-soft);
}

.step-index {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--accent-soft);
  color: var(--accent-deep);
  font-size: 11.5px;
  font-weight: 700;
  flex: none;
  margin-top: 2px;
}

@media (max-width: 860px) {
  .source-grid {
    grid-template-columns: 1fr;
  }
}
</style>
