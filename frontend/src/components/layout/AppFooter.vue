<script setup lang="ts">
import BrandLogo from '@/components/ui/BrandLogo.vue'
import { useFeatureNotice } from '@/composables/useFeatureNotice'

const notify = useFeatureNotice()

function onDocs() {
  notify('功能规格与架构文档将在开发者中心开放浏览。')
}

function onContact() {
  notify('官方联系方式将在站点上线后公布，也可以先在社区发帖交流。')
}
</script>

<template>
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <BrandLogo />
          <p>
            KfuPet 的配套网站平台，承载社区交流与模型包分发，为 Windows
            客户端提供在线资源，Android 版敬请期待。
          </p>
        </div>

        <div class="footer-col">
          <h4>站点</h4>
          <RouterLink to="/">首页</RouterLink>
          <RouterLink to="/community">社区</RouterLink>
          <RouterLink to="/models">模型包</RouterLink>
          <RouterLink to="/#download">客户端下载</RouterLink>
        </div>

        <div class="footer-col">
          <h4>资源</h4>
          <a href="https://github.com/KfuPet/KfuPet" target="_blank" rel="noreferrer">GitHub</a>
          <RouterLink to="/#updates">更新日志</RouterLink>
          <RouterLink to="/#notices">站点公告</RouterLink>
          <button type="button" class="link-button" @click="onDocs">功能规格</button>
        </div>

        <div class="footer-col">
          <h4>社区</h4>
          <RouterLink to="/guidelines/posting">发帖规范</RouterLink>
          <RouterLink to="/guidelines/review">审核规则</RouterLink>
          <a href="https://gitcode.com/Lrht/KfuPet/releases" target="_blank" rel="noreferrer">
            GitCode 镜像
          </a>
          <button type="button" class="link-button" @click="onContact">联系我们</button>
        </div>
      </div>

      <div class="footer-bottom">
        <span>© 2026 KfuPet · 本站由社区共同维护</span>
        <span>Windows · KfuPet Hub</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  border-top: 1px solid var(--line);
  padding: 52px 0 30px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.45), transparent);
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.5fr 0.7fr 0.7fr 0.7fr;
  gap: 32px;
}

.footer-brand p {
  margin-top: 12px;
  max-width: 300px;
  font-size: 13px;
  line-height: 1.8;
  color: var(--muted);
}

.footer-col h4 {
  margin-bottom: 14px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #9a8f86;
}

.footer-col a,
.footer-col li,
.footer-col .link-button {
  display: block;
  font-size: 13px;
  line-height: 2.3;
  color: var(--ink-soft);
}

.footer-col a,
.footer-col .link-button {
  transition: color 0.2s;
}

.footer-col a:hover,
.footer-col .link-button:hover {
  color: var(--accent-deep);
}

.link-button {
  border: 0;
  background: none;
  padding: 0;
  text-align: left;
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 36px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
  font-size: 12px;
  color: #9a918f;
}

@media (max-width: 1024px) {
  .footer-grid {
    grid-template-columns: 1.3fr 0.7fr 0.7fr;
  }

  .footer-brand {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
    gap: 26px;
  }

  .footer-brand {
    grid-column: 1 / -1;
  }

  .footer-bottom {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
