<template>
  <div class="min-h-screen bg-gradient-to-br from-[#1a4f7a] to-[#0f2d4a] flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-[#1a4f7a] to-[#2563a8] p-6 text-center">
        <img src="/logo.jpg" class="h-16 w-16 rounded-xl mx-auto mb-3 object-cover shadow-lg" alt="BIT" />
        <h1 class="text-white font-bold text-lg">EMR Document System</h1>
        <p class="text-white/70 text-xs mt-1">กรุณาเข้าสู่ระบบ</p>
      </div>

      <!-- Form -->
      <div class="p-6 space-y-4">
        <div>
          <label class="form-label">รหัสผู้ใช้</label>
          <input
            ref="userInput"
            v-model="userId"
            type="text"
            class="form-input"
            placeholder="User ID"
            :disabled="loading"
            @keydown.enter="password ? doLogin() : pwdInput?.focus()"
          />
        </div>
        <div>
          <label class="form-label">รหัสผ่าน</label>
          <input
            ref="pwdInput"
            v-model="password"
            type="password"
            class="form-input"
            placeholder="Password"
            :disabled="loading"
            @keydown.enter="doLogin"
          />
        </div>

        <div v-if="errorMsg" class="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
          <i class="bi bi-exclamation-circle mr-1" />{{ errorMsg }}
        </div>

        <button
          class="btn-primary w-full justify-center py-2.5"
          :disabled="loading"
          @click="doLogin"
        >
          <span v-if="loading" class="loading-spinner mr-2" />
          <i v-else class="bi bi-box-arrow-in-right mr-1" />
          เข้าสู่ระบบ
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const userId = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')
const userInput = ref<HTMLInputElement>()
const pwdInput = ref<HTMLInputElement>()

onMounted(() => userInput.value?.focus())

async function doLogin() {
  if (!userId.value.trim() || !password.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    await authStore.login(userId.value.trim(), password.value)
    // redirect based on auth
    if (authStore.canScan) router.push('/scan')
    else router.push('/viewer')
  } catch (e: any) {
    errorMsg.value = e.response?.data?.error || 'เกิดข้อผิดพลาด'
  } finally {
    loading.value = false
  }
}
</script>
