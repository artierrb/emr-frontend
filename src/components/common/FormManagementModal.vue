<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="fixed inset-0 z-[9000] flex items-center justify-center">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="$emit('update:modelValue', false)" />
        <div class="relative bg-white rounded-xl shadow-2xl flex flex-col" style="width:1000px;max-height:90vh;">

          <!-- Header -->
          <div class="flex items-center gap-2 px-5 py-3 border-b border-gray-100 flex-shrink-0">
            <i class="bi bi-file-earmark-text text-[#1a4f7a]" />
            <span class="font-semibold text-sm">Form Management</span>
            <div class="flex-1" />
            <button class="viewer-btn-dark" @click="$emit('update:modelValue', false)">
              <i class="bi bi-x-lg" />
            </button>
          </div>

          <!-- Toolbar -->
          <div class="flex items-center gap-2 px-4 py-2 border-b border-gray-100 flex-shrink-0 bg-gray-50">
            <select v-model="searchField" class="form-select text-sm py-1 w-32">
              <option value="FORMCODE">Form Code</option>
              <option value="NAME">Name</option>
            </select>
            <input v-model="searchKeyword" type="text" class="form-input text-sm py-1 w-52"
              placeholder="ค้นหา..." @keyup.enter="loadForms" />
            <button class="btn-outline text-sm py-1 gap-1" @click="loadForms">
              <i class="bi bi-search" /> ค้นหา
            </button>
            <div class="flex-1" />
            <button class="btn-primary text-sm py-1 gap-1" @click="openAdd">
              <i class="bi bi-plus-lg" /> เพิ่ม
            </button>
            <button class="btn-outline text-sm py-1 gap-1" :disabled="!selectedForm" @click="openEdit">
              <i class="bi bi-pencil" /> แก้ไข
            </button>
            <button class="btn-outline text-sm py-1 gap-1 text-red-600 border-red-300 hover:bg-red-50"
              :disabled="!selectedForm" @click="doDelete">
              <i class="bi bi-trash" /> ลบ
            </button>
          </div>

          <!-- Table -->
          <div class="flex-1 overflow-auto min-h-0">
            <div v-if="loading" class="flex justify-center py-10"><span class="loading-spinner" /></div>
            <table v-else class="w-full text-xs border-collapse">
              <thead class="sticky top-0 z-10">
                <tr>
                  <th class="fm-th">Form Code</th>
                  <th class="fm-th">Form Name</th>
                  <th class="fm-th">Group</th>
                  <th class="fm-th text-center">Use</th>
                  <th class="fm-th text-center">OCR</th>
                  <th class="fm-th text-center">MEDI</th>
                  <th class="fm-th text-center">OCR Print</th>
                  <th class="fm-th text-center">Pages</th>
                  <th class="fm-th text-center">Follow</th>
                  <th class="fm-th text-center">Print</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="forms.length === 0">
                  <td colspan="10" class="text-center py-6 text-gray-400">ไม่พบข้อมูล</td>
                </tr>
                <tr v-for="f in forms" :key="f.FORMCODE"
                  class="cursor-pointer hover:bg-blue-50 transition-colors"
                  :class="selectedForm?.FORMCODE === f.FORMCODE ? 'bg-blue-100' : ''"
                  @click="selectedForm = f" @dblclick="selectedForm = f; openEdit()">
                  <td class="fm-td font-mono font-semibold text-[#1a4f7a]">{{ f.FORMCODE }}</td>
                  <td class="fm-td">{{ f.NAME }}</td>
                  <td class="fm-td">{{ f.GRPNAME || f.GRPCODE || '-' }}</td>
                  <td class="fm-td text-center"><i :class="f.ACTIVE === '1' ? 'bi bi-check-circle-fill text-green-500' : 'bi bi-circle text-gray-300'" /></td>
                  <td class="fm-td text-center"><i :class="f.OCRYN === 'Y' ? 'bi bi-check-circle-fill text-green-500' : 'bi bi-circle text-gray-300'" /></td>
                  <td class="fm-td text-center"><i :class="f.MEDIYN === 'Y' ? 'bi bi-check-circle-fill text-green-500' : 'bi bi-circle text-gray-300'" /></td>
                  <td class="fm-td text-center"><i :class="f.OCRPRINT === 'Y' ? 'bi bi-check-circle-fill text-green-500' : 'bi bi-circle text-gray-300'" /></td>
                  <td class="fm-td text-center">{{ f.PAGECOUNT || '-' }}</td>
                  <td class="fm-td text-center"><i :class="f.FOLLOWYN === 'Y' ? 'bi bi-check-circle-fill text-green-500' : 'bi bi-circle text-gray-300'" /></td>
                  <td class="fm-td text-center"><i :class="f.PRINTYN === 'Y' ? 'bi bi-check-circle-fill text-green-500' : 'bi bi-circle text-gray-300'" /></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Status bar -->
          <div class="px-4 py-2 border-t border-gray-100 text-sm text-gray-400 flex-shrink-0">
            {{ forms.length }} รายการ
            <span v-if="selectedForm" class="ml-3 text-[#1a4f7a]">เลือก: {{ selectedForm.FORMCODE }}</span>
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
            <i class="bi bi-file-earmark-text text-[#1a4f7a]" />
            <span class="font-semibold text-sm">{{ formMode === 'add' ? 'เพิ่มฟอร์ม' : 'แก้ไขฟอร์ม' }}</span>
          </div>
          <div class="px-5 py-4 grid grid-cols-2 gap-3 text-sm">
            <!-- Form Code -->
            <div>
              <label class="form-label">Form Code *</label>
              <input v-model="form.FORMCODE" class="form-input" :disabled="formMode === 'edit'"
                placeholder="FM-XX-001" maxlength="12" />
            </div>
            <!-- Form Name -->
            <div>
              <label class="form-label">Form Name *</label>
              <input v-model="form.NAME" class="form-input" placeholder="ชื่อฟอร์ม" maxlength="200" />
            </div>
            <!-- Group -->
            <div>
              <label class="form-label">Group</label>
              <select v-model="form.GRPCODE" class="form-select">
                <option value="">-- ไม่ระบุ --</option>
                <option v-for="g in grpList" :key="g.GRPCODE" :value="g.GRPCODE">
                  {{ g.NAME }} ({{ g.GRPCODE }})
                </option>
              </select>
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
            <button class="btn-primary text-sm gap-1" :disabled="saving" @click="doSave">
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
import { ref, watch } from 'vue'
import api from '@/services/api'
import { useDialog } from '@/composables/useDialog'

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

const emptyForm = () => ({
  FORMCODE: '', NAME: '', GRPCODE: '', ACTIVE: '1',
  OCRYN: 'N', MEDIYN: 'N', OCRPRINT: 'N', PAGECOUNT: 1,
  FOLLOWYN: 'N', PRINTYN: 'N'
})
const form = ref(emptyForm())

watch(() => props.modelValue, async (v) => {
  if (v) {
    await loadForms()
    await loadGrpList()
    selectedForm.value = null
  }
})

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
  showForm.value = true
}

function openEdit() {
  if (!selectedForm.value) return
  form.value = { ...selectedForm.value }
  formMode.value = 'edit'
  showForm.value = true
}

async function doSave() {
  if (!form.value.FORMCODE?.trim()) { await dlgAlert('กรุณากรอก Form Code', { type: 'warning' }); return }
  if (!form.value.NAME?.trim())     { await dlgAlert('กรุณากรอก Form Name', { type: 'warning' }); return }
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
    await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
  } finally { saving.value = false }
}

async function doDelete() {
  if (!selectedForm.value) return
  const ok = await dlgConfirm(`ต้องการลบฟอร์ม "${selectedForm.value.FORMCODE}" หรือไม่?`)
  if (!ok) return
  try {
    await api.delete(`/forms/${encodeURIComponent(selectedForm.value.FORMCODE)}`)
    await dlgAlert('ลบสำเร็จ', { type: 'success' })
    selectedForm.value = null
    await loadForms()
  } catch (e: any) {
    await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
  }
}
</script>

<style scoped>
.fm-th {
  background: #1a4f7a; color: white;
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
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>