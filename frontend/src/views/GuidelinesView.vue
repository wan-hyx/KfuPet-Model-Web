<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { NModal, useMessage } from 'naive-ui'
import { useRoute } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'

interface GuideSection {
  id: string
  title: string
  paragraphs?: string[]
  items?: string[]
}

interface GuideDoc {
  eyebrow: string
  title: string
  intro: string
  updatedAt: string
  sections: GuideSection[]
  related: { label: string; to: string }[]
}

const docs: Record<'posting' | 'review', GuideDoc> = {
  posting: {
    eyebrow: 'Community Guidelines',
    title: '发帖规范',
    intro:
      'KfuPet 社区用于交流桌宠使用、角色制作与模型开发经验。为了让讨论更高效、更友善，请在发帖前花一分钟阅读以下规范。',
    updatedAt: '2026-11-09',
    sections: [
      {
        id: 'basic',
        title: '一、基本准则',
        items: [
          '友善交流，对事不对人。技术分歧用事实和复现步骤讨论，不进行人身攻击或嘲讽。',
          '遵守法律法规与公序良俗，不发布任何违法、暴力、色情或政治敏感内容。',
          '尊重原创与版权。转载、引用他人内容时注明来源与作者，并确保拥有分享权限。',
          '一人一号，不恶意注册、不刷屏、不操纵浏览量与点赞数。',
        ],
      },
      {
        id: 'before-post',
        title: '二、发帖前先做三件事',
        items: [
          '先搜索：用关键词搜索社区，确认没有同类问题或已有教程。',
          '先自查：模型包加载失败时，先确认客户端版本、文件完整性与 manifest 配置。',
          '选对分类：按内容选择最贴切的分类，避免把问题发到「综合讨论」。',
        ],
      },
      {
        id: 'title-content',
        title: '三、标题与正文要求',
        items: [
          '标题 3-120 个字符，需概括问题或内容，例如「0.1.7 加载雪团模型时报 manifest 校验失败」。',
          '避免「救命」「在线等」「求助！！！」等空泛标题，也不要只写「模型包问题」。',
          '问题反馈请写明：客户端版本、操作系统、模型包名称与版本、复现步骤、期望结果与实际结果。',
          '有报错时附上完整报错文本或截图；日志请隐去个人隐私信息。',
          '教程与经验分享请注明适用版本与适用范围，涉及命令或配置时给出完整示例。',
          '正文最多 20000 字，代码或配置较多时建议分段说明，避免整段无结构长文。',
        ],
      },
      {
        id: 'category',
        title: '四、分类与标签',
        items: [
          '综合讨论：话题交流、官方更新解读、社区活动。',
          'KfuPet 使用：安装、配置、互动与日常使用问题。',
          '问题反馈：可复现的缺陷、崩溃、加载失败等，需附复现步骤。',
          '角色制作：角色建模、骨骼绑定、动作与表情制作。',
          '模型制作：模型包结构、manifest、资源压缩与性能优化。',
          '开发交流：接入、扩展、工具链与二次开发。',
          '插件 / 工具：自制工具与插件分享，需说明用途与安全风险。',
          '公告：仅限官方或授权人员发布。',
          '标签用逗号分隔，最多 6 个，需准确描述内容，不堆砌无关热词。',
        ],
      },
      {
        id: 'forbidden',
        title: '五、禁止内容',
        items: [
          '违法违规内容，包括但不限于破解、外挂、盗版资源与规避授权的教程。',
          '色情、暴力、血腥、恐怖或其他令人不适的内容。',
          '广告推广、拉人头、返利、博彩、贷款与无关社群引流。',
          '未经授权发布他人模型、素材、代码或隐私信息。',
          '恶意链接、钓鱼网站、伪装成资源的可执行文件。',
          '刷屏、重复发帖、恶意顶帖、批量注册账号等破坏社区秩序的行为。',
          '以「私信发你」「加群领取」等方式绕过公开分享与审核流程。',
        ],
      },
      {
        id: 'resource',
        title: '六、资源与链接',
        items: [
          '模型包请通过「上传模型包」提交，经过审核后由站内提供下载，不鼓励使用网盘或群文件分发。',
          '分享外部链接时请说明用途与来源；禁止使用短链、二维码等方式隐藏真实地址。',
          '分享工具或脚本时请说明运行环境与潜在风险，建议同时提供源码或校验值。',
          '禁止发布任何可能损害他人设备或数据的内容。',
        ],
      },
      {
        id: 'reply',
        title: '七、提问与回复',
        items: [
          '提问时提供最小可复现信息，避免让他人反复追问。',
          '问题解决后请回帖说明原因与解决办法，方便后来者检索。',
          '回答问题时尽量给出可执行的步骤，而不是只给结论。',
          '不要挖坟、恶意引导或发布与主题无关的回复。',
        ],
      },
      {
        id: 'moderation',
        title: '八、违规处理与举报',
        items: [
          '轻微违规：提醒修改或由管理员调整分类与标签。',
          '一般违规：删除内容并记录，重复违规将限制发帖。',
          '严重违规：禁言、封禁账号，涉嫌违法的将保留证据并配合处理。',
          '发现违规内容可通过帖子详情页的管理员入口或社区反馈渠道举报，请附帖子链接与原因。',
          '对处理结果有异议可联系管理员说明情况，我们会复核并给出结论。',
        ],
      },
      {
        id: 'disclaimer',
        title: '九、其他说明',
        items: [
          '用户发布的内容仅代表其个人观点，不代表 KfuPet 官方立场。',
          '官方有权根据社区情况调整规范，调整后在站点公告中说明。',
          '本规范自发布之日起执行，最终解释权归 KfuPet Hub 运营团队所有。',
        ],
      },
    ],
    related: [
      { label: '模型包审核规则', to: '/guidelines/review' },
      { label: '去社区发帖', to: '/community/new' },
    ],
  },
  review: {
    eyebrow: 'Review Rules',
    title: '审核规则',
    intro:
      'KfuPet Hub 的模型包在公开前需要经过人工审核。了解审核标准与流程，可以帮助你的作品更快通过。',
    updatedAt: '2026-11-09',
    sections: [
      {
        id: 'scope',
        title: '一、审核范围',
        items: [
          '模型包首次发布：名称、简介、详细说明、分类、标签、封面与 .kfupet 文件。',
          '模型包版本更新：新版本文件、版本号、更新日志与最低客户端版本。',
          '社区帖子以发布后巡查为主，发现违规将按《发帖规范》处理。',
        ],
      },
      {
        id: 'flow',
        title: '二、审核流程',
        items: [
          '提交后模型包进入「待审核」状态，不会出现在公开列表，也无法被下载。',
          '管理员会在后台逐项检查文件、描述与版权信息。',
          '通过：状态变为「已发布」，出现在模型包列表、首页推荐与搜索中，并开放下载。',
          '驳回：状态变为「已拒绝」，作者可在「我的模型」中查看并修改后重新提交。',
          '已发布的模型包若违反规则，将被下架处理，公开页面与下载入口同步关闭。',
        ],
      },
      {
        id: 'timeline',
        title: '三、审核时限',
        items: [
          '通常在 1-2 个工作日内完成审核。',
          '节假日或提交量较大时可能顺延，请耐心等待，无需重复提交。',
          '仅提交一个模型包即可，重复提交会被合并处理。',
        ],
      },
      {
        id: 'pass',
        title: '四、通过标准',
        items: [
          '文件格式为 .kfupet，结构完整，可被当前公开版本客户端正常加载。',
          '模型包内不含可执行脚本、恶意代码或任何危害设备与数据的内容。',
          '版本号符合 1.0.0 或 v1.0.0 格式，且在同一模型包内唯一。',
          '更新日志清晰说明本次新增、优化与修复的内容。',
          '最低客户端版本填写合理，与模型实际使用的能力匹配。',
          '封面不包含违规内容，描述与实际功能一致，不夸大或误导。',
          '分类与标签准确，不堆砌无关热词。',
          '作者拥有模型与素材的合法授权，或已获得原作者许可。',
        ],
      },
      {
        id: 'reject',
        title: '五、常见驳回原因',
        items: [
          '文件损坏、格式不正确，或缺少 manifest 等必要文件。',
          '版本号重复、未递增或不符合格式要求。',
          '更新日志缺失或只写「更新」「优化」等无效内容。',
          '封面包含违规内容、与模型无关或使用未授权素材。',
          '盗用他人模型、素材或代码，无法提供授权说明。',
          '描述与实际内容严重不符，或诱导用户前往外部下载。',
          '文件体积超过 256 MB，未做必要的资源压缩。',
          '名称、简介或标签包含广告、引流或违规信息。',
        ],
      },
      {
        id: 'versions',
        title: '六、版本更新规则',
        items: [
          '每次更新必须使用新的版本号，禁止覆盖或复用历史版本号。',
          '更新日志需写明改动点；涉及兼容性变化时必须注明。',
          '历史版本会保留在版本历史中，方便用户回退与核对。',
          '仅修改描述或封面时无需提升版本号；修改模型内容必须提升版本号。',
        ],
      },
      {
        id: 'appeal',
        title: '七、复审与申诉',
        items: [
          '被驳回后可根据驳回原因修改内容，重新提交后进入审核队列。',
          '对审核结果有异议，可联系管理员并提供模型包 ID、版本号与说明。',
          '复审以文件内容与规则为准，请提供可核实的信息，避免重复申诉。',
        ],
      },
      {
        id: 'delist',
        title: '八、下架规则',
        items: [
          '经核实的侵权投诉。',
          '存在恶意代码、安全风险或严重兼容性问题。',
          '包含违规内容或严重描述不符。',
          '作者主动申请下架。',
          '下架后可按整改要求修改并重新提交审核。',
        ],
      },
      {
        id: 'duty',
        title: '九、责任与版权',
        items: [
          '上传者需保证对模型、贴图、音频等素材拥有合法授权，并承担相应责任。',
          '模型包若使用第三方素材或遵循特定许可，请在详细说明中注明来源与许可类型。',
          'KfuPet Hub 仅提供分发与展示平台，不对模型内容作出担保。',
          '如权利人认为内容侵权，可联系管理员并提供权属证明，我们会及时处理。',
        ],
      },
    ],
    related: [
      { label: '社区发帖规范', to: '/guidelines/posting' },
      { label: '上传模型包', to: '/models/new' },
    ],
  },
}

const route = useRoute()

const docKey = computed<'posting' | 'review'>(() =>
  route.meta.doc === 'review' ? 'review' : 'posting',
)
const doc = computed(() => docs[docKey.value])

const REPORT_EMAIL = 'l2179725762@gmail.com'
const reportTypes = ['广告引流', '人身攻击', '侵权盗版', '色情或暴力', '违法内容', '其他']

const message = useMessage()
const showReport = ref(false)
const reportError = ref('')

const reportForm = reactive({
  url: '',
  type: reportTypes[0],
  detail: '',
  contact: '',
})

function openReport() {
  reportError.value = ''
  showReport.value = true
}

function buildReportText() {
  return [
    '【KfuPet Hub 违规举报】',
    `违规链接：${reportForm.url.trim() || '（未填写）'}`,
    `违规类型：${reportForm.type}`,
    `补充说明：${reportForm.detail.trim() || '（未填写）'}`,
    `联系方式：${reportForm.contact.trim() || '（未填写）'}`,
    `提交时间：${new Date().toLocaleString('zh-CN')}`,
  ].join('\n')
}

function validateReport() {
  if (!reportForm.url.trim()) return '请填写违规内容的链接'
  if (reportForm.detail.trim().length < 10) return '请补充至少 10 个字的违规说明'
  return ''
}

function sendReport() {
  reportError.value = validateReport()
  if (reportError.value) return

  const subject = `【KfuPet Hub 违规举报】${reportForm.type}`
  window.location.href = `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildReportText())}`
  message.success('已打开邮件客户端，请确认发送举报邮件')
  showReport.value = false
}

async function copyReport() {
  reportError.value = validateReport()
  if (reportError.value) return

  const text = buildReportText()

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    message.success('举报内容已复制，可发送至 ' + REPORT_EMAIL)
  } catch {
    message.error('复制失败，请手动选择举报内容')
  }
}
</script>

<template>
  <div class="page">
    <div class="container guide-container">
      <div class="breadcrumb">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <span>社区规范</span>
        <span>/</span>
        <span>{{ doc.title }}</span>
      </div>

      <div class="page-head">
        <div>
          <span class="eyebrow"><span class="dot"></span>{{ doc.eyebrow }}</span>
          <h1>{{ doc.title }}</h1>
          <p>{{ doc.intro }}</p>
        </div>
        <div class="head-actions">
          <span class="updated">最后更新：{{ doc.updatedAt }}</span>
          <button
            v-if="docKey === 'posting'"
            type="button"
            class="btn btn-outline report-btn"
            @click="openReport"
          >
            举报违规
          </button>
        </div>
      </div>

      <div class="guide-layout">
        <aside class="panel guide-toc">
          <h2>目录</h2>
          <nav aria-label="页面目录">
            <a v-for="section in doc.sections" :key="section.id" :href="`#${section.id}`">
              {{ section.title }}
            </a>
          </nav>
          <div class="toc-related">
            <RouterLink v-for="link in doc.related" :key="link.to" :to="link.to" class="text-link">
              {{ link.label }}
              <AppIcon name="arrow" />
            </RouterLink>
          </div>
        </aside>

        <article class="panel guide-body">
          <section
            v-for="section in doc.sections"
            :id="section.id"
            :key="section.id"
            class="guide-section"
          >
            <h2>{{ section.title }}</h2>
            <p v-for="(paragraph, index) in section.paragraphs ?? []" :key="`p-${index}`">
              {{ paragraph }}
            </p>
            <ul v-if="section.items?.length">
              <li v-for="(item, index) in section.items" :key="`i-${index}`">
                <span class="bullet" aria-hidden="true" />
                <span>{{ item }}</span>
              </li>
            </ul>
          </section>

          <div class="guide-foot">
            <p>阅读完以上规则后，即可开始发布。</p>
            <div class="guide-actions">
              <RouterLink
                v-for="link in doc.related"
                :key="link.to"
                :to="link.to"
                class="btn btn-outline"
              >
                {{ link.label }}
              </RouterLink>
            </div>
          </div>
        </article>
      </div>
    </div>

    <NModal
      v-model:show="showReport"
      preset="card"
      title="举报违规内容"
      :style="{ width: '540px', maxWidth: '92vw' }"
      :bordered="false"
    >
      <p class="report-intro">
        请提供具体链接与违规说明，我们会在 1-2 个工作日内核查处理。举报信息仅用于本次处理。
      </p>

      <div class="report-form">
        <div class="form-field">
          <label for="report-url">违规内容链接</label>
          <input
            id="report-url"
            v-model="reportForm.url"
            class="form-control"
            type="text"
            placeholder="帖子或模型包页面地址"
          />
        </div>

        <div class="form-field">
          <label for="report-type">违规类型</label>
          <select id="report-type" v-model="reportForm.type" class="form-control">
            <option v-for="type in reportTypes" :key="type" :value="type">{{ type }}</option>
          </select>
        </div>

        <div class="form-field">
          <label for="report-detail">补充说明</label>
          <textarea
            id="report-detail"
            v-model="reportForm.detail"
            class="form-control report-detail"
            maxlength="500"
            placeholder="请描述违规情况，至少 10 个字"
          />
        </div>

        <div class="form-field">
          <label for="report-contact">联系方式 <span class="optional">（可选）</span></label>
          <input
            id="report-contact"
            v-model="reportForm.contact"
            class="form-control"
            type="text"
            placeholder="邮箱或 QQ，便于反馈处理结果"
          />
        </div>

        <p v-if="reportError" class="form-error">{{ reportError }}</p>
      </div>

      <template #footer>
        <div class="report-actions">
          <button type="button" class="btn btn-outline" @click="copyReport">复制举报信息</button>
          <button type="button" class="btn btn-primary" @click="sendReport">发送举报邮件</button>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.guide-container {
  max-width: 1040px;
}

.updated {
  padding: 5px 12px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--line);
  font-size: 12px;
  color: #9a918f;
  white-space: nowrap;
}

.head-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.report-btn {
  padding: 8px 18px;
  font-size: 13px;
}

.report-intro {
  margin-bottom: 18px;
  font-size: 13px;
  line-height: 1.75;
  color: var(--muted);
}

.report-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.report-detail {
  min-height: 96px;
}

.report-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.guide-layout {
  display: grid;
  grid-template-columns: 236px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.guide-toc {
  position: sticky;
  top: 96px;
  padding: 20px;
}

.guide-toc h2 {
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 750;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #9a8f86;
}

.guide-toc nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.guide-toc nav a {
  padding: 7px 10px;
  border-radius: 8px;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--ink-soft);
  transition:
    background 0.2s,
    color 0.2s;
}

.guide-toc nav a:hover {
  background: var(--bg-soft);
  color: var(--accent-deep);
}

.toc-related {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px dashed var(--line);
}

.toc-related .text-link {
  font-size: 12.5px;
}

.guide-body {
  padding: 30px 34px;
}

.guide-section + .guide-section {
  margin-top: 30px;
  padding-top: 26px;
  border-top: 1px dashed var(--line);
}

.guide-section h2 {
  margin-bottom: 12px;
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.015em;
  scroll-margin-top: 96px;
}

.guide-section p {
  font-size: 14px;
  line-height: 1.9;
  color: var(--ink-soft);
}

.guide-section ul {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.guide-section li {
  display: flex;
  gap: 10px;
  font-size: 13.5px;
  line-height: 1.85;
  color: var(--ink-soft);
}

.bullet {
  flex: none;
  width: 5px;
  height: 5px;
  margin-top: 9px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0.65;
}

.guide-foot {
  margin-top: 34px;
  padding-top: 22px;
  border-top: 1px solid var(--line);
}

.guide-foot p {
  font-size: 13.5px;
  color: var(--muted);
}

.guide-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
}

.guide-actions .btn {
  padding: 8px 16px;
  font-size: 13px;
}

@media (max-width: 900px) {
  .guide-layout {
    grid-template-columns: 1fr;
  }

  .guide-toc {
    position: static;
  }

  .guide-toc nav {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 4px;
  }
}

@media (max-width: 640px) {
  .guide-body {
    padding: 22px;
  }

  .guide-toc {
    padding: 16px;
  }
}
</style>
