<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { NPagination, NSpin, useMessage } from 'naive-ui'
import AdminTabs from '@/components/admin/AdminTabs.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import {
  listAdminReports,
  resolveReport,
  updateReportStatus,
  type AdminReport,
  type ReportStatus,
} from '@/api/reports'
import { formatDate, relativeTime } from '@/utils/format'

type FilterStatus = 'ALL' | ReportStatus

const statusLabels: Record<ReportStatus, string> = {
  PENDING: '待处理',
  PROCESSING: '处理中',
  RESOLVED: '已处理',
  REJECTED: '已驳回',
}

const statusClasses: Record<ReportStatus, string> = {
  PENDING: 'status-pending',
  PROCESSING: 'status-reviewing',
  RESOLVED: 'status-published',
  REJECTED: 'status-rejected',
}

const filterTabs: Array<{ value: FilterStatus; label: string }> = [
  { value: 'PENDING', label: '待处理' },
  { value: 'PROCESSING', label: '处理中' },
  { value: 'RESOLVED', label: '已处理' },
  { value: 'REJECTED', label: '已驳回' },
  { value: 'ALL', label: '全部' },
]

const message = useMessage()
const activeStatus = ref<FilterStatus>('PENDING')
const reports = ref<AdminReport[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref('')
const actingId = ref('')

const filters = reactive({ page: 1, pageSize: 20 })
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / filters.pageSize)))

onMounted(load)

async function load() {
  loading.value = true
  error.value = ''

  try {
    const result = await listAdminReports({
      status: activeStatus.value === 'ALL' ? undefined : activeStatus.value,
      page: filters.page,
      pageSize: filters.pageSize,
    })
    reports.value = result.items
    total.value = result.total
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '举报列表加载失败'
    reports.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function selectStatus(status: FilterStatus) {
  if (activeStatus.value === status) return
  activeStatus.value = status
  filters.page = 1
  void load()
}

function changePage(page: number) {
  filters.page = page
  void load()
}

async function setStatus(report: AdminReport, status: ReportStatus) {
  actingId.value = report.id
  try {
    await updateReportStatus(report.id, status)
    message.success(`已标记为${statusLabels[status]}`)
    await load()
  } catch (reason) {
    message.error(reason instanceof Error ? reason.message : '操作失败')
  } finally {
    actingId.value = ''
  }
}

function reject(report: AdminReport) {
  if (!window.confirm('确定驳回这条举报吗？')) return
  void setStatus(report, 'REJECTED')
}

function reopen(report: AdminReport) {
  if (!window.confirm('确定重新打开这条举报吗？')) return
  void setStatus(report, 'PENDING')
}

function targetLabel(report: AdminReport) {
  return report.targetType === 'POST' ? '帖子' : '模型包'
}

async function judge(report: AdminReport, violation: boolean) {
  const label = targetLabel(report)
  const tip = violation
    ? `确定判定为违规吗？该${label}将立即${report.targetType === 'POST' ? '隐藏' : '下架'}，公开页面与下载入口会同时关闭。`
    : '确定判定为无违规吗？该举报将被驳回。'

  if (!window.confirm(tip)) return

  actingId.value = report.id
  try {
    const result = await resolveReport(report.id, violation)
    if (!violation) {
      message.success('已判定无违规，举报已驳回')
    } else if (result.action === 'TARGET_MISSING') {
      message.warning(`已判定违规，但${label}已不存在`)
    } else {
      message.success(`已判定违规，${label}已${report.targetType === 'POST' ? '隐藏' : '下架'}`)
    }
    await load()
  } catch (reason) {
    message.error(reason instanceof Error ? reason.message : '操作失败')
  } finally {
    actingId.value = ''
  }
}
</script>

<template>
  <div class="page">
    <div class="container admin-container">
      <div class="breadcrumb">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <span>管理后台</span>
        <span>/</span>
        <span>举报处理</span>
      </div>

      <AdminTabs />

      <div class="page-head">
        <div>
          <h1>举报处理</h1>
          <p>核实举报内容后判定是否违规，判定违规会直接隐藏帖子或下架模型包。</p>
        </div>
        <span class="total-badge">共 {{ total }} 条</span>
      </div>

      <div class="chip-row">
        <button
          v-for="tab in filterTabs"
          :key="tab.value"
          type="button"
          class="chip"
          :class="{ 'is-active': activeStatus === tab.value }"
          @click="selectStatus(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>

      <NSpin :show="loading">
        <p v-if="error" class="form-error">{{ error }}</p>

        <div v-else-if="!reports.length" class="empty-state">当前分类下没有举报记录。</div>

        <div v-else class="report-list">
          <article v-for="report in reports" :key="report.id" class="panel report-item">
            <div class="report-head">
              <div class="title-wrap">
                <span class="target-badge">
                  {{ report.targetType === 'POST' ? '帖子' : '模型包' }}
                </span>
                <RouterLink
                  v-if="report.targetAvailable"
                  :to="report.targetUrl"
                  class="target-link"
                >
                  {{ report.targetTitle }}
                </RouterLink>
                <span v-else class="target-link disabled">
                  {{ report.targetTitle }}（不可访问）
                </span>
                <span class="status-badge" :class="statusClasses[report.status]">
                  {{ statusLabels[report.status] }}
                </span>
              </div>
              <span class="report-time">{{ relativeTime(report.createdAt) }}</span>
            </div>

            <p class="reason">{{ report.reason }}</p>
            <p class="detail">{{ report.detail }}</p>

            <div class="report-meta">
              <span class="reporter">
                <UserAvatar
                  :name="report.reporter.name"
                  :avatar-url="report.reporter.avatarUrl"
                  :seed="report.reporter.id"
                  size="sm"
                />
                {{ report.reporter.name }}
              </span>
              <span>提交于 {{ formatDate(report.createdAt) }}</span>
            </div>

            <div class="report-actions">
              <template v-if="report.status === 'PENDING'">
                <button
                  type="button"
                  class="btn btn-primary"
                  :disabled="actingId === report.id"
                  @click="setStatus(report, 'PROCESSING')"
                >
                  开始处理
                </button>
                <button
                  type="button"
                  class="btn btn-outline danger"
                  :disabled="actingId === report.id"
                  @click="reject(report)"
                >
                  驳回
                </button>
              </template>
              <template v-else-if="report.status === 'PROCESSING'">
                <button
                  type="button"
                  class="btn btn-primary danger-solid"
                  :disabled="actingId === report.id"
                  @click="judge(report, true)"
                >
                  判定违规并{{ report.targetType === 'POST' ? '隐藏' : '下架' }}
                </button>
                <button
                  type="button"
                  class="btn btn-outline"
                  :disabled="actingId === report.id"
                  @click="judge(report, false)"
                >
                  判定无违规
                </button>
              </template>
              <template v-else>
                <button
                  type="button"
                  class="btn btn-outline"
                  :disabled="actingId === report.id"
                  @click="reopen(report)"
                >
                  重新打开
                </button>
              </template>
            </div>
          </article>
        </div>

        <div v-if="pageCount > 1" class="pager">
          <NPagination
            :page="filters.page"
            :page-count="pageCount"
            :page-slot="7"
            @update:page="changePage"
          />
        </div>
      </NSpin>
    </div>
  </div>
</template>

<style scoped>
.admin-container {
  max-width: 960px;
}

.total-badge {
  padding: 6px 13px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--line);
  font-size: 12.5px;
  font-weight: 650;
  color: var(--ink-soft);
}

.report-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.report-item {
  padding: 18px 20px;
}

.report-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.target-badge {
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-deep);
  font-size: 11px;
  font-weight: 700;
}

.target-link {
  font-size: 15px;
  font-weight: 750;
  color: var(--ink);
}

.target-link:hover {
  color: var(--accent-deep);
}

.target-link.disabled {
  color: #9a918f;
}

.report-time {
  font-size: 11.5px;
  color: #9a918f;
}

.reason {
  display: inline-block;
  margin-top: 10px;
  padding: 3px 9px;
  border-radius: 7px;
  background: var(--bg-soft);
  color: var(--ink-soft);
  font-size: 12px;
  font-weight: 650;
}

.detail {
  margin-top: 8px;
  font-size: 13.5px;
  line-height: 1.8;
  color: var(--ink-soft);
  white-space: pre-wrap;
  word-break: break-word;
}

.report-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
  font-size: 12px;
  color: #8b8292;
}

.reporter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: var(--ink-soft);
}

.report-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 14px;
}

.report-actions .btn {
  padding: 7px 14px;
  font-size: 12.5px;
}

.report-actions .danger {
  color: #b7472a;
  border-color: #f0c9bd;
}

.report-actions .danger:hover {
  border-color: #d99b89;
}

.report-actions .danger-solid {
  background: #b7472a;
  border-color: #b7472a;
  color: #fff;
}

.report-actions .danger-solid:hover {
  background: #9c3a22;
  border-color: #9c3a22;
}

.report-actions .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.pager {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
