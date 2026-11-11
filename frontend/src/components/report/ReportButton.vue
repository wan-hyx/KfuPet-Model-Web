<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { NModal, useMessage } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import { createReport, type ReportTargetType } from '@/api/reports'
import { isLoggedIn } from '@/stores/session'

const props = withDefaults(
  defineProps<{
    targetType: ReportTargetType
    targetId: string
    targetTitle: string
    variant?: 'link' | 'outline'
  }>(),
  { variant: 'link' },
)

const route = useRoute()
const router = useRouter()
const message = useMessage()

const reasons = ['广告引流', '人身攻击', '侵权盗版', '色情或暴力', '违法内容', '其他']

const show = ref(false)
const submitting = ref(false)
const error = ref('')

const form = reactive({
  reason: reasons[0],
  detail: '',
})

const targetLabel = computed(() => (props.targetType === 'POST' ? '帖子' : '模型包'))

async function open() {
  if (!isLoggedIn.value) {
    await router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }

  error.value = ''
  show.value = true
}

async function submit() {
  if (form.detail.trim().length < 10) {
    error.value = '请补充至少 10 个字的举报说明'
    return
  }

  submitting.value = true
  error.value = ''

  try {
    await createReport({
      targetType: props.targetType,
      targetId: props.targetId,
      reason: form.reason,
      detail: form.detail.trim(),
    })
    message.success('举报已提交，管理员会尽快处理')
    show.value = false
    form.detail = ''
    form.reason = reasons[0]
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '举报失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <button
    type="button"
    class="report-trigger"
    :class="variant === 'outline' ? 'btn btn-outline' : ''"
    @click="open"
  >
    <AppIcon name="flag" />
    举报
  </button>

  <NModal
    v-model:show="show"
    preset="card"
    :title="`举报${targetLabel}`"
    :style="{ width: '520px', maxWidth: '92vw' }"
    :bordered="false"
  >
    <p class="report-target">
      举报对象：<strong>{{ targetTitle }}</strong>
    </p>

    <div class="report-form">
      <div class="form-field">
        <label for="report-reason">违规类型</label>
        <select id="report-reason" v-model="form.reason" class="form-control">
          <option v-for="reason in reasons" :key="reason" :value="reason">{{ reason }}</option>
        </select>
      </div>

      <div class="form-field">
        <label for="report-detail">补充说明</label>
        <textarea
          id="report-detail"
          v-model="form.detail"
          class="form-control report-detail"
          maxlength="1000"
          placeholder="请描述违规情况，至少 10 个字"
        />
      </div>

      <p v-if="error" class="form-error">{{ error }}</p>
    </div>

    <template #footer>
      <div class="report-actions">
        <button type="button" class="btn btn-outline" :disabled="submitting" @click="show = false">
          取消
        </button>
        <button type="button" class="btn btn-primary" :disabled="submitting" @click="submit">
          {{ submitting ? '提交中…' : '提交举报' }}
        </button>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.report-trigger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  font-size: 12.5px;
  font-weight: 600;
  color: #8b8292;
  transition:
    background 0.2s,
    color 0.2s;
}

.report-trigger :deep(.icon) {
  width: 13px;
  height: 13px;
  opacity: 0.75;
}

.report-trigger:hover {
  background: var(--bg-soft);
  color: #a2492f;
}

.report-trigger.btn {
  padding: 8px 16px;
  font-size: 13px;
  color: var(--ink-soft);
  background: #fff;
  border: 1px solid var(--line);
}

.report-trigger.btn:hover {
  color: #a2492f;
  border-color: #f0c9bd;
  background: #fff;
}

.report-target {
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--muted);
}

.report-target strong {
  color: var(--ink-soft);
}

.report-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.report-detail {
  min-height: 100px;
}

.report-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.report-actions .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
