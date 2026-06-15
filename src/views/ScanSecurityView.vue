<template>
  <div class="flex flex-col h-[calc(100vh-115px)] gap-3">

    <!-- ── Filter zone ── -->
    <div class="card flex-shrink-0">
      <div class="card-header py-2">
        <i class="bi bi-funnel" /> ค้นหา — ทะเบียนปกปิดข้อมูลผู้ป่วย
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

        <!-- Status -->
        <div>
          <label class="form-label">สถานะ</label>
          <select v-model="fStatus" class="form-select text-xs py-1.5 w-52">
            <option value="ALL">ALL</option>
            <option value="WAITING">Waiting for confirmation</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="END">End</option>
          </select>
        </div>

        <!-- Date range -->
        <div>
          <label class="form-label">วันที่ลงทะเบียน (จาก)</label>
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

    <!-- ── List zone ── -->
    <div class="card flex flex-col flex-1 min-h-0">
      <div class="card-header py-2">
        <i class="bi bi-shield-lock" /> รายการ
        <span class="ml-auto text-xs text-gray-400 font-normal">{{ rows.length }} รายการ</span>
      </div>

      <div class="flex-1 overflow-auto">
        <table class="w-full text-xs border-collapse">
          <thead class="sticky top-0 z-10">
            <tr>
              <th class="sec-th">Requester</th>
              <th class="sec-th">HN</th>
              <th class="sec-th">ชื่อผู้ป่วย</th>
              <th class="sec-th">วันที่ขอ</th>
              <th class="sec-th">เหตุผล</th>
              <th class="sec-th text-center">Confirm</th>
              <th class="sec-th">วันที่ Confirm</th>
              <th class="sec-th text-center">End</th>
              <th class="sec-th">วันที่ End</th>
              <th class="sec-th">Confirm User</th>
              <th class="sec-th">End User</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="11" class="text-center py-8"><span class="loading-spinner" /></td>
            </tr>
            <tr v-else-if="rows.length === 0">
              <td colspan="11" class="text-center py-8 text-gray-400">
                <i class="bi bi-inbox text-2xl block mb-1" />ไม่พบข้อมูล
              </td>
            </tr>
            <tr v-for="r in rows" :key="r.ROWKEY + r.SECUPAT"
              class="cursor-pointer transition-colors border-b border-gray-100"
              :class="rowClass(r)"
              @click="selectRow(r)">
              <td class="sec-td">{{ r.REQUESTER }}</td>
              <td class="sec-td font-mono">{{ formatHn(r.SECUPAT) }}</td>
              <td class="sec-td">{{ r.PATNAME }}</td>
              <td class="sec-td whitespace-nowrap">{{ fmtDateTime(r.SECUDATE) }}</td>
              <td class="sec-td max-w-[200px] truncate" :title="r.SECUMEMO">{{ r.SECUMEMO }}</td>
              <td class="sec-td text-center">
                <span :class="r.SECUAGREE === 'Y' ? 'badge-green' : 'badge-gray'">{{ r.SECUAGREE }}</span>
              </td>
              <td class="sec-td whitespace-nowrap">{{ fmtDateTime(r.SECUAGREEDATE) }}</td>
              <td class="sec-td text-center">
                <span :class="r.SECUENDYN === 'Y' ? 'badge-red' : 'badge-gray'">{{ r.SECUENDYN }}</span>
              </td>
              <td class="sec-td whitespace-nowrap">{{ fmtDateTime(r.SECUENDDATE) }}</td>
              <td class="sec-td">{{ r.AGREEUSERID }}</td>
              <td class="sec-td">{{ r.ENDUSERID }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ── Footer actions ── -->
      <div class="px-4 py-3 border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
        <span v-if="selected" class="text-xs text-gray-500">
          เลือก: HN {{ formatHn(selected.SECUPAT) }} — {{ selected.PATNAME }}
        </span>
        <span v-else class="text-xs text-gray-400">เลือกรายการเพื่อดำเนินการ</span>
        <div class="flex-1" />
        <button class="btn-primary gap-1 py-1.5" :disabled="!canConfirm || !!acting" @click="doConfirm">
          <span v-if="acting === 'confirm'" class="loading-spinner" />
          <i v-else class="bi bi-check-circle" /> Confirm
        </button>
        <button
          class="gap-1 py-1.5 px-4 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="!canEnd || !!acting" @click="doEnd">
          <span v-if="acting === 'end'" class="loading-spinner" />
          <i v-else class="bi bi-x-circle" /> End
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePatientStore } from '@/stores/patient'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { useDialog } from '@/composables/useDialog'

const patientStore = usePatientStore()
const authStore = useAuthStore()
const { alert: dlgAlert, confirm: dlgConfirm } = useDialog()

const hnSep = computed(() => patientStore.hnConfig.hnSep === 'Y')

// Filter state
const fHnMain   = ref('')
const fHnYear   = ref('')
const fStatus   = ref('ALL')
const fDateFrom = ref(todayIso())
const fDateTo   = ref(todayIso())

const rows     = ref<any[]>([])
const loading  = ref(false)
const selected = ref<any>(null)
const acting   = ref<string>('')   // '' | 'confirm' | 'end'

function todayIso(): string {
  return new Date().toISOString().substring(0, 10)
}

// แปลง HN ที่กรอก → PATID padded 8 หลัก (เหมือน HN inputer)
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

// HNSEP split เมื่อพิมพ์ครบ (ปี 2 ตัวหน้า)
function syncHnYear() {
  if (hnSep.value && fHnMain.value.length >= 3) {
    fHnYear.value = fHnMain.value.substring(0, 2)
    fHnMain.value = fHnMain.value.substring(2)
  }
}

// แสดง PATID เป็น HN ตาม config
function formatHn(patId: string): string {
  if (!patId) return ''
  if (hnSep.value) {
    const yr = patId.substring(0, 2)
    const hn = patId.substring(2).trim()
    return `${hn}-${yr}`
  }
  return patId.trim()
}

function fmtDateTime(s: string | null): string {
  if (!s) return '-'
  // s = "yyyy-MM-dd HH:mm:ss.mmm" → "dd-MM-yyyy HH:mm"
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/)
  if (!m) return s
  return `${m[3]}-${m[2]}-${m[1]} ${m[4]}:${m[5]}`
}

async function onReset() {
  fHnMain.value = ''
  fHnYear.value = ''
  fStatus.value = 'ALL'
  fDateFrom.value = todayIso()
  fDateTo.value = todayIso()
  selected.value = null
  await onSearch()
}

async function onSearch() {
  syncHnYear()
  loading.value = true
  selected.value = null
  try {
    const res = await api.get('/secure-admin/search', {
      params: {
        patId: computePatId() || undefined,
        status: fStatus.value,
        dateFrom: fDateFrom.value || undefined,
        dateTo: fDateTo.value || undefined,
      }
    })
    rows.value = res.data
  } catch (e: any) {
    await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
  } finally {
    loading.value = false
  }
}

function selectRow(r: any) { selected.value = r }
function isSelected(r: any): boolean {
  return !!selected.value && selected.value.ROWKEY === r.ROWKEY && selected.value.SECUPAT === r.SECUPAT
}

// สีพื้น row: select=ฟ้า, End(SECUENDYN=Y)=แดง, Confirmed active(Y+N)=เขียว, อื่นๆ=ปกติ
function rowClass(r: any): string {
  if (isSelected(r)) return 'bg-blue-100'
  if (r.SECUENDYN === 'Y') return 'bg-red-50 hover:bg-red-100'
  if (r.SECUAGREE === 'Y' && r.SECUENDYN === 'N') return 'bg-green-50 hover:bg-green-100'
  return 'hover:bg-blue-50'
}

// Confirm เฉพาะ SECUAGREE='N'
const canConfirm = computed(() => !!selected.value && selected.value.SECUAGREE === 'N')
// End เฉพาะ SECUAGREE='Y' AND SECUENDYN='N'
const canEnd = computed(() => !!selected.value && selected.value.SECUAGREE === 'Y' && selected.value.SECUENDYN === 'N')

async function doConfirm() {
  if (!selected.value) return
  const ok = await dlgConfirm(`ยืนยันการ Confirm ปกปิดข้อมูล HN ${formatHn(selected.value.SECUPAT)}?`, { type: 'warning' })
  if (!ok) return
  acting.value = 'confirm'
  try {
    await api.post('/secure-admin/confirm', {
      patId: selected.value.SECUPAT,
      rowKey: selected.value.ROWKEY,
    })
    await dlgAlert('Confirm เรียบร้อย', { type: 'success' })
    await onSearch()
  } catch (e: any) {
    await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
  } finally { acting.value = '' }
}

async function doEnd() {
  if (!selected.value) return
  const ok = await dlgConfirm(`ยืนยันการ End ปกปิดข้อมูล HN ${formatHn(selected.value.SECUPAT)}?`, { type: 'warning' })
  if (!ok) return
  acting.value = 'end'
  try {
    await api.post('/secure-admin/end', {
      patId: selected.value.SECUPAT,
      rowKey: selected.value.ROWKEY,
    })
    await dlgAlert('End เรียบร้อย', { type: 'success' })
    await onSearch()
  } catch (e: any) {
    await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
  } finally { acting.value = '' }
}

onMounted(async () => {
  if (!patientStore.hnConfig.hnSep) await patientStore.loadHnConfig()
  await onSearch()
})
</script>

<style scoped>
.sec-th { background: #1a4f7a; color: white; padding: 0.45rem 0.6rem; text-align: left; font-size: 0.7rem; font-weight: 500; white-space: nowrap; }
.sec-td { padding: 0.4rem 0.6rem; font-size: 0.72rem; color: #374151; }
.badge-green { background: #dcfce7; color: #15803d; padding: 0.1rem 0.5rem; border-radius: 0.75rem; font-weight: 600; }
.badge-red   { background: #fee2e2; color: #b91c1c; padding: 0.1rem 0.5rem; border-radius: 0.75rem; font-weight: 600; }
.badge-gray  { background: #f3f4f6; color: #9ca3af; padding: 0.1rem 0.5rem; border-radius: 0.75rem; font-weight: 600; }
</style>