<template>
  <div class="flex flex-col h-[calc(100vh-115px)] gap-3">

    <!-- ── Filter zone ── -->
    <div class="card flex-shrink-0">
      <div class="card-header py-2">
        <i class="bi bi-funnel" /> ค้นหา — คำขอพิมพ์เอกสาร
      </div>
      <div class="p-3 flex flex-wrap items-end gap-3">
        <!-- HN inputer -->
        <div>
          <label class="form-label">HN</label>
          <div class="flex items-center gap-1">
            <input v-model="fHnMain" type="text" :maxlength="8"
              :placeholder="hnSep ? 'ปี+HN' : 'HN 8 หลัก'"
              class="form-input text-xs py-1.5 w-32 font-mono"
              @keydown.enter="onSearch" />
            <template v-if="hnSep">
              <span class="text-gray-400 text-xs">-</span>
              <input v-model="fHnYear" type="text" maxlength="2" readonly tabindex="-1"
                class="form-input text-xs py-1.5 w-10 font-mono bg-gray-50" />
            </template>
          </div>
        </div>

        <!-- Patient name -->
        <div>
          <label class="form-label">ชื่อผู้ป่วย</label>
          <input v-model="fPatName" type="text" class="form-input text-xs py-1.5 w-36"
            @keydown.enter="onSearch" />
        </div>

        <!-- Clinic -->
        <div>
          <label class="form-label">คลินิก</label>
          <select v-model="fNeedClin" class="form-select text-xs py-1.5 w-40">
            <option value="ALL">ทั้งหมด</option>
            <option v-for="c in clinics" :key="c.CLINCODE" :value="c.CLINCODE">{{ c.NAME }}</option>
          </select>
        </div>

        <!-- Print status -->
        <div>
          <label class="form-label">สถานะพิมพ์</label>
          <select v-model="fPrinted" class="form-select text-xs py-1.5 w-28">
            <option value="ALL">ALL</option>
            <option value="N">ยังไม่พิมพ์</option>
            <option value="Y">พิมพ์แล้ว</option>
          </select>
        </div>

        <!-- Date range (CDATE) -->
        <div>
          <label class="form-label">วันที่ขอ (จาก)</label>
          <input v-model="fDateFrom" type="date" class="form-input text-xs py-1.5" />
        </div>
        <div>
          <label class="form-label">ถึง</label>
          <input v-model="fDateTo" type="date" class="form-input text-xs py-1.5" />
        </div>

        <button class="btn-primary gap-1 py-1.5" :disabled="loading" @click="onSearch">
          <span v-if="loading" class="loading-spinner" />
          <i v-else class="bi bi-search" /> ค้นหา
        </button>
        <button class="btn-outline gap-1 py-1.5" :disabled="loading" @click="onReset">
          <i class="bi bi-arrow-counterclockwise" /> ล้าง
        </button>
      </div>
    </div>

    <!-- ── List (left) + Preview (right) ── -->
    <div class="flex gap-3 flex-1 min-h-0">

      <!-- List zone (ครึ่งซ้าย) -->
      <div class="card flex flex-col flex-1 min-h-0" style="flex-basis:50%;">
        <div class="card-header py-2">
          <i class="bi bi-printer" /> รายการ
          <span class="ml-auto text-xs text-gray-400 font-normal">{{ rows.length }} รายการ</span>
        </div>

        <div class="flex-1 overflow-auto">
          <table class="w-full text-xs border-collapse">
            <thead class="sticky top-0 z-10">
              <tr>
                <th class="pn-th">HN</th>
                <th class="pn-th">ชื่อผู้ป่วย</th>
                <th class="pn-th">ผู้ขอ</th>
                <th class="pn-th">ประเภท</th>
                <th class="pn-th">วันที่</th>
                <th class="pn-th text-right">พิมพ์</th>
                <th class="pn-th text-center">สถานะ</th>
                <th class="pn-th text-center">ยกเลิก</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="8" class="text-center py-8"><span class="loading-spinner" /></td>
              </tr>
              <tr v-else-if="rows.length === 0">
                <td colspan="8" class="text-center py-8 text-gray-400">
                  <i class="bi bi-inbox text-2xl block mb-1" />ไม่พบข้อมูล
                </td>
              </tr>
              <tr v-for="r in rows" :key="r.SEQ"
                class="cursor-pointer transition-colors border-b border-gray-100"
                :class="rowClass(r)"
                @click="selectRow(r)">
                <td class="pn-td font-mono">{{ formatHn(r.PATID) }}</td>
                <td class="pn-td truncate max-w-[100px]" :title="r.PATNAME">{{ r.PATNAME }}</td>
                <td class="pn-td">{{ r.CUSERID }}</td>
                <td class="pn-td truncate max-w-[90px]" :title="r.PRINTTYPE">{{ r.PRINTTYPE }}</td>
                <td class="pn-td whitespace-nowrap">{{ fmtDate(r.CDATE) }}</td>
                <td class="pn-td text-right font-mono">{{ r.NEEDCNT }}</td>
                <td class="pn-td text-center">
                  <span :class="r.PRINTED === 'Y' ? 'badge-green' : 'badge-amber'">
                    {{ r.PRINTED === 'Y' ? 'พิมพ์แล้ว' : 'ยังไม่' }}
                  </span>
                </td>
                <td class="pn-td text-center">
                  <span :class="r.NEEDCANCLE === 'Y' ? 'badge-red' : 'badge-gray'">{{ r.NEEDCANCLE }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer actions -->
        <div class="px-4 py-3 border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
          <div class="flex-1" />
          <button class="btn-outline gap-1 py-1.5" :disabled="rows.length === 0" @click="exportExcel">
            <i class="bi bi-file-earmark-excel" /> Excel
          </button>
          <button class="btn-outline gap-1 py-1.5" :disabled="rows.length === 0" @click="printList">
            <i class="bi bi-list-ul" /> Print List
          </button>
          <button class="btn-primary gap-1 py-1.5" :disabled="!selected || !!acting" @click="doConfirm">
            <span v-if="acting === 'confirm'" class="loading-spinner" />
            <i v-else class="bi bi-printer-fill" /> Confirm
          </button>
          <button
            class="gap-1 py-1.5 px-4 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="!canCancel || !!acting" @click="doCancel">
            <span v-if="acting === 'cancel'" class="loading-spinner" />
            <i v-else class="bi bi-x-circle" /> Cancel
          </button>
        </div>
      </div>

      <!-- Preview zone (ครึ่งขวา) -->
      <div class="card flex flex-col flex-1 min-h-0" style="flex-basis:50%;">
        <div class="card-header py-2">
          <i class="bi bi-image" /> ตัวอย่างเอกสาร
          <span v-if="selected" class="ml-2 text-xs text-gray-400 font-normal">
            HN {{ formatHn(selected.PATID) }} · {{ selected.PATNAME }}
          </span>
        </div>
        <div class="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-3 min-h-0">
          <div v-if="!selected" class="empty-state">
            <i class="bi bi-arrow-left-circle text-3xl block mb-2" />
            <p class="text-sm">เลือกรายการเพื่อดูตัวอย่าง</p>
          </div>
          <img v-else :src="previewSrc"
            class="max-w-full max-h-full object-contain bg-white shadow"
            :alt="`PAGENO ${selected.PAGENO}`"
            @error="(e:any) => e.target.style.display='none'" />
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePatientStore } from '@/stores/patient'
import api from '@/services/api'
import { useDialog } from '@/composables/useDialog'

const patientStore = usePatientStore()
const { alert: dlgAlert, confirm: dlgConfirm } = useDialog()

const hnSep = computed(() => patientStore.hnConfig.hnSep === 'Y')

// Filter state
const fHnMain   = ref('')
const fHnYear   = ref('')
const fPatName  = ref('')
const fNeedClin = ref('ALL')
const fPrinted  = ref('ALL')
const fDateFrom = ref(todayIso())
const fDateTo   = ref(todayIso())

const clinics  = ref<any[]>([])
const rows     = ref<any[]>([])
const loading  = ref(false)
const selected = ref<any>(null)
const acting   = ref<string>('')   // '' | 'confirm' | 'cancel'

// Watermark config (เหมือน ViewerView)
const wmEnabled = ref(false)
const wmOpacity = ref(0.2)

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

// แสดง PATID เป็น HN ตาม config HNSEP
function formatHn(patId: string): string {
  if (!patId) return ''
  if (hnSep.value) {
    const yr = patId.substring(0, 2)
    const hn = patId.substring(2).trim()
    return `${hn}-${yr}`
  }
  return patId.trim()
}

// CDATE yyyyMMdd → dd-MM-yyyy
function fmtDate(d: string): string {
  if (!d || d.length < 8) return d || '-'
  return `${d.substring(6,8)}-${d.substring(4,6)}-${d.substring(0,4)}`
}

// preview รูปของ row ที่เลือก — fmt=jpg (รองรับ TIFF)
const previewSrc = computed(() => {
  if (!selected.value) return ''
  const p = selected.value
  return `/api/image/${p.PAGENO}?ext=${p.EXTENSION||'jpg'}&fmt=jpg`
})

async function loadClinics() {
  try { clinics.value = (await api.get('/printneed/clinics')).data } catch (e) { console.error(e) }
}

async function onSearch() {
  syncHnYear()
  loading.value = true
  selected.value = null
  try {
    const res = await api.get('/printneed-admin/search', {
      params: {
        patId: computePatId() || undefined,
        patName: fPatName.value.trim() || undefined,
        dateFrom: fDateFrom.value || undefined,
        dateTo: fDateTo.value || undefined,
        needClin: fNeedClin.value,
        printed: fPrinted.value,
      }
    })
    rows.value = res.data
  } catch (e: any) {
    await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
  } finally {
    loading.value = false
  }
}

async function onReset() {
  fHnMain.value = ''
  fHnYear.value = ''
  fPatName.value = ''
  fNeedClin.value = 'ALL'
  fPrinted.value = 'ALL'
  fDateFrom.value = todayIso()
  fDateTo.value = todayIso()
  selected.value = null
  await onSearch()
}

function selectRow(r: any) { selected.value = r }
function isSelected(r: any): boolean {
  return !!selected.value && selected.value.SEQ === r.SEQ
}

// สีพื้น row: select=ฟ้า, cancel=แดง, พิมพ์แล้ว=เขียว, อื่นๆ=ปกติ
function rowClass(r: any): string {
  if (isSelected(r)) return 'bg-blue-100'
  if (r.NEEDCANCLE === 'Y') return 'bg-red-50 hover:bg-red-100'
  if (r.PRINTED === 'Y') return 'bg-green-50 hover:bg-green-100'
  return 'hover:bg-blue-50'
}

// Confirm กดได้ตลอด (มี selected)
// Cancel เฉพาะ NEEDCANCLE='N'
const canCancel = computed(() => !!selected.value && selected.value.NEEDCANCLE === 'N')

// Confirm = อัปเดต DB (PRINTED='Y', NEEDCNT+1) แล้วพิมพ์รูปจริง (เหมือนปุ่ม print ViewerView)
async function doConfirm() {
  if (!selected.value) return
  const ok = await dlgConfirm(`ยืนยัน Confirm + พิมพ์ HN ${formatHn(selected.value.PATID)}?`, { type: 'warning' })
  if (!ok) return
  acting.value = 'confirm'
  try {
    await api.post('/printneed-admin/confirm', { seq: selected.value.SEQ })
    // พิมพ์รูปจริง (เปิดหน้าต่างพิมพ์ + watermark)
    doPrint(previewSrc.value)
    await onSearch()
  } catch (e: any) {
    await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
  } finally { acting.value = '' }
}

async function doCancel() {
  if (!selected.value) return
  const ok = await dlgConfirm(`ยืนยัน Cancel คำขอพิมพ์ HN ${formatHn(selected.value.PATID)}?`, { type: 'warning' })
  if (!ok) return
  acting.value = 'cancel'
  try {
    await api.post('/printneed-admin/cancel', { seq: selected.value.SEQ })
    await dlgAlert('Cancel เรียบร้อย', { type: 'success' })
    await onSearch()
  } catch (e: any) {
    await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
  } finally { acting.value = '' }
}

// พิมพ์รูปจริง — เปิดหน้าต่างใหม่ใส่รูป (+ watermark ถ้าเปิด) แล้วสั่งพิมพ์ (เหมือน ViewerView)
function doPrint(src: string) {
  if (!src) return
  const win = window.open('', '_blank')
  if (!win) return

  const wm = wmEnabled.value
    ? `<img class="wm" src="/api/watermark/image" style="opacity:${wmOpacity.value}" />`
    : ''

  win.document.write(`
    <html><head><title>Print</title>
    <style>
      @media print { @page { margin: 0; } }
      body { margin: 0; }
      .wrap { position: relative; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
      .doc { max-width: 100%; max-height: 100vh; object-fit: contain; }
      .wm { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            max-width: 60%; max-height: 60%; object-fit: contain; pointer-events: none; }
    </style></head>
    <body><div class="wrap">
      <img class="doc" src="${src}" />
      ${wm}
    </div>
    <script>
      (function(){
        var imgs = document.images, total = imgs.length, loaded = 0;
        function done(){ loaded++; if (loaded >= total) { window.print(); window.onafterprint = function(){ window.close(); }; } }
        for (var i=0;i<total;i++){
          if (imgs[i].complete) done();
          else { imgs[i].onload = done; imgs[i].onerror = done; }
        }
      })();
    <\/script>
    </body></html>`)
  win.document.close()
}

// ─── Export / Print list ──────────────────────────────────────
const headers = ['HN', 'ชื่อผู้ป่วย', 'ผู้ขอ', 'ประเภท', 'วันที่', 'จำนวนพิมพ์', 'สถานะ', 'ยกเลิก']
function rowToArray(r: any): string[] {
  return [
    formatHn(r.PATID),
    r.PATNAME || '',
    r.CUSERID || '',
    r.PRINTTYPE || '',
    fmtDate(r.CDATE),
    r.NEEDCNT || '0',
    r.PRINTED === 'Y' ? 'พิมพ์แล้ว' : 'ยังไม่พิมพ์',
    r.NEEDCANCLE || 'N',
  ]
}

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
  a.download = `printneed_${todayIso()}.xls`
  a.click()
  URL.revokeObjectURL(url)
}

function printList() {
  const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const tableRows = rows.value.map(r =>
    '<tr>' + rowToArray(r).map(c => `<td>${esc(c)}</td>`).join('') + '</tr>').join('')
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`
    <html><head><meta charset="utf-8"><title>รายการคำขอพิมพ์</title>
    <style>
      body { font-family: 'Tahoma', sans-serif; padding: 20px; }
      h2 { font-size: 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #999; padding: 4px 8px; text-align: left; }
      th { background: #1a4f7a; color: white; }
    </style></head><body>
    <h2>รายการคำขอพิมพ์เอกสาร (${rows.value.length} รายการ) — ${todayIso()}</h2>
    <table><thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${tableRows}</tbody></table>
    </body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 300)
}

onMounted(async () => {
  if (!patientStore.hnConfig.hnSep) await patientStore.loadHnConfig()
  await loadClinics()
  // โหลด watermark config (เหมือน ViewerView)
  try {
    const res = await api.get('/watermark/config')
    wmEnabled.value = !!res.data.enabled
    wmOpacity.value = typeof res.data.opacity === 'number' ? res.data.opacity : 0.2
  } catch (e) { console.error(e) }
  await onSearch()
})
</script>

<style scoped>
.pn-th { background: #1a4f7a; color: white; padding: 0.45rem 0.6rem; text-align: left; font-size: 0.7rem; font-weight: 500; white-space: nowrap; }
.pn-td { padding: 0.4rem 0.6rem; font-size: 0.72rem; color: #374151; }
.badge-green { background: #dcfce7; color: #15803d; padding: 0.1rem 0.5rem; border-radius: 0.75rem; font-weight: 600; }
.badge-amber { background: #fef3c7; color: #b45309; padding: 0.1rem 0.5rem; border-radius: 0.75rem; font-weight: 600; }
.badge-red   { background: #fee2e2; color: #b91c1c; padding: 0.1rem 0.5rem; border-radius: 0.75rem; font-weight: 600; }
.badge-gray  { background: #f3f4f6; color: #9ca3af; padding: 0.1rem 0.5rem; border-radius: 0.75rem; font-weight: 600; }
</style>