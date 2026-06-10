<template>
  <div class="relative" ref="panelRef">
    <!-- Not logged in -->
    <button
      v-if="!authStore.isLoggedIn"
      class="flex items-center gap-2 bg-white/15 border border-white/30 px-3 py-1.5 rounded-lg text-sm text-white hover:bg-white/25 transition-colors"
      @click="goLogin"
    >
      <i class="bi bi-box-arrow-in-right" />
      <span>เข้าสู่ระบบ</span>
    </button>

    <!-- Logged in -->
    <template v-else>
      <button
        class="flex items-center gap-2 bg-white/15 border border-white/30 px-3 py-1.5 rounded-lg text-sm text-white hover:bg-white/25 transition-colors"
        @click="open = !open"
      >
        <i class="bi bi-person-circle" />
        <span>{{ authStore.user?.userId }}</span>
        <i class="bi bi-chevron-down text-xs opacity-70" />
      </button>

      <Transition name="dropdown">
        <div
          v-if="open"
          class="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-[1000] overflow-hidden"
        >
          <!-- User info -->
          <div class="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <div class="text-sm font-semibold text-gray-700">{{ authStore.user?.name }}</div>
            <div class="text-xs text-gray-400">{{ authStore.isAdmin ? 'Administrator' : 'Viewer' }}</div>
          </div>

          <!-- Admin menus -->
          <template v-if="authStore.isAdmin">
            <button v-for="item in adminMenus" :key="item.key"
              class="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-800 transition-colors text-left"
              @click="onSelect(item.key)">
              <i :class="['bi', item.icon, 'text-gray-400 text-base']" />
              {{ item.label }}
            </button>
          </template>

          <hr class="border-gray-100" />

          <button
            class="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
            @click="logout">
            <i class="bi bi-box-arrow-right text-red-400 text-base" />
            Log out
          </button>
        </div>
      </Transition>
    </template>
  </div>

  <ProgramConfigModal v-model="showConfig" />
  <DetailMasterModal v-model="showMaster" />
  <UserManagementModal v-model="showUsers" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ProgramConfigModal from './ProgramConfigModal.vue'
import DetailMasterModal from './DetailMasterModal.vue'
import UserManagementModal from './UserManagementModal.vue'

const router = useRouter()
const authStore = useAuthStore()

const open = ref(false)
const showConfig = ref(false)
const showMaster = ref(false)
const showUsers = ref(false)
const panelRef = ref<HTMLElement>()

const adminMenus = [
  { key: 'users',  icon: 'bi-people',  label: 'User Management' },
  { key: 'config', icon: 'bi-gear',    label: 'Program Configuration' },
  { key: 'master', icon: 'bi-table',   label: 'Detail Master' },
]

function goLogin() { router.push('/login') }

function onSelect(key: string) {
  open.value = false
  if (key === 'users')  showUsers.value  = true
  if (key === 'config') showConfig.value = true
  if (key === 'master') showMaster.value = true
}

function logout() {
  open.value = false
  authStore.logout()
  router.push('/login')
}

function onClickOutside(e: MouseEvent) {
  if (panelRef.value && !panelRef.value.contains(e.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
