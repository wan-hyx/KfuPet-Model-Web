<script setup lang="ts">
import { NConfigProvider, NMessageProvider } from 'naive-ui'
import type { GlobalThemeOverrides } from 'naive-ui'
import { RouterView } from 'vue-router'
import AnnouncementBar from '@/components/layout/AnnouncementBar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import IconSprite from '@/components/ui/IconSprite.vue'
import { ensureSession } from '@/stores/session'

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#FF6B4A',
    primaryColorHover: '#FF7F5C',
    primaryColorPressed: '#EE4F2B',
    primaryColorSuppl: '#FF6B4A',
    borderRadius: '10px',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  },
}

void ensureSession()
</script>

<template>
  <NConfigProvider :theme-overrides="themeOverrides">
    <NMessageProvider>
      <IconSprite />
      <AnnouncementBar />
      <AppHeader />
      <main>
        <RouterView />
      </main>
      <AppFooter />
    </NMessageProvider>
  </NConfigProvider>
</template>
