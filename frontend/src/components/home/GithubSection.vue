<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue'

const repoUrl = 'https://github.com/KfuPet/KfuPet'
</script>

<template>
  <section class="github">
    <div class="container">
      <div class="gh-band">
        <span class="gh-mark"><AppIcon name="github" /></span>
        <div class="gh-copy">
          <h2>KfuPet 是开源项目</h2>
          <p>客户端源码、发布包与开发文档都在 GitHub 上持续演进，欢迎提交 Issue 或参与贡献。</p>
        </div>
        <div class="gh-actions">
          <a
            class="btn btn-outline"
            :href="repoUrl"
            target="_blank"
            rel="noreferrer"
          >
            <AppIcon name="github" />
            前往 GitHub
          </a>
          <a
            class="btn btn-ghost"
            :href="`${repoUrl}#readme`"
            target="_blank"
            rel="noreferrer"
          >
            阅读项目文档
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.github {
  padding: 0 0 78px;
}

.gh-band {
  display: flex;
  align-items: center;
  gap: 22px;
  flex-wrap: wrap;
  padding: 26px 30px;
  border-radius: 24px;
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-sm);
}

.gh-mark {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: #f3ede5;
  color: var(--ink);
  flex: none;
}

.gh-mark :deep(.icon) {
  width: 26px;
  height: 26px;
}

.gh-copy h2 {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.gh-copy p {
  margin-top: 4px;
  font-size: 13px;
  color: var(--muted);
}

.gh-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-left: auto;
}

@media (max-width: 900px) {
  .gh-actions {
    margin-left: 0;
  }
}

@media (max-width: 640px) {
  .github {
    padding-bottom: 56px;
  }

  .gh-band {
    padding: 22px;
  }

  .gh-actions {
    width: 100%;
  }
}
</style>
