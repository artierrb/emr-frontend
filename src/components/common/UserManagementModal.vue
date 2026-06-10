<template>
  <BaseModal
    :model-value="modelValue"
    title="User Management"
    icon="bi-people"
    width="820px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <!-- Toolbar -->
    <div class="flex gap-2 mb-4 flex-wrap">
      <select v-model="searchField" class="form-select max-w-[160px]">
        <option value="USERID">User ID</option>
        <option value="NAME">ชื่อ</option>
      </select>
      <input v-model="keyword" type="text" class="form-input flex-1" placeholder="ค้นหา..." @keydown.enter="load" />
      <button class="btn-primary gap-1" @click="load"><i class="bi bi-search" /> ค้นหา</button>
      <div class="flex-1" />
      <button class="btn-primary gap-1" @click="openForm('add')"><i class="bi bi-plus-lg" /> เพิ่ม</button>
      <button class="btn-outline gap-1" @click="openForm('edit')" :disabled="!selected"><i class="bi bi-pencil" /> แก้ไข</button>
      <button class="btn-danger gap-1" @click="confirmDelete" :disabled="!selected"><i class="bi bi-trash" /> ลบ</button>
      <button class="btn-outline gap-1" @click="doInterface" :disabled="interfacing">
        <span v-if="interfacing" class="loading-spinner" />
        <i v-else class="bi bi-arrow-repeat" /> User Interface
      </button>
    </div>

    <!-- Table -->
    <div v-if="loading" class="flex justify-center py-8"><span class="loading-spinner" /></div>
    <table v-else class="result-table">
      <thead>
        <tr>
          <th>User ID</th><th>ชื่อ</th><th>Auth</th><th>CLINCODE</th><th>วันหมดอายุ</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="users.length === 0">
          <td colspan="5" class="text-center py-4 text-gray-400">ไม่พบข้อมูล</td>
        </tr>
        <tr
          v-for="u in users" :key="u.USERID"
          class="clickable" :class="{ selected: selected?.USERID === u.USERID }"
          @click="selected = u"
        >
          <td class="font-mono text-xs">{{ u.USERID }}</td>
          <td>{{ u.NAME }}</td>
          <td>
            <span :class="u.AUTH === '3' ? 'text-blue-700 font-semibold' : 'text-gray-500'">
              {{ u.AUTH === '3' ? 'Admin' : 'View' }}
            </span>
          </td>
          <td class="text-xs text-gray-400">{{ u.CLINCODE }}</td>
          <td class="text-xs" :class="isExpired(u.EDATE) ? 'text-red-500' : 'text-gray-500'">
            {{ formatDate(u.EDATE) }}
          </td>
        </tr>
      </tbody>
    </table>

    <template #footer>
      <button class="btn-outline" @click="emit('update:modelValue', false)">ปิด</button>
    </template>
  </BaseModal>

  <!-- Add/Edit Form -->
  <BaseModal
    :model-value="showForm"
    :title="formMode === 'add' ? 'เพิ่มผู้ใช้' : 'แก้ไขผู้ใช้'"
    width="460px"
    :z-index="6500"
    @update:model-value="showForm = false"
  >
    <div class="space-y-3">
      <div>
        <label class="form-label">User ID *</label>
        <input v-model="form.userId" class="form-input" :readonly="formMode === 'edit'"
          :class="formMode === 'edit' ? 'bg-gray-50' : ''" maxlength="10" />
      </div>
      <div v-if="formMode === 'add'">
        <label class="form-label">รหัสผ่าน *</label>
        <input v-model="form.password" type="password" class="form-input" />
      </div>
      <div v-if="formMode === 'edit'">
        <label class="form-label">รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)</label>
        <input v-model="form.password" type="password" class="form-input" placeholder="เว้นว่างถ้าไม่เปลี่ยน" />
      </div>
      <div>
        <label class="form-label">ชื่อ *</label>
        <input v-model="form.name" class="form-input" maxlength="100" />
      </div>
      <div>
        <label class="form-label">สิทธิ์</label>
        <select v-model="form.auth" class="form-select">
          <option value="0">View</option>
          <option value="3">Admin</option>
        </select>
      </div>
      <div>
        <label class="form-label">CLINCODE</label>
        <input v-model="form.clinCode" class="form-input" maxlength="6" />
      </div>
      <div>
        <label class="form-label">วันหมดอายุ</label>
        <input v-model="form.edateRaw" type="date" class="form-input" />
      </div>
    </div>
    <template #footer>
      <button class="btn-outline" @click="showForm = false">ยกเลิก</button>
      <button class="btn-primary gap-1" :disabled="saving" @click="saveForm">
        <i class="bi bi-check-lg" /> บันทึก
      </button>
    </template>
  </BaseModal>

  <!-- Confirm Delete -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showConfirm" class="fixed inset-0 z-[8000] flex items-center justify-center">
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="showConfirm=false" />
        <div class="relative bg-white rounded-xl shadow-2xl w-[360px] overflow-hidden">
          <div class="flex items-center gap-2 px-5 py-3 border-b">
            <i class="bi bi-exclamation-triangle-fill text-amber-500" />
            <span class="font-semibold text-sm">ยืนยันการลบ</span>
          </div>
          <div class="px-5 py-4 text-sm text-gray-600">
            ลบผู้ใช้ <strong>{{ selected?.USERID }}</strong> ({{ selected?.NAME }}) ?
          </div>
          <div class="px-5 py-3 border-t flex gap-2 justify-end">
            <button class="btn-outline" @click="showConfirm=false">ยกเลิก</button>
            <button class="btn-danger gap-1" @click="doDelete"><i class="bi bi-trash" /> ลบ</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import api from '@/services/api'
import { useDialog } from '@/composables/useDialog'
const { alert: dlgAlert, confirm: dlgConfirm } = useDialog()

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const users = ref<any[]>([])
const selected = ref<any>(null)
const loading = ref(false)
const interfacing = ref(false)
const searchField = ref('USERID')
const keyword = ref('')
const showForm = ref(false)
const showConfirm = ref(false)
const saving = ref(false)
const formMode = ref<'add'|'edit'>('add')
const form = reactive({ userId:'', password:'', name:'', auth:'0', clinCode:'', edateRaw:'' })

async function load() {
  loading.value = true
  try {
    const res = await api.get('/users/search', { params: { field: searchField.value, keyword: keyword.value } })
    users.value = res.data
  } finally { loading.value = false }
}

function openForm(mode: 'add'|'edit') {
  if (mode === 'edit' && !selected.value) return
  formMode.value = mode
  if (mode === 'add') {
    Object.assign(form, { userId:'', password:'', name:'', auth:'0', clinCode:'', edateRaw:'' })
  } else {
    const u = selected.value
    const d = (u.EDATE||'').trim()
    form.userId   = u.USERID
    form.password = ''
    form.name     = u.NAME
    form.auth     = u.AUTH || '0'
    form.clinCode = u.CLINCODE || ''
    form.edateRaw = d.length >= 8 ? `${d.substring(0,4)}-${d.substring(4,6)}-${d.substring(6,8)}` : ''
  }
  showForm.value = true
}

async function saveForm() {
  if (!form.userId.trim()) { await dlgAlert('กรุณากรอก User ID', { type: 'warning' }); return }
  if (!form.name.trim()) { await dlgAlert('กรุณากรอกชื่อ', { type: 'warning' }); return }
  saving.value = true
  try {
    const edate = form.edateRaw ? form.edateRaw.replace(/-/g,'') : ''
    if (formMode.value === 'add') {
      if (!form.password) { await dlgAlert('กรุณากรอกรหัสผ่าน', { type: 'warning' }); saving.value = false; return }
      await api.post('/users/insert', { ...form, edate, clinCode: form.clinCode })
    } else {
      await api.post('/users/update', { userId: form.userId, name: form.name, auth: form.auth, clinCode: form.clinCode, edate })
      if (form.password) {
        await api.post('/users/password', { userId: form.userId, password: form.password })
      }
    }
    showForm.value = false
    await load()
  } catch (e: any) {
    await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
  } finally { saving.value = false }
}

function confirmDelete() { if (selected.value) showConfirm.value = true }

async function doDelete() {
  try {
    await api.delete(`/users/${encodeURIComponent(selected.value.USERID)}`)
    showConfirm.value = false; selected.value = null; await load()
  } catch (e: any) { await dlgAlert(e.response?.data?.error || e.message, { type: 'error' }) }
}

async function doInterface() {
  const _ok = await dlgConfirm('Sync ข้อมูล User จาก HIS?'); if (!_ok) return
  interfacing.value = true
  try { await api.post('/users/interface'); await load() }
  catch (e: any) { await dlgAlert(e.response?.data?.error || e.message, { type: 'error' }) }
  finally { interfacing.value = false }
}

function formatDate(d: string) {
  if (!d || d.length < 8) return '-'
  return `${d.substring(6,8)}-${d.substring(4,6)}-${d.substring(0,4)}`
}

function isExpired(d: string) {
  if (!d || d.length < 8) return false
  const today = new Date().toISOString().substring(0,10).replace(/-/g,'')
  return d.trim() < today
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
