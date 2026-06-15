<template>
  <div class="flex flex-col h-[calc(100vh-115px)] gap-3">

    <!-- ── Filter zone ── -->
    <div class="card flex-shrink-0">
      <div class="card-header py-2">
        <i class="bi bi-funnel" /> ค้นหา — ทะเบียนขอยืมแฟ้ม
        <!-- Auto refresh -->
        <label class="ml-auto flex items-center gap-1.5 text-xs font-normal text-gray-500 cursor-pointer">
          <input type="checkbox" v-model="autoRefresh" class="accent-[#1a4f7a]" />
          Auto refresh (10 วิ)
        </label>
      </div>
      <div class="p-3 flex flex-wrap items-end gap-3">
        <!-- Rent No -->
        <div>
          <label class="form-label">Rent No.</label>
          <input v-model="fRentNo" type="text" class="form-input text-xs py-1.5 w-24 font-mono"
            @keydown.enter="onSearch()" />
        </div>

        <!-- HN inputer -->
        <div>
          <label class="form-label">HN</label>
          <div class="flex items-center gap-1">
            <input v-model="fHnMain" type="text" :maxlength="8"
              :placeholder="hnSep ? 'ปี+HN' : 'HN 8 หลัก'"
              class="form-input text-xs py-1.5 w-32 font-mono"
              @keydown.enter="onSearch()" />
            <template v-if="hnSep">
              <span class="text-gray-400 text-xs">-</span>
              <input v-model="fHnYear" type="text" maxlength="2" readonly tabindex="-1"
                class="form-input text-xs py-1.5 w-10 font-mono bg-gray-50" />
            </template>
          </div>
        </div>

        <!-- Status -->
        <div>
          <label class="form-label">สถานะ</label>
          <select v-model="fStatus" class="form-select text-xs py-1.5 w-52">
            <option value="ALL">ALL</option>
            <option value="WAITING">Waiting for confirmation</option>
            <option value="CONFIRMED">Confirmed</option>
          </select>
        </div>

        <!-- Reason -->
        <div>
          <label class="form-label">เหตุผล</label>
          <select v-model="fRentCode" class="form-select text-xs py-1.5 w-44">
            <option value="">ทั้งหมด</option>
            <option v-for="r in reasons" :key="r.DtlCod" :value="r.DtlCod">{{ r.DtlCodNam }}</option>
          </select>
        </div>

        <!-- Date range (RENTSDT) -->
        <div>
          <label class="form-label">วันที่ยืม (จาก)</label>
          <input v-model="fDateFrom" type="date" class="form-input text-xs py-1.5" />
        </div>
        <div>
          <label class="form-label">ถึง</label>
          <input v-model="fDateTo" type="date" class="form-input text-xs py-1.5" />
        </div>

        <button class="btn-primary gap-1 py-1.5" :disabled="loading" @click="onSearch()">
          <span v-if="loading" class="loading-spinner" />
          <i v-else class="bi bi-search" /> ค้นหา
        </button>
        <button class="btn-outline gap-1 py-1.5" :disabled="loading" @click="onReset">
          <i class="bi bi-arrow-counterclockwise" /> ล้าง
        </button>
      </div>
    </div>

    <!-- ── List zone ── -->
    <div class="card flex flex-col flex-1 min-h-0">
      <div class="card-header py-2">
        <i class="bi bi-box-arrow-up" /> รายการ
        <span class="ml-auto text-xs text-gray-400 font-normal">{{ rows.length }} รายการ</span>
      </div>

      <div class="flex-1 overflow-auto">
        <table class="w-full text-xs border-collapse">
          <thead class="sticky top-0 z-10">
            <tr>
              <th class="rent-th">Reg. No.</th>
              <th class="rent-th">HN</th>
              <th class="rent-th">ชื่อผู้ป่วย</th>
              <th class="rent-th">วันที่เริ่ม</th>
              <th class="rent-th">วันที่สิ้นสุด</th>
              <th class="rent-th">เหตุผล</th>
              <th class="rent-th text-center">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center py-8"><span class="loading-spinner" /></td>
            </tr>
            <tr v-else-if="rows.length === 0">
              <td colspan="7" class="text-center py-8 text-gray-400">
                <i class="bi bi-inbox text-2xl block mb-1" />ไม่พบข้อมูล
              </td>
            </tr>
            <tr v-for="r in rows" :key="r.RENTNO"
              class="cursor-pointer transition-colors border-b border-gray-100"
              :class="rowClass(r)"
              @click="selectRow(r)">
              <td class="rent-td font-mono">{{ r.RENTNO }}</td>
              <td class="rent-td font-mono">{{ formatHn(r.PATID) }}</td>
              <td class="rent-td">{{ r.PATNAME }}</td>
              <td class="rent-td whitespace-nowrap">{{ fmtDate(r.RENTSDT) }}</td>
              <td class="rent-td whitespace-nowrap">{{ fmtDate(r.RENTEDT) }}</td>
              <td class="rent-td">{{ r.RENTNAME }}</td>
              <td class="rent-td text-center">
                <span :class="r.RENTYN === 'Y' ? 'badge-green' : 'badge-amber'">
                  {{ r.RENTYN === 'Y' ? 'Confirmed' : 'Waiting' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ── Footer actions ── -->
      <div class="px-4 py-3 border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
        <span v-if="selected" class="text-xs text-gray-500">
          เลือก: Reg.No {{ selected.RENTNO }} — HN {{ formatHn(selected.PATID) }}
        </span>
        <span v-else class="text-xs text-gray-400">เลือกรายการเพื่อ Confirm</span>
        <div class="flex-1" />
        <button class="btn-outline gap-1 py-1.5" :disabled="rows.length === 0" @click="exportExcel">
          <i class="bi bi-file-earmark-excel" /> Excel
        </button>
        <button class="btn-outline gap-1 py-1.5" :disabled="rows.length === 0" @click="printList">
          <i class="bi bi-printer" /> Print
        </button>
        <button class="btn-primary gap-1 py-1.5" :disabled="!canConfirm || acting" @click="doConfirm">
          <span v-if="acting" class="loading-spinner" />
          <i v-else class="bi bi-check-circle" /> Confirm
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { usePatientStore } from '@/stores/patient'
import api from '@/services/api'
import { useDialog } from '@/composables/useDialog'

const patientStore = usePatientStore()
const { alert: dlgAlert, confirm: dlgConfirm } = useDialog()

const hnSep = computed(() => patientStore.hnConfig.hnSep === 'Y')

// Filter state
const fRentNo   = ref('')
const fHnMain   = ref('')
const fHnYear   = ref('')
const fStatus   = ref('ALL')
const fRentCode = ref('')
const fDateFrom = ref(todayIso())
const fDateTo   = ref(todayIso())

const reasons  = ref<any[]>([])
const rows     = ref<any[]>([])
const loading  = ref(false)
const selected = ref<any>(null)
const acting   = ref(false)

// Auto refresh
const autoRefresh = ref(false)
let refreshTimer: any = null

function todayIso(): string {
  return new Date().toISOString().substring(0, 10)
}

function computePatId(): string {
  if (hnSep.value) {
    const yr = fHnYear.value.trim()
    const hn = fHnMain.value.trim()
    if (!yr && !hn) return ''
    return yr + hn.padStart(6, ' ')
  }
  const hn = fHnMain.value.trim()
  return hn ? hn.padStart(8, ' ') : ''
}

function syncHnYear() {
  if (hnSep.value && fHnMain.value.length >= 3) {
    fHnYear.value = fHnMain.value.substring(0, 2)
    fHnMain.value = fHnMain.value.substring(2)
  }
}

function formatHn(patId: string): string {
  if (!patId) return ''
  if (hnSep.value) {
    const yr = patId.substring(0, 2)
    const hn = patId.substring(2).trim()
    return `${hn}-${yr}`
  }
  return patId.trim()
}

// RENTSDT/RENTEDT = yyyyMMdd → dd-MM-yyyy
function fmtDate(d: string): string {
  if (!d || d.length < 8) return d || '-'
  return `${d.substring(6,8)}-${d.substring(4,6)}-${d.substring(0,4)}`
}

async function loadReasons() {
  try {
    const res = await api.get('/rent/reasons')
    reasons.value = res.data
  } catch (e) { console.error(e) }
}

async function onReset() {
  fRentNo.value = ''
  fHnMain.value = ''
  fHnYear.value = ''
  fStatus.value = 'ALL'
  fRentCode.value = ''
  fDateFrom.value = todayIso()
  fDateTo.value = todayIso()
  selected.value = null
  await onSearch()
}

async function onSearch(keepSelection = false) {
  syncHnYear()
  loading.value = true
  if (!keepSelection) selected.value = null
  try {
    const res = await api.get('/rent-admin/search', {
      params: {
        rentNo: fRentNo.value.trim() || undefined,
        patId: computePatId() || undefined,
        status: fStatus.value,
        rentCode: fRentCode.value || undefined,
        dateFrom: fDateFrom.value || undefined,
        dateTo: fDateTo.value || undefined,
      }
    })
    rows.value = res.data
    // ถ้า keepSelection: คงการเลือกถ้า row ยังอยู่
    if (keepSelection && selected.value) {
      selected.value = rows.value.find(r => r.RENTNO === selected.value.RENTNO) || null
    }
  } catch (e: any) {
    if (!keepSelection) await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
  } finally {
    loading.value = false
  }
}

function selectRow(r: any) { selected.value = r }
function isSelected(r: any): boolean {
  return !!selected.value && selected.value.RENTNO === r.RENTNO
}

function rowClass(r: any): string {
  if (isSelected(r)) return 'bg-blue-100'
  if (r.RENTYN === 'Y') return 'bg-green-50 hover:bg-green-100'
  return 'hover:bg-blue-50'
}

// Confirm เฉพาะ RENTYN='N'
const canConfirm = computed(() => !!selected.value && selected.value.RENTYN === 'N')

async function doConfirm() {
  if (!selected.value) return
  const ok = await dlgConfirm(`ยืนยันการอนุมัติยืมแฟ้ม Reg.No ${selected.value.RENTNO}?`, { type: 'warning' })
  if (!ok) return
  acting.value = true
  try {
    await api.post('/rent-admin/confirm', { rentNo: selected.value.RENTNO })
    await dlgAlert('Confirm เรียบร้อย', { type: 'success' })
    await onSearch()
  } catch (e: any) {
    await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
  } finally { acting.value = false }
}

// ─── Export / Print ───────────────────────────────────────────
const headers = ['Reg. No.', 'HN', 'ชื่อผู้ป่วย', 'วันที่เริ่ม', 'วันที่สิ้นสุด', 'เหตุผล', 'สถานะ']
function rowToArray(r: any): string[] {
  return [
    String(r.RENTNO),
    formatHn(r.PATID),
    r.PATNAME || '',
    fmtDate(r.RENTSDT),
    fmtDate(r.RENTEDT),
    r.RENTNAME || '',
    r.RENTYN === 'Y' ? 'Confirmed' : 'Waiting',
  ]
}

// Excel — สร้างเป็น HTML table แล้ว save .xls (Excel เปิดได้ ไม่ต้องพึ่ง library)
function exportExcel() {
  const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  let html = '<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1">'
  html += '<tr>' + headers.map(h => `<th>${esc(h)}</th>`).join('') + '</tr>'
  rows.value.forEach(r => {
    html += '<tr>' + rowToArray(r).map(c => `<td>${esc(c)}</td>`).join('') + '</tr>'
  })
  html += '</table></body></html>'

  const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rent_list_${todayIso()}.xls`
  a.click()
  URL.revokeObjectURL(url)
}

// Print — เปิดหน้าต่างพิมพ์ list ทั้งหมด
function printList() {
  const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const tableRows = rows.value.map(r =>
    '<tr>' + rowToArray(r).map(c => `<td>${esc(c)}</td>`).join('') + '</tr>').join('')
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`
    <html><head><meta charset="utf-8"><title>รายการขอยืมแฟ้ม</title>
    <style>
      body { font-family: 'Tahoma', sans-serif; padding: 20px; }
      h2 { font-size: 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #999; padding: 4px 8px; text-align: left; }
      th { background: #1a4f7a; color: white; }
    </style></head><body>
    <h2>รายการขอยืมแฟ้ม (${rows.value.length} รายการ) — ${todayIso()}</h2>
    <table><thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${tableRows}</tbody></table>
    </body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 300)
}

// ─── Auto refresh ─────────────────────────────────────────────
watch(autoRefresh, (on) => {
  if (on) {
    refreshTimer = setInterval(() => onSearch(true), 10000)
  } else if (refreshTimer) {
    clearInterval(refreshTimer); refreshTimer = null
  }
})

onMounted(async () => {
  if (!patientStore.hnConfig.hnSep) await patientStore.loadHnConfig()
  await loadReasons()
  await onSearch()
})
onUnmounted(() => { if (refreshTimer) clearInterval(refreshTimer) })
</script>

<style scoped>
.rent-th { background: #1a4f7a; color: white; padding: 0.45rem 0.6rem; text-align: left; font-size: 0.7rem; font-weight: 500; white-space: nowrap; }
.rent-td { padding: 0.4rem 0.6rem; font-size: 0.72rem; color: #374151; }
.badge-green { background: #dcfce7; color: #15803d; padding: 0.1rem 0.5rem; border-radius: 0.75rem; font-weight: 600; }
.badge-amber { background: #fef3c7; color: #b45309; padding: 0.1rem 0.5rem; border-radius: 0.75rem; font-weight: 600; }
</style>