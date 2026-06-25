import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login',         name: 'login',         component: () => import('@/views/LoginView.vue'),         meta: { public: true } },
    { path: '/scan',          name: 'scan',          component: () => import('@/views/ScanView.vue'),          meta: { requireAuth: true, requireAdmin: true } },
    { path: '/scan/security', name: 'scan-security', component: () => import('@/views/ScanSecurityView.vue'),  meta: { requireAuth: true, requireAdmin: true } },
    { path: '/scan/rent',     name: 'scan-rent',     component: () => import('@/views/ScanRentView.vue'),      meta: { requireAuth: true, requireAdmin: true } },
    { path: '/scan/ocrreturn', name: 'scan-ocrreturn', component: () => import('@/views/ScanOcrReturnView.vue'), meta: { requireAuth: true, requireAdmin: true } },
    { path: '/scan/printneed', name: 'scan-printneed', component: () => import('@/views/ScanPrintNeedView.vue'), meta: { requireAuth: true, requireAdmin: true } },
    { path: '/viewer',        name: 'viewer',        component: () => import('@/views/ViewerView.vue'),        meta: { requireAuth: true } },
    { path: '/viewer/print',  name: 'viewer-print',  component: () => import('@/views/ViewerPrintView.vue'),   meta: { requireAuth: true } },
  ]
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  auth.init()

  // OCS launch: เปิด /viewer พร้อม query PROGRAMMODE=OCS — ปล่อยผ่านแม้ยังไม่ login
  // ViewerView จะเป็นคนเรียก ocsLaunch เอง (verify + ออก token)
  const isOcsLaunch = to.path === '/viewer'
      && String(to.query.PROGRAMMODE || to.query.programmode || '').toUpperCase() === 'OCS'
  if (isOcsLaunch) return true

  if (to.meta.public) {
    // อยู่ใน OCS mode ห้ามเด้งไปหน้า login (ไม่มี logout ปกติใน OCS) — ให้อยู่ viewer
    if (to.path === '/login' && auth.isLoggedIn && auth.ocsMode) return '/viewer'
    if (to.path === '/login' && auth.isLoggedIn) return auth.canScan ? '/scan' : '/viewer'
    return true
  }

  if (to.meta.requireAuth && !auth.isLoggedIn) return '/login'

  // OCS mode: ล็อกให้อยู่เฉพาะ /viewer* — กันการพิมพ์ URL ไป /scan เอง
  if (auth.ocsMode && !to.path.startsWith('/viewer')) return '/viewer'

  if (to.meta.requireAdmin && !auth.isAdmin) return '/viewer'
  return true
})

export default router