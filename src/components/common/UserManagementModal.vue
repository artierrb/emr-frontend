<template>
  <BaseModal
    :model-value="modelValue"
    title="User Management"
    icon="bi-people"
    width="820px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <!-- Toolbar -->
    <div class="flex gap-2 mb-4 items-center flex-wrap">
      <select v-model="searchField" class="form-select max-w-[160px]">
        <option value="USERID">User ID</option>
        <option value="NAME">ชื่อ</option>
      </select>
      <div class="relative flex-1 min-w-[200px]">
        <input v-model="keyword" type="text" class="form-input w-full pr-8" placeholder="ค้นหา..." @keydown.enter="onSearch" />
        <button
          v-if="keyword"
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          title="ล้างคำค้นหา"
          @click="clearSearch"
        ><i class="bi bi-x-lg text-xs" /></button>
      </div>
      <button class="btn-primary gap-1" @click="onSearch"><i class="bi bi-search" /> ค้นหา</button>
      <div class="w-8" />
      <button class="btn-primary gap-1" @click="openForm('add')"><i class="bi bi-plus-lg" /> เพิ่ม</button>
      <button class="btn-outline gap-1" @click="doInterface" :disabled="interfacing">
        <span v-if="interfacing" class="loading-spinner" />
        <i v-else class="bi bi-arrow-repeat" /> User Interface
      </button>
    </div>

    <!-- Table -->
    <div v-if="loading" class="flex justify-center py-8"><span class="loading-spinner" /></div>
    <template v-else>
    <table class="result-table">
      <thead>
        <tr>
          <th>User ID</th><th>ชื่อ</th><th>Auth</th><th>CLINCODE</th><th>วันหมดอายุ</th>
          <th class="text-center w-[90px]">จัดการ</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="users.length === 0">
          <td colspan="6" class="text-center py-4 text-gray-400">ไม่พบข้อมูล</td>
        </tr>
        <tr
          v-for="u in users" :key="u.USERID"
          class="hover:bg-blue-50"
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
          <td class="text-center whitespace-nowrap">
            <button
              class="icon-btn text-blue-600 hover:bg-blue-100"
              title="แก้ไข" @click="openForm('edit', u)"
            ><i class="bi bi-pencil" /></button>
            <button
              class="icon-btn text-red-500 hover:bg-red-100"
              title="ลบ" @click="confirmDelete(u)"
            ><i class="bi bi-trash" /></button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination (list mode เท่านั้น) -->
    <div v-if="!isSearchMode && listPages > 1"
      class="flex items-center justify-between mt-3 text-sm">
      <span class="text-gray-500">
        ทั้งหมด {{ listTotal.toLocaleString() }} คน · หน้า {{ listPage + 1 }} / {{ listPages }}
      </span>
      <div class="flex items-center gap-1">
        <button class="pg-btn" :disabled="listPage <= 0" @click="goPage(0)" title="หน้าแรก">
          <i class="bi bi-chevron-double-left" />
        </button>
        <button class="pg-btn" :disabled="listPage <= 0" @click="goPage(listPage - 1)" title="ก่อนหน้า">
          <i class="bi bi-chevron-left" />
        </button>
        <button
          v-for="pg in pageWindow" :key="pg"
          class="pg-btn" :class="pg === listPage ? 'pg-btn-active' : ''"
          @click="goPage(pg)"
        >{{ pg + 1 }}</button>
        <button class="pg-btn" :disabled="listPage >= listPages - 1" @click="goPage(listPage + 1)" title="ถัดไป">
          <i class="bi bi-chevron-right" />
        </button>
        <button class="pg-btn" :disabled="listPage >= listPages - 1" @click="goPage(listPages - 1)" title="หน้าสุดท้าย">
          <i class="bi bi-chevron-double-right" />
        </button>
      </div>
    </div>
    </template>

    <template #footer>
      <div class="flex-1 text-sm text-gray-500">
        <template v-if="isSearchMode">ผลค้นหา {{ users.length }} รายการ</template>
        <template v-else>ทั้งหมด {{ listTotal.toLocaleString() }} คน</template>
      </div>
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
        <div class="relative">
          <input v-model="form.userId" class="form-input" :readonly="formMode === 'edit'"
            :class="[formMode === 'edit' ? 'bg-gray-50' : '', userIdError ? 'um-input-error' : '']"
            maxlength="10"
            @blur="checkUserId" @input="userIdError = ''" />
          <span v-if="checkingId" class="absolute right-2 top-1/2 -translate-y-1/2 loading-spinner" />
        </div>
        <p v-if="userIdError" class="um-error-text">
          <i class="bi bi-exclamation-circle-fill" /> {{ userIdError }}
        </p>
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
        <EMRCombobox
          v-model="form.auth"
          :options="authOptions"
          :selected-label="authSelectedLabel"
          placeholder="เลือกสิทธิ์..."
          leading-icon="bi bi-shield-lock"
        />
      </div>
      <div>
        <label class="form-label">CLINCODE</label>
        <EMRCombobox
          v-model="form.clinCode"
          :options="clinicOptions"
          :selected-label="clinicSelectedLabel"
          placeholder="เลือกคลินิก..."
          empty-text="ไม่มีคลินิก"
          leading-icon="bi bi-hospital"
        />
      </div>
      <div>
        <label class="form-label">วันหมดอายุ</label>
        <EMRDatePicker v-model="form.edate" placeholder="วว/ดด/ปปปป" />
      </div>
    </div>
    <template #footer>
      <button class="btn-outline" @click="showForm = false">ยกเลิก</button>
      <button class="btn-primary gap-1" :disabled="saving || checkingId || !!userIdError" @click="saveForm">
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
            ลบผู้ใช้ <strong>{{ delTarget?.USERID }}</strong> ({{ delTarget?.NAME }}) ?
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
import { ref, reactive, watch, computed } from 'vue'
import BaseModal from './BaseModal.vue'
import EMRCombobox from '@/components/common/EMRCombobox.vue'
import type { ComboOption } from '@/components/common/EMRCombobox.vue'
import EMRDatePicker from '@/components/common/EMRDatePicker.vue'
import api, { clinicApi } from '@/services/api'
import { useDialog } from '@/composables/useDialog'
const { alert: dlgAlert, confirm: dlgConfirm } = useDialog()

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

watch(() => props.modelValue, v => {
  if (v) { searched.value = false; loadPage(0); loadClinics() }
  else {
    // เคลียร์ค่าเมื่อปิด modal
    keyword.value = ''
    searchField.value = 'USERID'
    users.value = []
    searched.value = false
    listPage.value = 0
    listTotal.value = 0
    listPages.value = 0
  }
})

const users = ref<any[]>([])
const delTarget = ref<any>(null)
const loading = ref(false)
const interfacing = ref(false)
const searchField = ref('USERID')
const keyword = ref('')
const searched = ref(false)              // true = โหมดค้นหา (ไม่แบ่งหน้า)
const PAGE_SIZE = 100
const listPage = ref(0)
const listTotal = ref(0)
const listPages = ref(0)
const showForm = ref(false)
const showConfirm = ref(false)
const saving = ref(false)
const formMode = ref<'add'|'edit'>('add')
const form = reactive({ userId:'', password:'', name:'', auth:'0', clinCode:'', edate:'' })
const userIdError = ref('')      // ข้อความ error ใต้ช่อง User ID (ว่าง = ผ่าน)
const checkingId  = ref(false)   // กำลังเช็คซ้ำกับ backend

// ── สิทธิ์ (static) ──
const authOptions: ComboOption[] = [
  { value: '0', label: 'View' },
  { value: '1', label: 'Manager' },
  { value: '3', label: 'Admin' },
]
const authSelectedLabel = computed(() =>
  authOptions.find(o => o.value === form.auth)?.label || ''
)

// ── CLINCODE dropdown (CLINICT ทั้งหมด, order by NAME) ──
const clinics = ref<{ CLINCODE: string; NAME: string }[]>([])
const clinicOptions = computed<ComboOption[]>(() =>
  clinics.value.map(c => ({ value: c.CLINCODE, label: c.NAME, code: c.CLINCODE }))
)
// โชว์ label ของค่าเดิมตอน edit แม้ options ยังโหลดไม่เสร็จ
const clinicSelectedLabel = computed(() => {
  const hit = clinics.value.find(c => c.CLINCODE === form.clinCode)
  return hit ? `${hit.CLINCODE} - ${hit.NAME}` : (form.clinCode || '')
})

async function loadClinics() {
  if (clinics.value.length) return
  try { clinics.value = await clinicApi.getAll() }
  catch { clinics.value = [] }
}

// โหมดค้นหา = ผู้ใช้กดค้นหาที่มี keyword (แสดงผลไม่แบ่งหน้า เหมือน PatientSearch)
const isSearchMode = computed(() => searched.value)

// หน้าต่างเลขหน้า รอบๆ หน้าปัจจุบัน (สูงสุด 5 ปุ่ม)
const pageWindow = computed(() => {
  const total = listPages.value
  const cur = listPage.value
  const win = 5
  let start = Math.max(0, cur - Math.floor(win / 2))
  let end = Math.min(total, start + win)
  start = Math.max(0, end - win)
  const arr: number[] = []
  for (let i = start; i < end; i++) arr.push(i)
  return arr
})

// list mode: โหลดทีละหน้า (server-side OFFSET/FETCH)
async function loadPage(page: number) {
  loading.value = true
  searched.value = false
  try {
    const res = await api.get('/users/list', {
      params: { field: searchField.value, keyword: '', page, size: PAGE_SIZE }
    })
    users.value = res.data.data
    listPage.value = res.data.page
    listTotal.value = res.data.total
    listPages.value = res.data.pages
  } finally { loading.value = false }
}

function goPage(pg: number) {
  if (pg < 0 || pg >= listPages.value) return
  loadPage(pg)
}

// กดปุ่มค้นหา / Enter: มี keyword → search mode, ว่าง → กลับ list
async function onSearch() {
  if (!keyword.value.trim()) { backToList(); return }
  loading.value = true
  try {
    const res = await api.get('/users/search', {
      params: { field: searchField.value, keyword: keyword.value }
    })
    users.value = res.data
    searched.value = true
  } finally { loading.value = false }
}

// กลับสู่โหมด list ทั้งหมด (หน้าปัจจุบัน หรือ 0)
function backToList() {
  searched.value = false
  loadPage(0)
}

// ล้างคำค้นหาแล้วกลับ list
function clearSearch() {
  keyword.value = ''
  backToList()
}

// reload หลัง add/update/delete: ถ้าอยู่ search mode ค้นซ้ำ, ไม่งั้น reload หน้าปัจจุบัน
function reloadCurrent() {
  if (searched.value && keyword.value.trim()) onSearch()
  else loadPage(listPage.value)
}

function openForm(mode: 'add'|'edit', u?: any) {
  if (mode === 'edit' && !u) return
  formMode.value = mode
  userIdError.value = ''
  checkingId.value = false
  if (mode === 'add') {
    Object.assign(form, { userId:'', password:'', name:'', auth:'0', clinCode:'', edate:'' })
  } else {
    const d = (u.EDATE||'').trim()
    form.userId   = u.USERID
    form.password = ''
    form.name     = u.NAME
    form.auth     = u.AUTH || '0'
    form.clinCode = u.CLINCODE || ''
    form.edate    = d.length >= 8 ? d.substring(0,8) : ''
  }
  showForm.value = true
}

// เช็ค USERID ซ้ำกับ backend — เรียกตอน blur (เฉพาะโหมด add)
// คืน true ถ้า "ผ่าน" (ไม่ซ้ำ), false ถ้าซ้ำ/ว่าง
async function checkUserId(): Promise<boolean> {
  if (formMode.value === 'edit') return true      // edit ไม่เช็ค (USERID readonly)
  const uid = form.userId?.trim() || ''
  if (!uid) { userIdError.value = ''; return false }
  checkingId.value = true
  try {
    const res = await api.get('/users/exists', { params: { userId: uid } })
    if (res.data?.exists) {
      userIdError.value = 'User ID นี้มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น'
      return false
    }
    userIdError.value = ''
    return true
  } catch (e) {
    // เช็คไม่สำเร็จ — ไม่บล็อคตรงนี้ ปล่อยให้ backend guard จับตอนบันทึก
    console.error(e)
    userIdError.value = ''
    return true
  } finally {
    checkingId.value = false
  }
}

async function saveForm() {
  if (!form.userId.trim()) { await dlgAlert('กรุณากรอก User ID', { type: 'warning' }); return }
  if (!form.name.trim()) { await dlgAlert('กรุณากรอกชื่อ', { type: 'warning' }); return }
  if (!form.edate) { await dlgAlert('กรุณาเลือกวันหมดอายุ', { type: 'warning' }); return }

  // เช็คซ้ำอีกครั้งตอนกดบันทึก (เฉพาะ add)
  if (formMode.value === 'add') {
    const ok = await checkUserId()
    if (!ok) {
      if (!userIdError.value) userIdError.value = 'กรุณากรอก User ID'
      await dlgAlert(userIdError.value, { type: 'warning' })
      return
    }
  }

  saving.value = true
  try {
    const edate = form.edate || ''
    const clinCode = form.clinCode || ''
    if (formMode.value === 'add') {
      if (!form.password) { await dlgAlert('กรุณากรอกรหัสผ่าน', { type: 'warning' }); saving.value = false; return }
      await api.post('/users/insert', { ...form, edate, clinCode })
    } else {
      await api.post('/users/update', { userId: form.userId, name: form.name, auth: form.auth, clinCode, edate })
      if (form.password) {
        await api.post('/users/password', { userId: form.userId, password: form.password })
      }
    }
    showForm.value = false
    await reloadCurrent()
  } catch (e: any) {
    // 409 = USERID ซ้ำ (backend guard) — โชว์ที่ช่อง User ID ด้วย
    if (e.response?.status === 409) {
      userIdError.value = e.response?.data?.error || 'User ID นี้มีอยู่ในระบบแล้ว'
      await dlgAlert(userIdError.value, { type: 'error' })
    } else {
      await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
    }
  } finally { saving.value = false }
}

function confirmDelete(u: any) { delTarget.value = u; showConfirm.value = true }

async function doDelete() {
  if (!delTarget.value) return
  try {
    await api.delete(`/users/${encodeURIComponent(delTarget.value.USERID)}`)
    showConfirm.value = false; delTarget.value = null; await reloadCurrent()
  } catch (e: any) { await dlgAlert(e.response?.data?.error || e.message, { type: 'error' }) }
}

async function doInterface() {
  const _ok = await dlgConfirm('Sync ข้อมูล User จาก HIS?'); if (!_ok) return
  interfacing.value = true
  try { await api.post('/users/interface'); keyword.value=''; searched.value=false; await loadPage(0) }
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
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: background-color 0.15s;
}
.icon-btn + .icon-btn { margin-left: 4px; }
.um-input-error { border-color: #dc2626 !important; box-shadow: 0 0 0 3px rgba(220,38,38,0.12) !important; }
.um-error-text { margin-top: 0.25rem; font-size: 0.75rem; color: #dc2626; display: flex; align-items: center; gap: 0.25rem; }
.pg-btn {
  min-width: 2rem; height: 2rem; padding: 0 0.4rem;
  display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid var(--cis-border, #e2e8f0); border-radius: 0.375rem;
  background: #fff; color: var(--cis-text-secondary, #475569);
  font-size: 0.8rem; cursor: pointer; transition: all 0.15s;
}
.pg-btn:hover:not(:disabled) {
  border-color: var(--cis-primary, #2563a8);
  color: var(--cis-primary, #2563a8);
  background: var(--cis-primary-soft, #e3edf7);
}
.pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pg-btn-active {
  background: var(--cis-primary, #2563a8);
  border-color: var(--cis-primary, #2563a8);
  color: #fff; font-weight: 600;
}
.pg-btn-active:hover { color: #fff; background: var(--cis-primary, #2563a8); }
</style>