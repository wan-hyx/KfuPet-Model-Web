<script setup lang="ts">
import { onMounted } from 'vue'
import HeroSection from '@/components/home/HeroSection.vue'
import CommunitySection from '@/components/home/CommunitySection.vue'
import ModelsSection from '@/components/home/ModelsSection.vue'
import UpdatesSection from '@/components/home/UpdatesSection.vue'
import DownloadSection from '@/components/home/DownloadSection.vue'
import GithubSection from '@/components/home/GithubSection.vue'
import { useHomeData } from '@/composables/useHomeData'

const { data, load } = useHomeData()

onMounted(() => {
  void load()
})
</script>

<template>
  <HeroSection :stats="data.stats" />
  <CommunitySection :posts="data.posts" />
  <ModelsSection :models="data.models" />
  <UpdatesSection :updates="data.updates" :notices="data.notices" />
  <DownloadSection />
  <GithubSection />
</template>
