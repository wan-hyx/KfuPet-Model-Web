import { ref } from 'vue'
import { fetchHomeData, type HomeData } from '@/api/home'
import {
  heroStats,
  modelPackages,
  modelUpdates,
  notices,
  posts,
} from '@/data/home'

const fallbackData: HomeData = {
  stats: heroStats,
  posts,
  models: modelPackages,
  updates: modelUpdates,
  notices,
}

const data = ref<HomeData>(fallbackData)
const loading = ref(false)
const error = ref<string | null>(null)

export function useHomeData() {
  async function load() {
    if (loading.value) return

    loading.value = true

    try {
      data.value = await fetchHomeData()
      error.value = null
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : '首页接口暂不可用'
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, load }
}
