import { createRouter, createWebHistory } from 'vue-router'
import ScanView from '@/views/ScanView.vue'
import ViewerView from '@/views/ViewerView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/', redirect: '/scan' },
        { path: '/scan', name: 'scan', component: ScanView },
        { path: '/viewer', name: 'viewer', component: ViewerView },
    ]
})

export default router