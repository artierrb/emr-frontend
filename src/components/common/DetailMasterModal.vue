<template>
  <BaseModal
    :model-value="modelValue"
    title="Detail Master"
    icon="bi-table"
    width="920px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <!-- TabTyp dropdown -->
    <div class="mb-3">
      <select v-model="selectedTyp" class="form-select max-w-xs" @change="onTypChange">
        <option value="">-- เลือกประเภท --</option>
        <option v-for="t in tabTypList" :key="t.DtlCod" :value="t.DtlCod?.trim()">
          {{ t.DtlCodNam || t.DtlCod }}
        </option>
      </select>
    </div>

    <!-- 3-panel layout -->
    <div class="grid grid-cols-[220px_1fr] border border-gray-200 rounded-lg overflow-hidden h-[480px]">

      <!-- Left: TabMst -->
      <div class="border-r border-gray-200 flex flex-col">
        <div class="flex items-center gap-1 px-2 py-2 bg-gray-50 border-b border-gray-200 shrink-0">
          <span class="text-xs font-semibold text-blue-800 flex-1">Table</span>
          <button class="icon-btn" title="เพิ่ม" @click="openTabForm('add')"><i class="bi bi-plus-lg" /></button>
          <button class="icon-btn" title="แก้ไข" @click="openTabForm('edit')"><i class="bi bi-pencil" /></button>
          <button class="icon-btn danger" title="ลบ" @click="deleteTab"><i class="bi bi-trash" /></button>
        </div>
        <div class="flex-1 overflow-y-auto">
          <div v-if="loadingTab" class="flex justify-center py-4"><span class="loading-spinner" /></div>
          <table v-else class="master-table">
            <thead><tr><th>Code</th><th>Name</th></tr></thead>
            <tbody>
              <tr v-if="tabList.length === 0">
                <td colspan="2" class="text-center py-3 text-gray-400 text-xs">เลือกประเภทด้านบน</td>
              </tr>
              <tr
                v-for="t in tabList" :key="t.TabCod"
                class="clickable" :class="{ selected: selectedTab?.TabCod === t.TabCod }"
                @click="selectTab(t)"
              >
                <td class="font-mono text-xs">{{ t.TabCod?.trim() }}</td>
                <td class="text-xs">{{ t.TabCodNam }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right: DtlMst + DtsMst -->
      <div class="flex flex-col">

        <!-- DtlMst -->
        <div class="flex-1 flex flex-col border-b border-gray-200 overflow-hidden">
          <div class="flex items-center gap-1 px-2 py-2 bg-gray-50 border-b border-gray-200 shrink-0">
            <span class="text-xs font-semibold text-blue-800 flex-1">Detail</span>
            <button class="icon-btn" @click="openDtlForm('add')"><i class="bi bi-plus-lg" /></button>
            <button class="icon-btn" @click="openDtlForm('edit')"><i class="bi bi-pencil" /></button>
            <button class="icon-btn danger" @click="deleteDtl"><i class="bi bi-trash" /></button>
            <span class="text-xs text-gray-400 ml-2">ลากเพื่อเรียงลำดับ</span>
          </div>
          <div class="flex-1 overflow-y-auto">
            <div v-if="loadingDtl" class="flex justify-center py-4"><span class="loading-spinner" /></div>
            <table v-else class="master-table">
              <thead><tr><th class="w-6"></th><th>Code</th><th>Code Name</th><th>Code Value</th></tr></thead>
              <tbody>
                <tr v-if="dtlList.length === 0">
                  <td colspan="4" class="text-center py-3 text-gray-400 text-xs">เลือก Table ด้านซ้าย</td>
                </tr>
                <tr
                  v-for="d in dtlList" :key="d.DtlCod"
                  class="clickable" :class="{ selected: selectedDtl?.DtlCod === d.DtlCod }"
                  draggable="true"
                  @click="selectDtl(d)"
                  @dragstart="onDtlDragStart($event, d)"
                  @dragover.prevent="onDtlDragOver($event, d)"
                  @drop="onDtlDrop"
                >
                  <td class="text-gray-300 cursor-grab text-center select-none">⠿</td>
                  <td class="font-mono text-xs">{{ d.DtlCod?.trim() }}</td>
                  <td class="text-xs">{{ d.DtlCodNam }}</td>
                  <td class="text-xs text-gray-400">{{ (d.DtlCodVal || '').substring(0, 30) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- DtsMst -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <div class="flex items-center gap-1 px-2 py-2 bg-gray-50 border-b border-gray-200 shrink-0">
            <span class="text-xs font-semibold text-blue-800 flex-1">Sub Detail</span>
            <button class="icon-btn" @click="openDtsForm('add')"><i class="bi bi-plus-lg" /></button>
            <button class="icon-btn" @click="openDtsForm('edit')"><i class="bi bi-pencil" /></button>
            <button class="icon-btn danger" @click="deleteDts"><i class="bi bi-trash" /></button>
            <span class="text-xs text-gray-400 ml-2">ลากเพื่อเรียงลำดับ</span>
          </div>
          <div class="flex-1 overflow-y-auto">
            <div v-if="loadingDts" class="flex justify-center py-4"><span class="loading-spinner" /></div>
            <table v-else class="master-table">
              <thead><tr><th class="w-6"></th><th>Sub Code</th><th>Code Name</th><th>Code Value</th></tr></thead>
              <tbody>
                <tr v-if="dtsList.length === 0">
                  <td colspan="4" class="text-center py-3 text-gray-400 text-xs">เลือก Detail ด้านบน</td>
                </tr>
                <tr
                  v-for="s in dtsList" :key="s.DtsSubCod"
                  class="clickable" :class="{ selected: selectedDts?.DtsSubCod === s.DtsSubCod }"
                  draggable="true"
                  @click="selectedDts = s"
                  @dragstart="onDtsDragStart($event, s)"
                  @dragover.prevent="onDtsDragOver($event, s)"
                  @drop="onDtsDrop"
                >
                  <td class="text-gray-300 cursor-grab text-center select-none">⠿</td>
                  <td class="font-mono text-xs">{{ s.DtsSubCod?.trim() }}</td>
                  <td class="text-xs">{{ s.DtsCodNam }}</td>
                  <td class="text-xs text-gray-400">{{ (s.DtsCodVal || '').substring(0, 30) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>

    <template #footer>
      <button class="btn-outline" @click="emit('update:modelValue', false)">ปิด</button>
    </template>
  </BaseModal>

  <!-- CRUD Form Modal -->
  <BaseModal
    :model-value="crudOpen"
    :title="crudTitle"
    width="460px"
    :z-index="6500"
    @update:model-value="crudOpen = false"
  >
    <div class="space-y-3">
      <template v-for="field in crudFields" :key="field.id">
        <div>
          <label class="form-label">{{ field.label }}<span v-if="field.required" class="text-red-500">*</span></label>
          <input
            :id="field.id"
            v-model="crudValues[field.id]"
            type="text"
            class="form-input"
            :readonly="field.readonly"
            :class="field.readonly ? 'bg-gray-50' : ''"
            :maxlength="field.maxlength"
          />
        </div>
      </template>
    </div>
    <template #footer>
      <button class="btn-outline" @click="crudOpen = false">ยกเลิก</button>
      <button class="btn-primary gap-1" :disabled="saving" @click="crudSave">
        <i class="bi bi-check-lg" /> บันทึก
      </button>
    </template>
  </BaseModal>

  <!-- Confirm delete -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="confirmMsg" class="fixed inset-0 z-[8000] flex items-center justify-center">
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="confirmMsg = ''" />
        <div class="relative bg-white rounded-xl shadow-2xl w-[360px] overflow-hidden">
          <div class="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
            <i class="bi bi-exclamation-triangle-fill text-amber-500" />
            <span class="font-semibold text-sm">ยืนยันการลบ</span>
          </div>
          <div class="px-5 py-4 text-sm text-gray-600">{{ confirmMsg }}</div>
          <div class="px-5 py-3 border-t border-gray-100 flex gap-2 justify-end">
            <button class="btn-outline" @click="confirmMsg = ''">ยกเลิก</button>
            <button class="btn-danger gap-1" @click="doConfirm">
              <i class="bi bi-trash" /> ลบ
            </button>
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

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

// ── State ─────────────────────────────────────────────────────
const selectedTyp = ref('')
const tabTypList = ref<any[]>([])
const tabList = ref<any[]>([])
const dtlList = ref<any[]>([])
const dtsList = ref<any[]>([])
const selectedTab = ref<any>(null)
const selectedDtl = ref<any>(null)
const selectedDts = ref<any>(null)
const loadingTab = ref(false)
const loadingDtl = ref(false)
const loadingDts = ref(false)

// CRUD form
const crudOpen = ref(false)
const crudTitle = ref('')
const saving = ref(false)
interface CrudField { id: string; label: string; required?: boolean; readonly?: boolean; maxlength?: number }
const crudFields = ref<CrudField[]>([])
const crudValues = reactive<Record<string, string>>({})
const crudSaveFn = ref<() => Promise<void>>(() => Promise.resolve())

// Confirm
const confirmMsg = ref('')
const confirmFn = ref<() => Promise<void>>(() => Promise.resolve())

// Drag
const dragDtlSrc = ref<any>(null)
const dragDtlOver = ref<any>(null)
const dragDtsSrc = ref<any>(null)
const dragDtsOver = ref<any>(null)

watch(() => props.modelValue, v => { if (v) loadTabTyp() })

// ── Load ──────────────────────────────────────────────────────
async function loadTabTyp() {
  const res = await api.get('/master/tabtyp')
  tabTypList.value = res.data
}

async function onTypChange() {
  selectedTab.value = null; selectedDtl.value = null; selectedDts.value = null
  dtlList.value = []; dtsList.value = []
  if (!selectedTyp.value) { tabList.value = []; return }
  loadingTab.value = true
  try {
    const res = await api.get('/master/tabmst', { params: { tabCodTyp: selectedTyp.value } })
    tabList.value = res.data
  } finally { loadingTab.value = false }
}

async function selectTab(t: any) {
  selectedTab.value = t; selectedDtl.value = null; selectedDts.value = null; dtsList.value = []
  loadingDtl.value = true
  try {
    const res = await api.get('/master/dtlmst', { params: { dtlTblCod: t.TabCod?.trim() } })
    dtlList.value = res.data
  } finally { loadingDtl.value = false }
}

async function selectDtl(d: any) {
  selectedDtl.value = d; selectedDts.value = null
  loadingDts.value = true
  try {
    const res = await api.get('/master/dtsmst', {
      params: { dtsTblCod: selectedTab.value.TabCod?.trim(), dtsCod: d.DtlCod?.trim() }
    })
    dtsList.value = res.data
  } finally { loadingDts.value = false }
}

// ── CRUD helper ───────────────────────────────────────────────
function openCrud(title: string, fields: CrudField[], defaults: Record<string, string>, saveFn: () => Promise<void>) {
  crudTitle.value = title
  crudFields.value = fields
  Object.keys(crudValues).forEach(k => delete crudValues[k])
  Object.assign(crudValues, defaults)
  crudSaveFn.value = saveFn
  crudOpen.value = true
}

async function crudSave() {
  saving.value = true
  try { await crudSaveFn.value() }
  finally { saving.value = false }
}

function showConfirm(msg: string, fn: () => Promise<void>) {
  confirmMsg.value = msg
  confirmFn.value = fn
}

async function doConfirm() {
  await confirmFn.value()
  confirmMsg.value = ''
}

// ── TabMst CRUD ───────────────────────────────────────────────
async function openTabForm(mode: 'add' | 'edit') {
  if (mode === 'edit' && !selectedTab.value) { await dlgAlert('กรุณาเลือกรายการก่อน', { type: 'warning' }); return }
  openCrud(
    mode === 'add' ? 'เพิ่ม Table' : 'แก้ไข Table',
    [
      { id: 'tabCod', label: 'Table Code ', required: true, readonly: mode === 'edit', maxlength: 8 },
      { id: 'tabCodNam', label: 'Table Code Name', maxlength: 150 },
    ],
    {
      tabCod: mode === 'edit' ? selectedTab.value.TabCod?.trim() : '',
      tabCodNam: mode === 'edit' ? selectedTab.value.TabCodNam : '',
    },
    async () => {
      if (!crudValues.tabCod) { await dlgAlert('กรุณากรอก Table Code', { type: 'warning' }); return }
      const url = mode === 'add' ? '/master/tabmst/insert' : '/master/tabmst/update'
      await api.post(url, { tabCod: crudValues.tabCod.toUpperCase(), tabCodNam: crudValues.tabCodNam, tabCodTyp: selectedTyp.value })
      crudOpen.value = false; await onTypChange()
    }
  )
}

async function deleteTab() {
  if (!selectedTab.value) { await dlgAlert('กรุณาเลือกรายการก่อน', { type: 'warning' }); return }
  showConfirm(`ลบ Table Code: ${selectedTab.value.TabCod?.trim()} ?`, async () => {
    await api.delete(`/master/tabmst/${encodeURIComponent(selectedTab.value.TabCod?.trim())}`)
    selectedTab.value = null; await onTypChange()
  })
}

// ── DtlMst CRUD ───────────────────────────────────────────────
async function openDtlForm(mode: 'add' | 'edit') {
  if (!selectedTab.value) { await dlgAlert('กรุณาเลือก Table ด้านซ้ายก่อน', { type: 'warning' }); return }
  if (mode === 'edit' && !selectedDtl.value) { await dlgAlert('กรุณาเลือกรายการก่อน', { type: 'warning' }); return }
  openCrud(
    mode === 'add' ? 'เพิ่ม Detail' : 'แก้ไข Detail',
    [
      { id: 'dtlCod', label: 'DtlCod', required: true, readonly: mode === 'edit', maxlength: 10 },
      { id: 'dtlCodNam', label: 'DtlCodNam', maxlength: 500 },
      { id: 'dtlCodVal', label: 'DtlCodVal' },
    ],
    {
      dtlCod: mode === 'edit' ? selectedDtl.value.DtlCod?.trim() : '',
      dtlCodNam: mode === 'edit' ? selectedDtl.value.DtlCodNam : '',
      dtlCodVal: mode === 'edit' ? selectedDtl.value.DtlCodVal : '',
    },
    async () => {
      if (!crudValues.dtlCod) { await dlgAlert('กรุณากรอก DtlCod', { type: 'warning' }); return }
      const tblCod = selectedTab.value.TabCod?.trim()
      if (mode === 'add') {
        const seqRes = await api.get('/master/dtlmst/nextseq', { params: { dtlTblCod: tblCod } })
        await api.post('/master/dtlmst/insert', {
          dtlTblCod: tblCod, dtlCod: crudValues.dtlCod.toUpperCase(),
          dtlCodNam: crudValues.dtlCodNam, dtlCodVal: crudValues.dtlCodVal,
          dtlDspSeq: String(seqRes.data.seq), userId: 'DEMO'
        })
      } else {
        await api.post('/master/dtlmst/update', {
          dtlTblCod: tblCod, dtlCod: crudValues.dtlCod,
          dtlCodNam: crudValues.dtlCodNam, dtlCodVal: crudValues.dtlCodVal, userId: 'DEMO'
        })
      }
      crudOpen.value = false; await selectTab(selectedTab.value)
    }
  )
}

async function deleteDtl() {
  if (!selectedDtl.value) { await dlgAlert('กรุณาเลือกรายการก่อน', { type: 'warning' }); return }
  showConfirm(`ลบ DtlCod: ${selectedDtl.value.DtlCod?.trim()} ?`, async () => {
    await api.delete('/master/dtlmst', { params: { dtlTblCod: selectedTab.value.TabCod?.trim(), dtlCod: selectedDtl.value.DtlCod?.trim() } })
    selectedDtl.value = null; dtsList.value = []; await selectTab(selectedTab.value)
  })
}

// ── DtsMst CRUD ───────────────────────────────────────────────
async function openDtsForm(mode: 'add' | 'edit') {
  if (!selectedDtl.value) { await dlgAlert('กรุณาเลือก Detail ด้านบนก่อน', { type: 'warning' }); return }
  if (mode === 'edit' && !selectedDts.value) { await dlgAlert('กรุณาเลือกรายการก่อน', { type: 'warning' }); return }
  openCrud(
    mode === 'add' ? 'เพิ่ม Sub Detail' : 'แก้ไข Sub Detail',
    [
      { id: 'dtsSubCod', label: 'SubCod', required: true, readonly: mode === 'edit', maxlength: 10 },
      { id: 'dtsCodNam', label: 'DtsCodNam', maxlength: 300 },
      { id: 'dtsCodVal', label: 'DtsCodVal' },
    ],
    {
      dtsSubCod: mode === 'edit' ? selectedDts.value.DtsSubCod?.trim() : '',
      dtsCodNam: mode === 'edit' ? selectedDts.value.DtsCodNam : '',
      dtsCodVal: mode === 'edit' ? selectedDts.value.DtsCodVal : '',
    },
    async () => {
      if (!crudValues.dtsSubCod) { await dlgAlert('กรุณากรอก SubCod', { type: 'warning' }); return }
      const tblCod = selectedTab.value.TabCod?.trim()
      const dtlCod = selectedDtl.value.DtlCod?.trim()
      if (mode === 'add') {
        const seqRes = await api.get('/master/dtsmst/nextseq', { params: { dtsTblCod: tblCod, dtsCod: dtlCod } })
        await api.post('/master/dtsmst/insert', {
          dtsTblCod: tblCod, dtsCod: dtlCod, dtsSubCod: crudValues.dtsSubCod.toUpperCase(),
          dtsCodNam: crudValues.dtsCodNam, dtsCodVal: crudValues.dtsCodVal,
          dtsDspSeq: String(seqRes.data.seq), userId: 'DEMO'
        })
      } else {
        await api.post('/master/dtsmst/update', {
          dtsTblCod: tblCod, dtsCod: dtlCod, dtsSubCod: crudValues.dtsSubCod,
          dtsCodNam: crudValues.dtsCodNam, dtsCodVal: crudValues.dtsCodVal, userId: 'DEMO'
        })
      }
      crudOpen.value = false; await selectDtl(selectedDtl.value)
    }
  )
}

async function deleteDts() {
  if (!selectedDts.value) { await dlgAlert('กรุณาเลือกรายการก่อน', { type: 'warning' }); return }
  showConfirm(`ลบ SubCod: ${selectedDts.value.DtsSubCod?.trim()} ?`, async () => {
    await api.delete('/master/dtsmst', {
      params: { dtsTblCod: selectedTab.value.TabCod?.trim(), dtsCod: selectedDtl.value.DtlCod?.trim(), dtsSubCod: selectedDts.value.DtsSubCod?.trim() }
    })
    selectedDts.value = null; await selectDtl(selectedDtl.value)
  })
}

// ── Drag DtlMst ───────────────────────────────────────────────
function onDtlDragStart(e: DragEvent, d: any) { dragDtlSrc.value = d; e.dataTransfer!.effectAllowed = 'move' }
function onDtlDragOver(_e: DragEvent, d: any) { dragDtlOver.value = d }
async function onDtlDrop() {
  if (!dragDtlSrc.value || !dragDtlOver.value || dragDtlSrc.value === dragDtlOver.value) return
  const from = dtlList.value.indexOf(dragDtlSrc.value)
  const to = dtlList.value.indexOf(dragDtlOver.value)
  dtlList.value.splice(from, 1); dtlList.value.splice(to, 0, dragDtlSrc.value)
  await api.post('/master/dtlmst/reorder',
    dtlList.value.map(d => ({ dtlCod: d.DtlCod?.trim() })),
    { params: { dtlTblCod: selectedTab.value.TabCod?.trim() } })
  dragDtlSrc.value = null; dragDtlOver.value = null
}

// ── Drag DtsMst ───────────────────────────────────────────────
function onDtsDragStart(e: DragEvent, s: any) { dragDtsSrc.value = s; e.dataTransfer!.effectAllowed = 'move' }
function onDtsDragOver(_e: DragEvent, s: any) { dragDtsOver.value = s }
async function onDtsDrop() {
  if (!dragDtsSrc.value || !dragDtsOver.value || dragDtsSrc.value === dragDtsOver.value) return
  const from = dtsList.value.indexOf(dragDtsSrc.value)
  const to = dtsList.value.indexOf(dragDtsOver.value)
  dtsList.value.splice(from, 1); dtsList.value.splice(to, 0, dragDtsSrc.value)
  await api.post('/master/dtsmst/reorder',
    dtsList.value.map(s => ({ dtsSubCod: s.DtsSubCod?.trim() })),
    { params: { dtsTblCod: selectedTab.value.TabCod?.trim(), dtsCod: selectedDtl.value.DtlCod?.trim() } })
  dragDtsSrc.value = null; dragDtsOver.value = null
}
</script>

<style scoped>
.master-table { width: 100%; font-size: 0.875rem; border-collapse: collapse; }
.master-table th { background: #1a4f7a; color: white; padding: 0.5rem; text-align: left; font-size: 0.75rem; font-weight: 500; position: sticky; top: 0; z-index: 10; }
.master-table td { padding: 0.375rem 0.5rem; border-bottom: 1px solid #f3f4f6; }
.master-table tr.clickable:hover td { background: #eff6ff; cursor: pointer; }
.master-table tr.selected td { background: #dbeafe; }
.icon-btn { width: 1.5rem; height: 1.5rem; display: flex; align-items: center; justify-content: center; border-radius: 0.25rem; border: 1px solid #e5e7eb; background: white; color: #4b5563; font-size: 0.75rem; cursor: pointer; transition: all 0.15s; }
.icon-btn:hover { border-color: #60a5fa; color: #1d4ed8; }
.icon-btn.danger:hover { border-color: #f87171; color: #dc2626; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
