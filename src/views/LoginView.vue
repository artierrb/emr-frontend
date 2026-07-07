<template>
  <div
    class="login-page"
    :class="{ 'is-fading': fadeOut }"
    :style="{ backgroundImage: `url(${bgImage})` }"
  >
    <!-- ===== ซ้าย: Hero (วางทับ background ตรงๆ) ===== -->
    <div class="login-hero">
      <div class="hero-content">
        <img src="/logo.jpg" class="hero-logo" alt="EMR" />
        <h1 class="hero-title">EMR Document System</h1>
        <p class="hero-subtitle">Scan Center</p>
        <div class="hero-divider" />
        <p class="hero-tagline">
          ระบบจัดการเอกสารทางการแพทย์<br />
          สะดวก รวดเร็ว ปลอดภัย
        </p>

        <div class="hero-features">
          <div v-for="f in features" :key="f.label" class="feature">
            <div class="feature-icon"><i :class="f.icon" /></div>
            <div class="feature-label">{{ f.label }}</div>
            <div class="feature-desc">{{ f.desc }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== ขวา: Login card ===== -->
    <div class="login-panel">
      <div class="login-card">
       <div class="card-stage">
        <!-- ฟอร์ม login (fade ออกเมื่อสำเร็จ) -->
        <transition name="content-fade">
          <div v-if="!loginSuccess" class="card-content stage-layer">
            <div class="card-logo-wrap">
              <img src="/logo.jpg" class="card-logo" alt="EMR" />
            </div>
            <h2 class="card-title">EMR Document System</h2>
            <p class="card-subtitle">กรุณาเข้าสู่ระบบ</p>

            <div class="field">
              <label class="field-label" for="login-user">ชื่อผู้ใช้</label>
              <div class="input-wrap">
                <i class="bi bi-person input-icon" />
                <input
                  id="login-user"
                  ref="userInput"
                  v-model="userIdUpper"
                  type="text"
                  class="input-control input-uppercase"
                  placeholder="User ID"
                  :disabled="loading"
                  autocapitalize="characters"
                  @keydown.enter="password ? doLogin() : pwdInput?.focus()"
                />
              </div>
            </div>

            <div class="field">
              <label class="field-label" for="login-pwd">รหัสผ่าน</label>
              <div class="input-wrap">
                <i class="bi bi-lock input-icon" />
                <input
                  id="login-pwd"
                  ref="pwdInput"
                  v-model="password"
                  :type="showPwd ? 'text' : 'password'"
                  class="input-control has-trailing"
                  placeholder="Password"
                  :disabled="loading"
                  @keydown.enter="doLogin"
                />
                <button
                  type="button"
                  class="input-trailing"
                  :aria-label="showPwd ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'"
                  @click="showPwd = !showPwd"
                >
                  <i :class="showPwd ? 'bi bi-eye-slash' : 'bi bi-eye'" />
                </button>
              </div>
            </div>

            <div v-if="errorMsg" class="error-box">
              <i class="bi bi-exclamation-circle" />{{ errorMsg }}
            </div>

            <button class="btn-login" :disabled="loading" @click="doLogin">
              <span v-if="loading" class="loading-spinner" />
              <i v-else class="bi bi-box-arrow-in-right" />
              เข้าสู่ระบบ
            </button>
          </div>
        </transition>

        <!-- สถานะสำเร็จ (แทนที่ในกรอบเดิม) -->
        <transition name="content-fade">
          <div v-if="loginSuccess" class="card-success stage-layer">
            <svg class="success-check" viewBox="0 0 52 52">
              <circle class="success-circle" cx="26" cy="26" r="24" fill="none" />
              <path class="success-tick" fill="none" d="M14 27 l8 8 l16 -18" />
            </svg>
            <div class="success-text">เข้าสู่ระบบสำเร็จ</div>
            <div class="success-sub">กำลังเข้าสู่หน้าถัดไป...</div>
          </div>
        </transition>
       </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// ===== เปลี่ยนรูปพื้นหลังเต็มหน้าที่นี่ =====
// วางไฟล์รูปไว้ใน public/ แล้วชี้ path เช่น '/login-bg.jpg'
// ถ้ายังไม่มีรูป จะ fallback เป็น gradient น้ำเงิน (.login-page background-color)
const bgImage = '/login-bg.jpg'

const features = [
  { icon: 'bi bi-shield-check', label: 'ปลอดภัย', desc: 'เข้ารหัสข้อมูล' },
  { icon: 'bi bi-cloud-arrow-up', label: 'จัดเก็บบนคลาวด์', desc: 'เข้าถึงได้ทุกที่' },
  { icon: 'bi bi-arrow-repeat', label: 'ใช้งานง่าย', desc: 'รวดเร็ว ทันใจ' },
  { icon: 'bi bi-file-earmark-text', label: 'ค้นหาอัจฉริยะ', desc: 'ค้นหาเอกสารไว' },
]

const router = useRouter()
const authStore = useAuthStore()

const userId = ref('')
const password = ref('')
const remember = ref(true)
const showPwd = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const userInput = ref<HTMLInputElement>()
const pwdInput = ref<HTMLInputElement>()

// สถานะ animation หลัง login สำเร็จ
const loginSuccess = ref(false)
const fadeOut = ref(false)
let successTimer: ReturnType<typeof setTimeout> | undefined
let fadeTimer: ReturnType<typeof setTimeout> | undefined

// บังคับ username เป็นตัวพิมพ์ใหญ่เสมอ (เขียนกลับค่าจริงผ่าน v-model)
const userIdUpper = computed({
  get: () => userId.value,
  set: (v: string) => { userId.value = (v || '').toUpperCase() },
})

onMounted(() => userInput.value?.focus())

onBeforeUnmount(() => {
  clearTimeout(successTimer)
  clearTimeout(fadeTimer)
})

async function doLogin() {
  if (!userId.value.trim() || !password.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    await authStore.login(userId.value.trim().toUpperCase(), password.value)
    const target = authStore.canScan ? '/scan' : '/viewer'

    // 1) แสดง overlay สำเร็จ
    loading.value = false
    loginSuccess.value = true

    // 2) หลัง 2 วิ สั่ง fade ทั้งหน้า
    successTimer = setTimeout(() => {
      fadeOut.value = true
      // 3) หลัง fade จบ (400ms) ค่อยไปหน้าถัดไป
      fadeTimer = setTimeout(() => router.push(target), 400)
    }, 2000)
  } catch (e: any) {
    errorMsg.value = e.response?.data?.error || 'เกิดข้อผิดพลาด'
    loading.value = false
  }
}

// placeholder — เติม logic จริงทีหลังได้ ไม่กระทบ flow เดิม
function onForgot() {
  // TODO: ใส่ flow ลืมรหัสผ่าน
}
function onSso() {
  // TODO: ใส่ flow SSO
}
</script>

<style scoped>
/* ===== Background เต็มทั้งหน้า ===== */
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  /* fallback ถ้ารูปยังไม่มี / โหลดไม่ขึ้น */
  background-color: #14406b;
  background-image: linear-gradient(135deg, #14406b 0%, #1d4ed8 55%, #0f2d4a 100%);
  transition: opacity .4s ease;
}
/* fade ทั้งหน้าก่อนเปลี่ยน route */
.login-page.is-fading { opacity: 0; }

/* ===== Hero (ซ้าย) ===== */
.login-hero {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}
.hero-content {
  max-width: 420px;
  color: #fff;
  /* เงาตัวอักษรให้อ่านง่ายบนรูปพื้นหลัง */
  text-shadow: 0 1px 3px rgba(0,0,0,0.35);
}
.hero-logo {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  object-fit: cover;
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
  background: #fff;
}
.hero-title {
  margin: 24px 0 0;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
}
.hero-subtitle {
  margin: 4px 0 0;
  font-size: 22px;
  font-weight: 400;
  color: rgba(255,255,255,0.9);
}
.hero-divider {
  width: 56px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255,255,255,0.8);
  margin: 24px 0;
}
.hero-tagline {
  font-size: 18px;
  line-height: 1.6;
  color: rgba(255,255,255,0.95);
}
.hero-features {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 40px;
}
.feature { text-align: center; }
.feature-icon {
  width: 52px;
  height: 52px;
  margin: 0 auto 10px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #fff;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.3);
  backdrop-filter: blur(4px);
}
.feature-label { font-size: 14px; font-weight: 600; }
.feature-desc { font-size: 12px; color: rgba(255,255,255,0.85); margin-top: 2px; }

/* ===== Panel (ขวา) ===== */
.login-panel {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}
.login-card {
  width: 100%;
  max-width: 400px;
  background: var(--bg-surface, #fff);
  border-radius: var(--radius-lg, 16px);
  /* stroke + เงาเข้ม ให้เหมือน modal ลอย */
  border: 1px solid rgba(255,255,255,0.6);
  box-shadow:
    0 24px 48px rgba(15, 23, 42, 0.28),
    0 8px 16px rgba(15, 23, 42, 0.18),
    0 0 0 1px rgba(15, 23, 42, 0.04);
  padding: 40px;
}
.card-logo-wrap {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-soft, #dbeafe);
}
.card-logo { width: 52px; height: 52px; border-radius: 12px; object-fit: cover; }
.card-title {
  text-align: center;
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary, #1e293b);
}
.card-subtitle {
  text-align: center;
  margin: 6px 0 28px;
  font-size: 14px;
  color: var(--primary, #2563eb);
}

.field { margin-bottom: 18px; }
.field-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary, #475569);
}
.input-wrap { position: relative; }
.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted, #64748b);
  font-size: 16px;
}
.input-control {
  width: 100%;
  height: 48px;
  padding: 0 14px 0 42px;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: var(--radius-sm, 8px);
  background: #fff;
  font-size: 15px;
  color: var(--text-primary, #1e293b);
  transition: border-color .15s, box-shadow .15s;
}
/* บังคับแสดงเป็นตัวพิมพ์ใหญ่ (ค่าจริงถูก uppercase ผ่าน computed setter อยู่แล้ว) */
.input-uppercase { text-transform: uppercase; }
.input-uppercase::placeholder { text-transform: none; }
.input-control.has-trailing { padding-right: 44px; }
.input-control:focus {
  outline: none;
  border-color: var(--primary, #2563eb);
  box-shadow: 0 0 0 3px var(--primary-soft, #dbeafe);
}
.input-control:disabled { background: var(--bg-subtle, #eef2f7); }
.input-trailing {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-muted, #64748b);
  cursor: pointer;
  border-radius: 6px;
}
.input-trailing:hover { background: var(--bg-subtle, #eef2f7); }

.row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.remember {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary, #475569);
  cursor: pointer;
}
.remember-box { width: 16px; height: 16px; accent-color: var(--primary, #2563eb); }
.link-muted {
  font-size: 14px;
  color: var(--primary, #2563eb);
  text-decoration: none;
}
.link-muted:hover { text-decoration: underline; }

.error-box {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--danger-soft, #fee2e2);
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm, 8px);
  padding: 10px 12px;
  font-size: 14px;
  color: var(--danger, #dc2626);
  margin-bottom: 16px;
}

.btn-login {
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: var(--radius-sm, 8px);
  background: var(--primary, #2563eb);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(15,23,42,.08));
  transition: background .15s;
}
.btn-login:hover:not(:disabled) { background: var(--primary-hover, #1d4ed8); }
.btn-login:disabled { opacity: .65; cursor: not-allowed; }

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: var(--text-muted, #64748b);
  font-size: 13px;
  margin: 20px 0;
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border, #e2e8f0);
}
.divider span { padding: 0 12px; }

.btn-sso {
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: var(--radius-sm, 8px);
  background: #fff;
  color: var(--text-primary, #1e293b);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background .15s;
}
.btn-sso:hover:not(:disabled) { background: var(--bg-subtle, #eef2f7); }

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== สถานะสำเร็จในกรอบ card ===== */
/* stage: กำหนดกรอบให้ทั้งฟอร์มและ success ซ้อนตำแหน่งเดียวกัน
   card จะไม่ขยับ/กระพริบตอนสลับ */
.card-stage {
  position: relative;
  display: grid;
  /* ล็อกความสูงเท่าฟอร์ม login เพื่อไม่ให้ card หดตอนเหลือแต่ success */
  min-height: 428px;
}
/* ทุก layer ทับกันในช่องเดียวของ grid และยืดเต็มความสูง stage */
.stage-layer {
  grid-area: 1 / 1;
}
.card-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.success-check {
  width: 104px;
  height: 104px;
  margin-bottom: 24px;
}
.success-circle {
  stroke: var(--primary, #2563eb);
  stroke-width: 2.5;
  stroke-dasharray: 151;
  stroke-dashoffset: 151;
  animation: draw-circle .5s ease-out forwards;
}
.success-tick {
  stroke: var(--primary, #2563eb);
  stroke-width: 3.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 40;
  stroke-dashoffset: 40;
  animation: draw-tick .35s .45s ease-out forwards;
}
@keyframes draw-circle { to { stroke-dashoffset: 0; } }
@keyframes draw-tick { to { stroke-dashoffset: 0; } }

.success-text {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary, #1e293b);
  opacity: 0;
  animation: fade-up .35s .7s ease-out forwards;
}
.success-sub {
  margin-top: 6px;
  font-size: 14px;
  color: var(--primary, #2563eb);
  opacity: 0;
  animation: fade-up .35s .85s ease-out forwards;
}
@keyframes fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* transition สลับ ฟอร์ม <-> สำเร็จ (crossfade ซ้อนกัน) */
.content-fade-enter-active { transition: opacity .4s ease .1s; }
.content-fade-leave-active { transition: opacity .3s ease; }
.content-fade-enter-from,
.content-fade-leave-to { opacity: 0; }

/* ===== Responsive: ซ่อน hero บนจอเล็ก ===== */
@media (max-width: 900px) {
  .login-page { grid-template-columns: 1fr; }
  .login-hero { display: none; }
}
</style>