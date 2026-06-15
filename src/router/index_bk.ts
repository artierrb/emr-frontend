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
    { path: '/viewer',        name: 'viewer',        component: () => import('@/views/ViewerView.vue'),        meta: { requireAuth: true } },
    { path: '/viewer/print',  name: 'viewer-print',  component: () => import('@/views/ViewerPrintView.vue'),   meta: { requireAuth: true } },
  ]
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  auth.init()
  if (to.meta.public) return true
  if (to.meta.requireAuth && !auth.isLoggedIn) return '/login'
  if (to.meta.requireAdmin && !auth.isAdmin) return '/viewer'
  if (to.path === '/login' && auth.isLoggedIn) return auth.canScan ? '/scan' : '/viewer'
  return true
})

export default router
