<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue'

const installerUrl = 'https://github.com/KfuPet/KfuPet/releases/latest/download/KfuPetInstall.exe'
const releasesUrl = 'https://github.com/KfuPet/KfuPet/releases'
</script>

<template>
  <section id="download" class="download">
    <div class="container">
      <div class="download-panel">
        <div class="download-copy">
          <span class="eyebrow light">
            <span class="dot" aria-hidden="true" />
            Get KfuPet
          </span>
          <h2>把桌宠带回桌面。<br />社区资源，一键获取。</h2>
          <p>
            同一套账号，同一套模型库。Windows 客户端登录后即可浏览、下载并自动安装模型包；
            Android 版正在移动端适配，敬请期待。
          </p>
          <ul class="dl-points">
            <li>
              <span class="check"><AppIcon name="check" /></span>
              社区、模型包与客户端账号互通
            </li>
            <li>
              <span class="check"><AppIcon name="check" /></span>
              下载后本地校验 sha256，不匹配直接拒绝
            </li>
            <li>
              <span class="check"><AppIcon name="check" /></span>
              模型包版本更新自动提示
            </li>
          </ul>
        </div>

        <div class="dl-cards">
          <a
            class="dl-card"
            :href="installerUrl"
            target="_blank"
            rel="noreferrer"
          >
            <span class="dl-icon"><AppIcon name="windows" /></span>
            <span>
              <span class="dl-card-title">下载 Windows 版 v0.1.7</span>
              <span class="dl-card-sub">x64 · 安装包 25.4 MB · Windows 10 及以上</span>
            </span>
            <span class="dl-arrow"><AppIcon name="arrow" /></span>
          </a>

          <div class="dl-card dl-card-disabled" aria-disabled="true">
            <span class="dl-icon"><AppIcon name="android" /></span>
            <span>
              <span class="dl-card-title">Android 版</span>
              <span class="dl-card-sub">移动端适配中 · 敬请期待</span>
            </span>
            <span class="dl-coming">敬请期待</span>
          </div>

          <p class="dl-note">
            需要历史版本？
            <a :href="releasesUrl" target="_blank" rel="noreferrer">GitHub Releases</a>
            ·
            <a href="https://gitcode.com/Lrht/KfuPet/releases" target="_blank" rel="noreferrer">
              GitCode 镜像
            </a>
            ·
            <a href="https://gitee.com/lrht/kfu-pet/releases" target="_blank" rel="noreferrer">
              Gitee 镜像
            </a>
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.download {
  padding: 10px 0 78px;
  scroll-margin-top: 92px;
}

.download-panel {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 0.92fr;
  gap: 48px;
  padding: 56px;
  border-radius: 32px;
  background: #1b1424;
  color: #fff;
  box-shadow: 0 44px 80px -44px rgba(27, 20, 36, 0.75);
}

.download-panel::before,
.download-panel::after {
  content: "";
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.download-panel::before {
  width: 520px;
  height: 520px;
  top: -270px;
  right: -130px;
  background: radial-gradient(circle, rgba(255, 107, 74, 0.34), transparent 66%);
}

.download-panel::after {
  width: 440px;
  height: 440px;
  bottom: -270px;
  left: -130px;
  background: radial-gradient(circle, rgba(14, 169, 138, 0.28), transparent 66%);
}

.download-copy {
  position: relative;
  z-index: 1;
}

.download-copy h2 {
  margin-top: 14px;
  font-size: clamp(28px, 3.3vw, 40px);
  line-height: 1.26;
  letter-spacing: -0.025em;
  font-weight: 800;
}

.download-copy p {
  margin-top: 16px;
  max-width: 480px;
  font-size: 14.5px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.62);
}

.dl-points {
  display: grid;
  gap: 10px;
  margin-top: 24px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.78);
}

.dl-points li {
  display: flex;
  align-items: center;
  gap: 9px;
}

.check {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(14, 169, 138, 0.18);
  color: #58d8bb;
  flex: none;
}

.check :deep(.icon) {
  width: 10px;
  height: 10px;
}

.dl-cards {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
}

.dl-card {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 18px 20px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  text-align: left;
  transition:
    background 0.25s,
    transform 0.25s,
    border-color 0.25s;
}

.dl-card:hover {
  background: rgba(255, 255, 255, 0.11);
  border-color: rgba(255, 255, 255, 0.24);
  transform: translateY(-2px);
}

.dl-card-disabled {
  background: rgba(255, 255, 255, 0.03);
  border-style: dashed;
  opacity: 0.82;
  cursor: default;
}

.dl-card-disabled:hover {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.12);
  transform: none;
}

.dl-coming {
  margin-left: auto;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 180, 156, 0.25);
  background: rgba(255, 180, 156, 0.14);
  color: #ffb49c;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.dl-icon {
  width: 44px;
  height: 44px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.1);
  flex: none;
}

.dl-icon :deep(.icon) {
  width: 20px;
  height: 20px;
}

.dl-card-title {
  display: block;
  font-size: 15px;
  font-weight: 700;
}

.dl-card-sub {
  display: block;
  margin-top: 2px;
  font-size: 11.5px;
  color: rgba(255, 255, 255, 0.55);
}

.dl-arrow {
  margin-left: auto;
  color: #ffa98f;
  display: inline-flex;
}

.dl-arrow :deep(.icon) {
  width: 17px;
  height: 17px;
}

.dl-note {
  margin-top: 4px;
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
}

.dl-note a {
  color: #ffb49c;
}

.dl-note a:hover {
  text-decoration: underline;
}

@media (max-width: 900px) {
  .download-panel {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 40px 32px;
  }
}

@media (max-width: 640px) {
  .download {
    padding: 0 0 56px;
  }

  .download-panel {
    padding: 32px 22px;
    border-radius: 24px;
  }

  .dl-card {
    padding: 14px 16px;
  }
}
</style>
