<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue'
import heroCat from '@/assets/art/hero-cat.svg'
import type { HeroStat } from '@/data/home'

defineProps<{ stats: HeroStat[] }>()
</script>

<template>
  <section id="top" class="hero">
    <div class="container hero-grid">
      <div class="hero-copy">
        <span class="eyebrow">
          <span class="dot" aria-hidden="true" />
          KfuPet Hub · 社区 × 模型生态
        </span>
        <h1>让每一只桌宠，<br />都能<span class="mark">被看见</span>。</h1>
        <p class="hero-lead">
          KfuPet Hub 是 KfuPet 的社区与模型包平台。在这里交流角色制作、发布你的模型包；
          Windows 客户端可直接从站内获取在线资源，Android 版正在筹备中。
        </p>
        <div class="hero-cta">
          <a class="btn btn-primary btn-lg" href="#download">
            <AppIcon name="download" />
            下载 KfuPet 客户端
          </a>
          <a class="btn btn-outline btn-lg" href="#models">
            浏览模型包
            <AppIcon name="arrow" />
          </a>
        </div>
        <dl class="hero-stats">
          <div v-for="stat in stats" :key="stat.label">
            <dd>{{ stat.value }}</dd>
            <dt>{{ stat.label }}</dt>
          </div>
        </dl>
      </div>

      <div class="hero-visual">
        <figure class="hero-card">
          <img class="hero-art" :src="heroCat" alt="KfuPet 桌宠角色「雪团」插画" />
          <figcaption>
            <span class="caption-dot" aria-hidden="true" />
            雪团 · 1.2.0
          </figcaption>
        </figure>

        <div class="float-chip chip-a">
          <span class="chip-icon">
            <AppIcon name="spark" />
          </span>
          <span class="chip-text">
            <strong>本周新增 12 个模型包</strong>
            <span>来自 9 位创作者</span>
          </span>
        </div>

        <div class="float-chip chip-b">
          <span class="chip-icon">
            <AppIcon name="download" />
          </span>
          <span class="chip-text">
            <strong>本周下载 3,208 次</strong>
            <span>Windows 客户端</span>
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  padding: 66px 0 92px;
  overflow: hidden;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.04fr 0.96fr;
  gap: 56px;
  align-items: center;
}

.hero-copy,
.hero-visual {
  animation: heroIn 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) both;
}

.hero-visual {
  animation-delay: 0.12s;
}

@keyframes heroIn {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.hero h1 {
  margin-top: 18px;
  font-size: clamp(38px, 4.7vw, 64px);
  line-height: 1.13;
  letter-spacing: -0.028em;
  font-weight: 800;
}

.hero h1 .mark {
  background: linear-gradient(180deg, transparent 64%, rgba(255, 122, 92, 0.32) 64%);
  border-radius: 4px;
  padding: 0 4px;
}

.hero-lead {
  margin-top: 22px;
  max-width: 540px;
  font-size: 16.5px;
  line-height: 1.85;
  color: var(--muted);
}

.hero-cta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 34px;
}

.hero-stats {
  display: flex;
  gap: 44px;
  flex-wrap: wrap;
  margin-top: 46px;
  padding-top: 26px;
  border-top: 1px dashed #e3d8c9;
}

.hero-stats dd {
  font-size: 27px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.hero-stats dt {
  margin-top: 2px;
  font-size: 12.5px;
  color: var(--muted);
}

.hero-visual {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 490px;
}

.hero-visual::before {
  content: "";
  position: absolute;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 32% 30%, #ffd9c6 0%, rgba(255, 217, 198, 0) 66%),
    radial-gradient(circle at 72% 72%, #d8f3ea 0%, rgba(216, 243, 234, 0) 62%);
  filter: blur(6px);
}

.hero-visual::after {
  content: "";
  position: absolute;
  width: 440px;
  height: 440px;
  border-radius: 50%;
  border: 1px dashed rgba(29, 23, 38, 0.13);
}

.hero-card {
  position: relative;
  z-index: 2;
  width: min(350px, 88%);
  margin: 0;
  padding: 10px;
  background: #fff;
  border-radius: 28px;
  transform: rotate(-3deg);
  box-shadow: 0 40px 70px -34px rgba(43, 30, 60, 0.5);
  transition: transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.hero-card:hover {
  transform: rotate(-1deg) translateY(-5px);
}

.hero-art {
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  border-radius: 20px;
  background: #fff3e6;
}

.hero-card figcaption {
  position: absolute;
  left: 26px;
  bottom: 28px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 13px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(24, 18, 32, 0.55);
  backdrop-filter: blur(8px);
  color: #fff;
  font-size: 12.5px;
  font-weight: 600;
}

.caption-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #7ce3c1;
}

.float-chip {
  position: absolute;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.95);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(10px);
}

.float-chip.chip-a {
  top: 30px;
  left: -10px;
  animation: floatA 7s ease-in-out infinite;
}

.float-chip.chip-b {
  bottom: 40px;
  right: -6px;
  animation: floatB 8s ease-in-out infinite;
}

.chip-icon {
  width: 33px;
  height: 33px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #fff;
  flex: none;
}

.chip-icon :deep(.icon) {
  width: 16px;
  height: 16px;
}

.chip-a .chip-icon {
  background: linear-gradient(135deg, #ff8a63, #f6502e);
}

.chip-b .chip-icon {
  background: linear-gradient(135deg, #2bcba8, #0e9c80);
}

.chip-text strong {
  display: block;
  font-size: 13.5px;
  font-weight: 750;
  line-height: 1.3;
}

.chip-text span {
  font-size: 11.5px;
  color: var(--muted);
}

@keyframes floatA {
  0%,
  100% {
    transform: translateY(0) rotate(-2deg);
  }
  50% {
    transform: translateY(-7px) rotate(-2deg);
  }
}

@keyframes floatB {
  0%,
  100% {
    transform: translateY(0) rotate(2deg);
  }
  50% {
    transform: translateY(-6px) rotate(2deg);
  }
}

@media (max-width: 1024px) {
  .hero-grid {
    gap: 32px;
  }

  .hero-visual {
    min-height: 450px;
  }
}

@media (max-width: 900px) {
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 48px;
  }

  .hero-copy {
    max-width: 640px;
  }

  .hero-visual {
    min-height: 420px;
    width: 100%;
    max-width: 480px;
    margin-inline: auto;
  }
}

@media (max-width: 640px) {
  .hero {
    padding: 44px 0 62px;
  }

  .hero h1 {
    font-size: clamp(34px, 10vw, 44px);
  }

  .hero-lead {
    font-size: 15px;
  }

  .hero-stats {
    gap: 26px;
  }

  .hero-stats dd {
    font-size: 24px;
  }

  .hero-visual {
    min-height: 380px;
  }

  .float-chip {
    display: none;
  }
}
</style>
