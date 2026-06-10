import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export interface AuthUser {
  userId: string
  name: string
  auth: string
}

export const useAuthStore = defineStore('auth', () => {
  // sessionStorage — clears when browser closes
  const token = ref<string | null>(sessionStorage.getItem('emr_token'))
  const user = ref<AuthUser | null>(
    sessionStorage.getItem('emr_user')
      ? JSON.parse(sessionStorage.getItem('emr_user')!)
      : null
  )

  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.auth === '3')
  const canScan = computed(() => isAdmin.value)

  async function login(userId: string, password: string) {
    const res = await api.post('/auth/login', { userId, password })
    token.value = res.data.token
    user.value = {
      userId: res.data.userId,
      name: res.data.name,
      auth: res.data.auth,
    }
    sessionStorage.setItem('emr_token', token.value!)
    sessionStorage.setItem('emr_user', JSON.stringify(user.value))
    // set axios default header
    api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  function logout() {
    token.value = null
    user.value = null
    sessionStorage.removeItem('emr_token')
    sessionStorage.removeItem('emr_user')
    delete api.defaults.headers.common['Authorization']
  }

  // restore axios header on page reload
  function init() {
    if (token.value) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    }
  }

  return { token, user, isLoggedIn, isAdmin, canScan, login, logout, init }
})
