<template>
  <div class="flex flex-col gap-4 h-[calc(100vh-120px)]">

    <!-- Filter panel -->
    <div class="card flex-shrink-0">
      <div class="card-header"><i class="bi bi-arrow-return-left" /> OCR Return</div>
      <div class="p-4">
        <div class="grid gap-3" style="grid-template-columns:repeat(6,1fr);">
          <div>
            <label class="form-label">วันที่เริ่ม</label>
            <input v-model="startDate" type="date" class="form-input" />
          </div>
          <div>
            <label class="form-label">ถึงวันที่</label>
            <input v-model="endDate" type="date" class="form-input" />
          </div>
          <div>
            <label class="form-label">Clinic</label>
            <select v-model="clinCode" class="form-select">
              <option value="ALL">-- ทั้งหมด --</option>
              <option v-for="c in clinics" :key="c.CLINCODE" :value="c.CLINCODE">
                {{ c.CLINCODE }} - {{ c.NAME }}
              </option>
            </select>
          </div>
          <div>
            <label class="form-label">Return Status</label>
            <select v-model="scanYn" class="form-select">
              <option value="ALL">-- ทั้งหมด --</option>
              <option value="Y">Return</option>
              <option value="N">No Return</option>
            </select>
          </div>
          <div>
            <label class="form-label">Group Form</label>
            <select v-model="grpCode" class="form-select">
              <option value="ALL">-- ทั้งหมด --</option>
              <option v-for="g in formGroups" :key="g.GRPCODE" :value="g.GRPCODE">
                {{ g.NAME }}
              </option>
            </select>
          </div>
          <div>
            <label class="form-label">OCR Code</label>
            <input v-model="ocrPk" type="text" class="form-input" placeholder="OCRPK" @keydown.enter="search" />
          </div>

          <!-- HN: single grid cell, same width as date picker -->
          <div>
            <label class="form-label">HN</label>
            <div class="hn-cell">
              <HnInputer ref="hnInputer" :is-sep="patientStore.hnConfig.hnSep === 'Y'" @search="onHnFilterSearch" />
            </div>
          </div>

          <div style="grid-column: span 3;">
            <label class="form-label">Memo</label>
            <input v-model="bigo" type="text" class="form-input" placeholder="หมายเหตุ" />
          </div>
          <div class="flex items-end">
            <button class="btn-outline w-full justify-center gap-1" :disabled="!ocrPk && !selectedRow" @click="saveMemo">
              <span v-if="saving" class="loading-spinner" />
              <i v-else class="bi bi-save" /> Save Memo
            </button>
          </div>
          <div class="flex items-end gap-2" style="grid-column: span 2;">
            <button class="btn-primary flex-1 justify-center gap-1" @click="search">
              <span v-if="loading" class="loading-spinner" />
              <i v-else class="bi bi-search" /> Search
            </button>
            <button class="btn-outline flex-1 justify-center gap-1" @click="clearFilters">
              <i class="bi bi-x-circle" /> Clear
            </button>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-3">
          <button class="btn-outline gap-1" :disabled="rows.length === 0" @click="printList">
            <i class="bi bi-printer" /> Print
          </button>
          <button class="btn-outline gap-1" :disabled="rows.length === 0" @click="exportExcel">
            <i class="bi bi-file-earmark-excel" /> Excel
          </button>
        </div>
      </div>
    </div>

    <!-- List -->
    <div class="card flex-1 flex flex-col min-h-0">
      <div class="card-header">
        <i class="bi bi-list-ul" /> รายการ
        <span class="ml-auto text-xs text-gray-400 font-normal">{{ rows.length }} รายการ</span>
      </div>
      <div class="flex-1 overflow-auto min-h-0">
        <table class="w-full text-[12px] border-collapse">
          <thead class="sticky top-0 z-10">
            <tr>
              <th class="treat-th">HN</th>
              <th class="treat-th">ชื่อ</th>
              <th class="treat-th">VN</th>
              <th class="treat-th">Dept</th>
              <th class="treat-th">วันที่</th>
              <th class="treat-th">เวลา</th>
              <th class="treat-th text-center">Return</th>
              <th class="treat-th">OCRPK</th>
              <th class="treat-th">ฟอร์ม</th>
              <th class="treat-th text-center">หน้า</th>
              <th class="treat-th text-center">ประเภท</th>
              <th class="treat-th">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="12" class="text-center py-6"><span class="loading-spinner" /></td>
            </tr>
            <tr v-else-if="rows.length === 0">
              <td colspan="12" class="text-center py-6 text-gray-400">ไม่พบข้อมูล — กดค้นหาเพื่อแสดงรายการ</td>
            </tr>
            <tr v-for="(r, i) in rows" :key="i"
              class="cursor-pointer hover:bg-blue-50 transition-colors"
              :class="selectedRow === r ? 'bg-blue-100' : ''"
              @click="selectRow(r)">
              <td class="treat-td font-mono">{{ r.PATID }}</td>
              <td class="treat-td">{{ r.NAME }}</td>
              <td class="treat-td font-mono">{{ r.VN }}</td>
              <td class="treat-td">{{ r.DEPTCODE }}</td>
              <td class="treat-td whitespace-nowrap">{{ formatDate(r.INDATE) }}</td>
              <td class="treat-td whitespace-nowrap">{{ formatTime(r.INTIME) }}</td>
              <td class="treat-td text-center">
                <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  :class="r.SCANYN === 'Y' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                  {{ r.SCANYN === 'Y' ? 'Return' : 'No Return' }}
                </span>
              </td>
              <td class="treat-td font-mono">{{ r.OCRPK }}</td>
              <td class="treat-td">{{ r.FORMNAME }}</td>
              <td class="treat-td text-center font-mono">{{ r.PAGECOUNT }}</td>
              <td class="treat-td text-center">{{ r.CLASS }}</td>
              <td class="treat-td truncate max-w-[160px]" :title="r.BIGO">{{ r.BIGO }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDialog } from '@/composables/useDialog'
const { alert: dlgAlert } = useDialog()
import { ocrReturnApi, formApi } from '@/services/api'
import type { OcrReturnRow, Clinic, FormGroup } from '@/types'
import { usePatientStore } from '@/stores/patient'
import HnInputer from '@/components/common/HnInputer.vue'

const patientStore = usePatientStore()
const hnInputer = ref<InstanceType<typeof HnInputer>>()

function todayStr() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function toYmd(dateStr: string) {
  return dateStr.replace(/-/g, '')
}

const startDate = ref(todayStr())
const endDate   = ref(todayStr())
const clinCode  = ref('ALL')
const scanYn    = ref('ALL')
const grpCode   = ref('ALL')
const ocrPk     = ref('')
const bigo      = ref('')

const clinics    = ref<Clinic[]>([])
const formGroups = ref<FormGroup[]>([])
const rows       = ref<OcrReturnRow[]>([])
const selectedRow = ref<OcrReturnRow | null>(null)
const loading = ref(false)
const saving  = ref(false)

onMounted(async () => {
  try {
    // โหลด HNSEP config เสมอ (default store = 'N' จึงต้องดึงค่าจริงจาก API ทุกครั้ง)
    const [c, g] = await Promise.all([
      ocrReturnApi.getClinics(),
      formApi.getGroups(),
      patientStore.loadHnConfig(),
    ])
    clinics.value = c
    formGroups.value = g
  } catch (e) {
    console.error('Failed to load filters', e)
  }
})

function formatDate(d: string) {
  if (!d || d.length < 8) return ''
  return `${d.substring(6,8)}-${d.substring(4,6)}-${d.substring(0,4)}`
}

function formatTime(t: string) {
  if (!t || t.length < 6) return t || ''
  return `${t.substring(0,2)}:${t.substring(2,4)}:${t.substring(4,6)}`
}

async function search() {
  if (!startDate.value || !endDate.value) {
    await dlgAlert('กรุณาเลือกช่วงวันที่', { type: 'warning' }); return
  }
  loading.value = true
  selectedRow.value = null
  try {
    rows.value = await ocrReturnApi.search({
      startDate: toYmd(startDate.value),
      endDate: toYmd(endDate.value),
      clinCode: clinCode.value,
      scanYn: scanYn.value,
      grpCode: grpCode.value,
      hn: (hnInputer.value?.hnValue || '').trim(),
      ocrPk: ocrPk.value.trim(),
    })
  } catch (e: any) {
    await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
    rows.value = []
  } finally {
    loading.value = false
  }
}

// กด Enter ใน HN Inputer -> ค้นหาทันที
function onHnFilterSearch(_hn: string) {
  search()
}

function clearFilters() {
  startDate.value = todayStr()
  endDate.value = todayStr()
  clinCode.value = 'ALL'
  scanYn.value = 'ALL'
  grpCode.value = 'ALL'
  hnInputer.value?.resetSilent()
  ocrPk.value = ''
  bigo.value = ''
  rows.value = []
  selectedRow.value = null
}

function selectRow(r: OcrReturnRow) {
  selectedRow.value = r
  hnInputer.value?.setValue(r.PATID.trim())
  ocrPk.value = r.OCRPK.trim()
  bigo.value = r.BIGO || ''
}

async function saveMemo() {
  if (!ocrPk.value.trim()) { await dlgAlert('กรุณาเลือกรายการหรือระบุ OCR Code ก่อน', { type: 'warning' }); return }
  saving.value = true
  try {
    await ocrReturnApi.saveMemo(ocrPk.value.trim(), bigo.value)
    // update local row
    const row = rows.value.find(r => r.OCRPK.trim() === ocrPk.value.trim())
    if (row) row.BIGO = bigo.value
    await dlgAlert('บันทึก Memo สำเร็จ', { type: 'success' })
  } catch (e: any) {
    await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
  } finally {
    saving.value = false
  }
}

function printList() {
  const win = window.open('', '_blank')
  if (!win) return
  const headers = ['HN','ชื่อ','VN','Dept','วันที่','เวลา','Return','OCRPK','ฟอร์ม','หน้า','ประเภท','หมายเหตุ']
  const tableRows = rows.value.map(r => `
    <tr>
      <td>${r.PATID}</td><td>${r.NAME}</td><td>${r.VN}</td><td>${r.DEPTCODE}</td>
      <td>${formatDate(r.INDATE)}</td><td>${formatTime(r.INTIME)}</td>
      <td>${r.SCANYN === 'Y' ? 'Return' : 'No Return'}</td>
      <td>${r.OCRPK}</td><td>${r.FORMNAME}</td><td>${r.PAGECOUNT}</td>
      <td>${r.CLASS}</td><td>${r.BIGO || ''}</td>
    </tr>`).join('')
  win.document.write(`
    <html><head><title>OCR Return List</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:11px;}
      table{width:100%;border-collapse:collapse;}
      th,td{border:1px solid #ccc;padding:4px 6px;text-align:left;}
      th{background:#1a4f7a;color:#fff;}
    </style></head><body>
    <h3>OCR Return List (${startDate.value} - ${endDate.value})</h3>
    <table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${tableRows}</tbody></table>
    </body></html>`)
  win.document.close()
  win.focus()
  win.print()
}

function exportExcel() {
  const headers = ['HN','ชื่อ','VN','Dept','วันที่','เวลา','Return','OCRPK','ฟอร์ม','หน้า','ประเภท','หมายเหตุ']
  const tableRows = rows.value.map(r => `
    <tr>
      <td>${r.PATID}</td><td>${r.NAME}</td><td>${r.VN}</td><td>${r.DEPTCODE}</td>
      <td>${formatDate(r.INDATE)}</td><td>${formatTime(r.INTIME)}</td>
      <td>${r.SCANYN === 'Y' ? 'Return' : 'No Return'}</td>
      <td>${r.OCRPK}</td><td>${r.FORMNAME}</td><td>${r.PAGECOUNT}</td>
      <td>${r.CLASS}</td><td>${r.BIGO || ''}</td>
    </tr>`).join('')
  const html = `
    <html><head><meta charset="utf-8"></head><body>
    <table border="1">
    <thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${tableRows}</tbody>
    </table></body></html>`
  const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ocrreturn_${toYmd(startDate.value)}_${toYmd(endDate.value)}.xls`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.treat-th {
  background: #1a4f7a;
  color: white;
  padding: 0.35rem 0.5rem;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 500;
  white-space: nowrap;
}
.treat-td {
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.75rem;
}
/* จำกัดความกว้าง HnInputer ให้พอดีกับ cell (เท่า date picker) */
.hn-cell {
  width: 100%;
}
.hn-cell :deep(input) {
  width: 100%;
}
</style>