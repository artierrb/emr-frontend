<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="fixed inset-0 z-[9000] flex items-center justify-center">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="$emit('update:modelValue', false)" />
        <div class="relative bg-white rounded-xl shadow-2xl flex flex-col" style="width:1000px;max-height:90vh;">

          <!-- Header -->
          <div class="flex items-center gap-2 px-5 py-3 border-b border-gray-100 flex-shrink-0">
            <i class="bi bi-file-earmark-text text-[#2563a8]" />
            <span class="font-semibold text-sm">Form Management</span>
            <div class="flex-1" />
            <button class="viewer-btn-dark" @click="$emit('update:modelValue', false)">
              <i class="bi bi-x-lg" />
            </button>
          </div>

          <!-- Toolbar -->
          <div class="flex items-center gap-2 px-4 py-2 border-b border-gray-100 flex-shrink-0 bg-gray-50">
            <select v-model="searchField" class="form-select text-sm py-1 flex-shrink-0" style="width:110px;min-width:110px;">
              <option value="FORMCODE">Form Code</option>
              <option value="NAME">Name</option>
            </select>
            <div class="relative flex-1 min-w-0">
              <input v-model="searchKeyword" type="text" class="form-input text-sm py-1 w-full pr-8"
                placeholder="ค้นหา..." @keyup.enter="loadForms" />
              <button
                v-if="searchKeyword"
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="ล้างคำค้นหา"
                @click="clearSearch"
              ><i class="bi bi-x-lg text-xs" /></button>
            </div>
            <button class="btn-outline text-sm py-1 gap-1" @click="loadForms">
              <i class="bi bi-search" /> ค้นหา
            </button>
            <button class="btn-primary text-sm py-1 gap-1" @click="openAdd">
              <i class="bi bi-plus-lg" /> เพิ่ม
            </button>
          </div>

          <!-- Table -->
          <div class="flex-1 overflow-auto min-h-0">
            <div v-if="loading" class="flex justify-center py-10"><span class="loading-spinner" /></div>
            <table v-else class="w-full text-xs border-collapse">
              <thead class="sticky top-0 z-10">
                <tr>
                  <th class="fm-th whitespace-nowrap" style="width:120px;">Form Code</th>
                  <th class="fm-th">Form Name</th>
                  <th class="fm-th" style="width:140px;">Group</th>
                  <th class="fm-th text-center">Use</th>
                  <th class="fm-th text-center">OCR</th>
                  <th class="fm-th text-center">MEDI</th>
                  <th class="fm-th text-center">OCR Print</th>
                  <th class="fm-th text-center">Pages</th>
                  <th class="fm-th text-center">Follow</th>
                  <th class="fm-th text-center">Print</th>
                  <th class="fm-th text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="forms.length === 0">
                  <td colspan="11" class="text-center py-6 text-gray-400">ไม่พบข้อมูล</td>
                </tr>
                <tr v-for="f in forms" :key="f.FORMCODE"
                  class="cursor-pointer hover:bg-blue-50 transition-colors"
                  :class="selectedForm?.FORMCODE === f.FORMCODE ? 'bg-blue-100' : ''"
                  @click="selectedForm = f" @dblclick="selectedForm = f; openEdit()">
                  <td class="fm-td font-mono font-semibold text-[#2563a8] whitespace-nowrap">{{ f.FORMCODE }}</td>
                  <td class="fm-td">{{ f.NAME }}</td>
                  <td class="fm-td">{{ f.GRPNAME || f.GRPCODE || '-' }}</td>
                  <td class="fm-td text-center"><i :class="f.ACTIVE === '1' ? 'bi bi-check-circle-fill text-green-500' : 'bi bi-circle text-gray-300'" /></td>
                  <td class="fm-td text-center"><i :class="f.OCRYN === 'Y' ? 'bi bi-check-circle-fill text-green-500' : 'bi bi-circle text-gray-300'" /></td>
                  <td class="fm-td text-center"><i :class="f.MEDIYN === 'Y' ? 'bi bi-check-circle-fill text-green-500' : 'bi bi-circle text-gray-300'" /></td>
                  <td class="fm-td text-center"><i :class="f.OCRPRINT === 'Y' ? 'bi bi-check-circle-fill text-green-500' : 'bi bi-circle text-gray-300'" /></td>
                  <td class="fm-td text-center">{{ f.PAGECOUNT || '-' }}</td>
                  <td class="fm-td text-center"><i :class="f.FOLLOWYN === 'Y' ? 'bi bi-check-circle-fill text-green-500' : 'bi bi-circle text-gray-300'" /></td>
                  <td class="fm-td text-center"><i :class="f.PRINTYN === 'Y' ? 'bi bi-check-circle-fill text-green-500' : 'bi bi-circle text-gray-300'" /></td>
                  <td class="fm-td" @click.stop>
                    <div class="flex items-center justify-center gap-1">
                      <button class="fm-action-btn" title="แก้ไข" @click="openEdit(f)">
                        <i class="bi bi-pencil" />
                      </button>
                      <button class="fm-action-btn fm-action-danger" title="ลบ" @click="doDelete(f)">
                        <i class="bi bi-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Status bar -->
          <div class="px-4 py-2 border-t border-gray-100 text-sm text-gray-400 flex-shrink-0">
            {{ forms.length }} รายการ
            <span v-if="selectedForm" class="ml-3 text-[#2563a8]">เลือก: {{ selectedForm.FORMCODE }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Add/Edit Modal -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showForm" class="fixed inset-0 z-[9100] flex items-center justify-center">
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
        <div class="relative bg-white rounded-xl shadow-2xl w-[520px] overflow-hidden">
          <div class="flex items-center gap-2 px-5 py-3 border-b">
            <i class="bi bi-file-earmark-text text-[#2563a8]" />
            <span class="font-semibold text-sm">{{ formMode === 'add' ? 'เพิ่มฟอร์ม' : 'แก้ไขฟอร์ม' }}</span>
          </div>
          <div class="px-5 py-4 grid grid-cols-2 gap-3 text-sm">
            <!-- Form Code -->
            <div>
              <label class="form-label">Form Code *</label>
              <div class="relative">
                <input v-model="form.FORMCODE" class="form-input"
                  :class="formCodeError ? 'fm-input-error' : ''"
                  :disabled="formMode === 'edit'"
                  placeholder="FM-XX-001" maxlength="12"
                  @blur="checkFormCode" @input="formCodeError = ''" />
                <span v-if="checkingCode"
                  class="absolute right-2 top-1/2 -translate-y-1/2 loading-spinner" />
              </div>
              <p v-if="formCodeError" class="fm-error-text">
                <i class="bi bi-exclamation-circle-fill" /> {{ formCodeError }}
              </p>
            </div>
            <!-- Form Name -->
            <div>
              <label class="form-label">Form Name *</label>
              <input v-model="form.NAME" class="form-input" placeholder="ชื่อฟอร์ม" maxlength="200" />
            </div>
            <!-- Group -->
            <div>
              <label class="form-label">Group</label>
              <EMRCombobox
                v-model="form.GRPCODE"
                :options="groupOptions"
                :selected-label="groupSelectedLabel"
                placeholder="-- ไม่ระบุ --"
                empty-text="ไม่มีกลุ่ม"
                leading-icon="bi bi-collection"
                clearable
              />
            </div>
            <!-- Page Count -->
            <div>
              <label class="form-label">Page Count</label>
              <input v-model.number="form.PAGECOUNT" type="number" min="1" class="form-input" />
            </div>
            <!-- Checkboxes row 1 -->
            <div class="col-span-2 grid grid-cols-5 gap-2 mt-1">
              <label class="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" v-model="form.ACTIVE" true-value="1" false-value="0" class="rounded" />
                <span>Use</span>
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" v-model="form.OCRYN" true-value="Y" false-value="N" class="rounded" />
                <span>OCR Y/N</span>
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" v-model="form.MEDIYN" true-value="Y" false-value="N" class="rounded" />
                <span>MEDI Y/N</span>
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" v-model="form.OCRPRINT" true-value="Y" false-value="N" class="rounded" />
                <span>OCR Print</span>
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" v-model="form.FOLLOWYN" true-value="Y" false-value="N" class="rounded" />
                <span>Follow Y/N</span>
              </label>
            </div>
            <div class="col-span-2 grid grid-cols-5 gap-2">
              <label class="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" v-model="form.PRINTYN" true-value="Y" false-value="N" class="rounded" />
                <span>Print Y/N</span>
              </label>
            </div>
          </div>
          <div class="px-5 py-3 border-t flex gap-2 justify-end">
            <button class="btn-outline text-sm" @click="showForm = false">ยกเลิก</button>
            <button class="btn-primary text-sm gap-1" :disabled="saving || checkingCode || !!formCodeError" @click="doSave">
              <span v-if="saving" class="loading-spinner" />
              <i v-else class="bi bi-check-lg" /> บันทึก
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import api from '@/services/api'
import { useDialog } from '@/composables/useDialog'
import EMRCombobox from '@/components/common/EMRCombobox.vue'
import type { ComboOption } from '@/components/common/EMRCombobox.vue'

const props = defineProps<{ modelValue: boolean }>()
const emit  = defineEmits(['update:modelValue'])
const { alert: dlgAlert, confirm: dlgConfirm } = useDialog()

const loading   = ref(false)
const saving    = ref(false)
const forms     = ref<any[]>([])
const grpList   = ref<any[]>([])
const selectedForm = ref<any>(null)
const searchField   = ref('FORMCODE')
const searchKeyword = ref('')
const showForm  = ref(false)
const formMode  = ref<'add'|'edit'>('add')
const formCodeError = ref('')      // ข้อความ error ใต้ช่อง Form Code (ว่าง = ผ่าน)
const checkingCode  = ref(false)   // กำลังเช็คซ้ำกับ backend

const emptyForm = () => ({
  FORMCODE: '', NAME: '', GRPCODE: '', ACTIVE: '1',
  OCRYN: 'N', MEDIYN: 'N', OCRPRINT: 'N', PAGECOUNT: 1,
  FOLLOWYN: 'N', PRINTYN: 'N'
})
const form = ref(emptyForm())

// Group → EMRCombobox options
const groupOptions = computed<ComboOption[]>(() =>
  grpList.value.map(g => ({ value: g.GRPCODE, label: `${g.NAME} (${g.GRPCODE})`, code: g.GRPCODE }))
)
// โชว์ label ของค่าเดิมตอน edit แม้ options ยังโหลดไม่เสร็จ
const groupSelectedLabel = computed(() => {
  const hit = grpList.value.find(g => g.GRPCODE === form.value.GRPCODE)
  return hit ? `${hit.NAME} (${hit.GRPCODE})` : (form.value.GRPCODE || '')
})

watch(() => props.modelValue, async (v) => {
  if (v) {
    await loadForms()
    await loadGrpList()
    selectedForm.value = null
  } else {
    // เคลียร์ค่าเมื่อปิด modal
    searchKeyword.value = ''
    searchField.value = 'FORMCODE'
    forms.value = []
    selectedForm.value = null
  }
})

// ล้างคำค้นหาแล้วโหลดใหม่
function clearSearch() {
  searchKeyword.value = ''
  loadForms()
}

async function loadForms() {
  loading.value = true
  try {
    const res = await api.get('/forms/manage', {
      params: { field: searchField.value, keyword: searchKeyword.value }
    })
    forms.value = res.data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function loadGrpList() {
  try {
    const res = await api.get('/forms/groups')
    grpList.value = res.data
  } catch (e) { console.error(e) }
}

function openAdd() {
  form.value = emptyForm()
  formMode.value = 'add'
  formCodeError.value = ''
  checkingCode.value = false
  showForm.value = true
}

function openEdit(f?: any) {
  const target = f || selectedForm.value
  if (!target) return
  selectedForm.value = target
  form.value = { ...target }
  formMode.value = 'edit'
  formCodeError.value = ''   // โหมด edit ไม่เช็คซ้ำ (FORMCODE ถูก disable)
  checkingCode.value = false
  showForm.value = true
}

// เช็ค FORMCODE ซ้ำกับ backend — เรียกตอน blur ออกจากช่อง (เฉพาะโหมด add)
// คืน true ถ้า "ผ่าน" (ไม่ซ้ำ), false ถ้าซ้ำ/ว่าง/error
async function checkFormCode(): Promise<boolean> {
  if (formMode.value === 'edit') return true      // edit ไม่เช็ค
  const code = form.value.FORMCODE?.trim() || ''
  if (!code) { formCodeError.value = ''; return false }
  checkingCode.value = true
  try {
    const res = await api.get('/forms/exists', { params: { formCode: code } })
    if (res.data?.exists) {
      formCodeError.value = 'Form Code นี้มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น'
      return false
    }
    formCodeError.value = ''
    return true
  } catch (e) {
    // เช็คไม่สำเร็จ — ไม่บล็อคที่ตรงนี้ ปล่อยให้ backend guard จับตอนบันทึก
    console.error(e)
    formCodeError.value = ''
    return true
  } finally {
    checkingCode.value = false
  }
}

async function doSave() {
  if (!form.value.FORMCODE?.trim()) { await dlgAlert('กรุณากรอก Form Code', { type: 'warning' }); return }
  if (!form.value.NAME?.trim())     { await dlgAlert('กรุณากรอก Form Name', { type: 'warning' }); return }

  // เช็คซ้ำอีกครั้งตอนกดบันทึก (เฉพาะ add) — กันกรณีผู้ใช้ไม่ได้ blur หรือแก้ค่าหลัง blur
  if (formMode.value === 'add') {
    const ok = await checkFormCode()
    if (!ok) {
      // ถ้าซ้ำ formCodeError ถูกตั้งแล้ว, ถ้าว่างก็เตือน — ไม่บันทึก
      if (!formCodeError.value) formCodeError.value = 'กรุณากรอก Form Code'
      await dlgAlert(formCodeError.value, { type: 'warning' })
      return
    }
  }

  saving.value = true
  try {
    if (formMode.value === 'add') {
      await api.post('/forms/insert', form.value)
    } else {
      await api.post('/forms/update', form.value)
    }
    await dlgAlert('บันทึกสำเร็จ', { type: 'success' })
    showForm.value = false
    await loadForms()
  } catch (e: any) {
    // 409 = FORMCODE ซ้ำ (backend guard ชั้นสุดท้าย) — โชว์ที่ช่อง form code ด้วย
    if (e.response?.status === 409) {
      formCodeError.value = e.response?.data?.error || 'Form Code นี้มีอยู่ในระบบแล้ว'
      await dlgAlert(formCodeError.value, { type: 'error' })
    } else {
      await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
    }
  } finally { saving.value = false }
}

async function doDelete(f?: any) {
  const target = f || selectedForm.value
  if (!target) return
  const ok = await dlgConfirm(`ต้องการลบฟอร์ม "${target.FORMCODE}" หรือไม่?`)
  if (!ok) return
  try {
    await api.delete(`/forms/${encodeURIComponent(target.FORMCODE)}`)
    await dlgAlert('ลบสำเร็จ', { type: 'success' })
    if (selectedForm.value?.FORMCODE === target.FORMCODE) selectedForm.value = null
    await loadForms()
  } catch (e: any) {
    await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
  }
}
</script>

<style scoped>
.fm-th {
  background: var(--cis-primary, #2563a8); color: white;
  padding: 0.5rem 0.75rem; text-align: left;
  font-size: 0.85rem; font-weight: 500; white-space: nowrap;
}
.fm-td {
  padding: 0.4rem 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.85rem;
}
.viewer-btn-dark {
  background: rgba(0,0,0,0.08); border: 1px solid #e5e7eb; color: #374151;
  padding: 0.35rem 0.65rem; border-radius: 0.375rem;
  font-size: 0.875rem; cursor: pointer;
}
.fm-action-btn {
  width: 1.6rem; height: 1.6rem;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 0.375rem; border: 1px solid #e2e8f0;
  background: #fff; color: #475569; font-size: 0.8rem;
  cursor: pointer; transition: all 0.15s;
}
.fm-action-btn:hover {
  border-color: var(--cis-primary, #2563a8);
  color: var(--cis-primary, #2563a8);
  background: var(--cis-primary-soft, #e3edf7);
}
.fm-action-danger:hover {
  border-color: var(--cis-danger, #dc2626);
  color: var(--cis-danger, #dc2626);
  background: var(--cis-danger-soft, #fee2e2);
}
.fm-input-error {
  border-color: #dc2626 !important;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12) !important;
}
.fm-error-text {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #dc2626;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>