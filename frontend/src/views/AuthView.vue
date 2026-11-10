<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import { login, register } from '@/stores/session'

const route = useRoute()
const router = useRouter()

const isRegister = computed(() => route.path === '/register')
const showDemo = import.meta.env.DEV
const loading = ref(false)
const error = ref('')

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirm: '',
})

const redirect = computed(() => {
  const value = route.query.redirect
  return typeof value === 'string' && value.startsWith('/') ? value : '/'
})

const switchLink = computed(() => ({
  path: isRegister.value ? '/login' : '/register',
  query: route.query.redirect ? { redirect: route.query.redirect } : {},
}))

watch(
  () => route.path,
  () => {
    error.value = ''
  },
)

function validate(): string {
  if (!form.username.trim()) return '请输入用户名'
  if (isRegister.value && !/^[a-zA-Z0-9_-]{3,24}$/.test(form.username.trim())) {
    return '用户名只能包含字母、数字、下划线或连字符，长度 3-24 位'
  }
  if (!form.password) return '请输入密码'
  if (isRegister.value) {
    if (form.password.length < 8) return '密码至少 8 位'
    if (form.password !== form.confirm) return '两次输入的密码不一致'
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return '邮箱格式不正确'
    }
  }
  return ''
}

async function submit() {
  error.value = validate()
  if (error.value) return

  loading.value = true
  try {
    if (isRegister.value) {
      await register({
        username: form.username.trim(),
        password: form.password,
        email: form.email.trim() || undefined,
      })
    } else {
      await login(form.username.trim(), form.password)
    }

    await router.push(redirect.value)
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '操作失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

async function useDemoAccount(username: string, password: string) {
  form.username = username
  form.password = password
  await submit()
}
</script>

<template>
  <div class="page auth-page">
    <div class="container auth-shell">
      <section class="auth-copy">
        <span class="eyebrow"><span class="dot"></span>KfuPet Account</span>
        <h1>加入桌宠创作者的<br />小小聚集地</h1>
        <p>
          登录后即可发布帖子、上传模型包并跟踪审核状态。所有模型包经过人工审核后才会出现在公开列表中。
        </p>
        <ul class="auth-points">
          <li><span class="point-mark"><AppIcon name="check" /></span>发帖交流，记录制作过程</li>
          <li><span class="point-mark"><AppIcon name="check" /></span>上传 .kfupet 模型包并管理版本</li>
          <li><span class="point-mark"><AppIcon name="check" /></span>审核通过后社区可直接下载</li>
        </ul>
      </section>

      <section class="panel auth-card">
        <div class="auth-tabs" role="group" aria-label="登录或注册">
          <RouterLink
            to="/login"
            class="auth-tab"
            :class="{ active: !isRegister }"
            :query="route.query"
          >
            登录
          </RouterLink>
          <RouterLink
            to="/register"
            class="auth-tab"
            :class="{ active: isRegister }"
            :query="route.query"
          >
            注册
          </RouterLink>
        </div>

        <h2>{{ isRegister ? '创建新账号' : '欢迎回来' }}</h2>
        <p class="auth-sub">
          {{ isRegister ? '注册后自动登录，可以立即发帖或上传模型。' : '使用账号继续管理你的帖子与模型包。' }}
        </p>

        <form class="auth-form" @submit.prevent="submit">
          <div class="form-field">
            <label for="auth-username">用户名</label>
            <input
              id="auth-username"
              v-model="form.username"
              class="form-control"
              type="text"
              autocomplete="username"
              placeholder="例如 kfupet_fan"
            />
          </div>

          <div v-if="isRegister" class="form-field">
            <label for="auth-email">邮箱 <span class="optional">（可选）</span></label>
            <input
              id="auth-email"
              v-model="form.email"
              class="form-control"
              type="email"
              autocomplete="email"
              placeholder="用于找回账号，可留空"
            />
          </div>

          <div class="form-field">
            <label for="auth-password">密码</label>
            <input
              id="auth-password"
              v-model="form.password"
              class="form-control"
              type="password"
              :autocomplete="isRegister ? 'new-password' : 'current-password'"
              :placeholder="isRegister ? '至少 8 位字符' : '请输入密码'"
            />
          </div>

          <div v-if="isRegister" class="form-field">
            <label for="auth-confirm">确认密码</label>
            <input
              id="auth-confirm"
              v-model="form.confirm"
              class="form-control"
              type="password"
              autocomplete="new-password"
              placeholder="再输入一次密码"
            />
          </div>

          <p v-if="error" class="form-error" role="alert">{{ error }}</p>

          <button class="btn btn-primary submit-btn" type="submit" :disabled="loading">
            {{ loading ? '处理中…' : isRegister ? '注册并登录' : '登录' }}
          </button>
        </form>

        <div v-if="showDemo && !isRegister" class="auth-demo">
          <p>演示账号（仅开发环境）</p>
          <div class="demo-row">
            <button type="button" class="demo-btn" :disabled="loading" @click="useDemoAccount('luye', 'demo1234')">
              用户 luye
            </button>
            <button type="button" class="demo-btn" :disabled="loading" @click="useDemoAccount('admin', 'admin1234')">
              管理员 admin
            </button>
          </div>
        </div>

        <p class="auth-switch">
          {{ isRegister ? '已经有账号了？' : '还没有账号？' }}
          <RouterLink :to="switchLink">{{ isRegister ? '直接登录' : '免费注册' }}</RouterLink>
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  padding-top: 64px;
}

.auth-shell {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 48px;
  align-items: center;
  max-width: 1040px;
}

.auth-copy h1 {
  margin-top: 16px;
  font-size: clamp(32px, 3.8vw, 48px);
  line-height: 1.22;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.auth-copy > p {
  margin-top: 18px;
  max-width: 460px;
  font-size: 15px;
  line-height: 1.85;
  color: var(--muted);
}

.auth-points {
  display: flex;
  flex-direction: column;
  gap: 13px;
  margin-top: 28px;
}

.auth-points li {
  display: flex;
  align-items: center;
  gap: 11px;
  font-size: 14px;
  font-weight: 550;
  color: var(--ink-soft);
}

.point-mark {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 9px;
  background: var(--teal-soft);
  color: var(--teal);
  flex: none;
}

.point-mark :deep(.icon) {
  width: 14px;
  height: 14px;
}

.auth-card {
  padding: 30px;
}

.auth-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px;
  padding: 4px;
  border-radius: 12px;
  background: var(--bg-soft);
  border: 1px solid var(--line);
  margin-bottom: 24px;
}

.auth-tab {
  padding: 9px 12px;
  border-radius: 9px;
  text-align: center;
  font-size: 13.5px;
  font-weight: 650;
  color: var(--muted);
  transition:
    background 0.2s,
    color 0.2s,
    box-shadow 0.2s;
}

.auth-tab.active {
  background: #fff;
  color: var(--ink);
  box-shadow: 0 4px 12px -8px rgba(29, 23, 38, 0.4);
}

.auth-card h2 {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.auth-sub {
  margin-top: 6px;
  margin-bottom: 22px;
  font-size: 13px;
  color: var(--muted);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.submit-btn {
  width: 100%;
  margin-top: 6px;
  padding: 12px 18px;
}

.submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.auth-demo {
  margin-top: 20px;
  padding: 13px 15px;
  border-radius: 13px;
  background: #fffdf9;
  border: 1px dashed var(--line);
}

.auth-demo p {
  font-size: 11.5px;
  font-weight: 650;
  color: #9a918f;
}

.demo-row {
  display: flex;
  gap: 8px;
  margin-top: 9px;
  flex-wrap: wrap;
}

.demo-btn {
  padding: 6px 11px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: #fff;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-soft);
  transition:
    border-color 0.2s,
    color 0.2s;
}

.demo-btn:hover {
  border-color: #f0b8a6;
  color: var(--accent-deep);
}

.auth-switch {
  margin-top: 20px;
  text-align: center;
  font-size: 13px;
  color: var(--muted);
}

.auth-switch a {
  font-weight: 700;
  color: var(--accent-deep);
}

@media (max-width: 900px) {
  .auth-shell {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .auth-copy h1 br {
    display: none;
  }
}
</style>
