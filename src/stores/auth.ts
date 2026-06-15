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
  // OCS mode — เปิดจากโปรแกรม OCS, view-only, lock UI (คงอยู่จนปิด browser)
  const ocsMode = ref<boolean>(sessionStorage.getItem('emr_ocs') === '1')
  // ผลตรวจสิทธิ์ OCS access (OK / BLOCKSECURE / BLOCKRENT) + ข้อมูลประกอบ
  const ocsAccessStatus = ref<string>('OK')
  const ocsRentRequested = ref<boolean>(false)
  const ocsClinCode = ref<string>('')

  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.auth === '3')
  // OCS mode = view-only เสมอ → ห้าม scan ไม่ว่า auth จะเป็นอะไร
  const canScan = computed(() => isAdmin.value && !ocsMode.value)

  async function login(userId: string, password: string) {
    const res = await api.post('/auth/login', { userId, password })
    token.value = res.data.token
    user.value = {
      userId: res.data.userId,
      name: res.data.name,
      auth: res.data.auth,
    }
    ocsMode.value = false
    sessionStorage.setItem('emr_token', token.value!)
    sessionStorage.setItem('emr_user', JSON.stringify(user.value))
    sessionStorage.removeItem('emr_ocs')
    // set axios default header
    api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  // OCS launch — ส่ง param ที่ OCS โยนมาให้ backend verify แล้วรับ token (view-only) + treat object
  // คืน treat object เพื่อให้ผู้เรียก (ViewerView) เอาไป fill viewer ข้าม modal
  async function ocsLaunch(params: {
    patId: string; userId: string; clinCode: string; inDate: string; ocmNum: string
  }): Promise<any> {
    const res = await api.post('/auth/ocs-launch', params)
    token.value = res.data.token
    user.value = {
      userId: res.data.userId,
      name: res.data.name,
      auth: res.data.auth,   // '0' จาก backend (forced view-only)
    }
    ocsMode.value = true
    ocsAccessStatus.value = res.data.accessStatus || 'OK'
    ocsRentRequested.value = !!res.data.rentAlreadyRequested
    ocsClinCode.value = res.data.clinCode || ''
    sessionStorage.setItem('emr_token', token.value!)
    sessionStorage.setItem('emr_user', JSON.stringify(user.value))
    sessionStorage.setItem('emr_ocs', '1')
    api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    // คืนทั้ง treat + access info ให้ ViewerView ตัดสินใจแสดงผล
    return res.data
  }

  function logout() {
    token.value = null
    user.value = null
    ocsMode.value = false
    ocsAccessStatus.value = 'OK'
    ocsRentRequested.value = false
    ocsClinCode.value = ''
    sessionStorage.removeItem('emr_token')
    sessionStorage.removeItem('emr_user')
    sessionStorage.removeItem('emr_ocs')
    delete api.defaults.headers.common['Authorization']
  }

  // restore axios header on page reload
  function init() {
    if (token.value) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    }
  }

  return { token, user, ocsMode, ocsAccessStatus, ocsRentRequested, ocsClinCode, isLoggedIn, isAdmin, canScan, login, ocsLaunch, logout, init }
})