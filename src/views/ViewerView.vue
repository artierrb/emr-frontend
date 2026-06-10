<template>
  <div class="flex flex-col h-[calc(100vh-115px)]">

    <!-- Main layout -->
    <div class="flex gap-3 flex-1 min-h-0 h-full">

      <!-- Col A: Filter buttons -->
      <div class="flex flex-col gap-2 flex-shrink-0 w-12">
        <div class="flex flex-col gap-1">
          <button v-for="f in filters" :key="f.value"
            class="w-10 h-10 rounded-lg border text-xs font-semibold transition-colors"
            :class="activeFilter === f.value
              ? 'bg-[#1a4f7a] text-white border-[#1a4f7a]'
              : 'bg-white text-gray-600 border-gray-200 hover:border-[#1a4f7a] hover:text-[#1a4f7a]'"
            @click="activeFilter = f.value">{{ f.label }}</button>
        </div>
        <div class="flex-1" />
        <div class="flex flex-col gap-1">
          <button v-for="b in bottomBtns" :key="b"
            class="w-10 h-10 rounded-lg border border-gray-200 bg-white text-[9px] font-semibold text-gray-400 cursor-not-allowed"
            disabled>{{ b }}</button>
        </div>
      </div>

      <!-- Col B: Group/Treat list -->
      <div class="card flex flex-col flex-shrink-0 w-80 min-h-0">
        <!-- HN inputer -->
        <div class="p-2 border-b border-gray-100 flex-shrink-0">
          <HnInputer ref="hnInputer" :is-sep="patientStore.hnConfig.hnSep === 'Y'"
            @search="onHnSearch" @open-search="showSearch = true" @clear="clearAll" />
          <PatientInfoBox class="mt-1" :patient="viewerPatient" :hn="lastHn" :not-found="notFound" @clear="clearAll" />
          <span v-if="loading" class="loading-spinner mt-1" />
        </div>
        <div class="card-header py-2">
          <i class="bi bi-folder2" /> รายการ
          <span class="ml-auto text-xs text-gray-400 font-normal">{{ filteredGroups.length }} กลุ่ม</span>
        </div>
        <div class="flex-1 overflow-y-auto">
          <div v-if="!viewerPatient" class="empty-state py-8">
            <i class="bi bi-search text-2xl block mb-2" /><p class="text-xs">ค้นหาผู้ป่วยก่อน</p>
          </div>
          <div v-else-if="loading" class="flex justify-center py-8"><span class="loading-spinner" /></div>
          <div v-else-if="filteredGroups.length === 0" class="empty-state py-8">
            <i class="bi bi-inbox text-2xl block mb-2" /><p class="text-xs">ไม่พบข้อมูล</p>
          </div>
          <template v-else>
            <div v-for="g in filteredGroups" :key="g.formCode">
              <div
                class="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 sticky top-0 bg-white z-10"
                :class="activeGroup === g.formCode && !activeTreat ? 'bg-blue-50 text-blue-800' : 'text-gray-700'"
                @click="selectGroup(g)">
                <i class="bi text-xs flex-shrink-0"
                  :class="expandedGroups.has(g.formCode) ? 'bi-chevron-down' : 'bi-chevron-right'" />
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-semibold truncate">{{ g.formName }}</div>
                  <div class="text-[10px] text-gray-400">{{ g.formCode }} [{{ g.totalCnt }}]</div>
                </div>
              </div>
              <template v-if="expandedGroups.has(g.formCode)">
                <div v-for="t in g.treats" :key="t.TREATNO"
                  class="pl-6 pr-3 py-1.5 cursor-pointer hover:bg-sky-50 transition-colors border-b border-gray-100 text-xs"
                  :class="activeTreat === t.TREATNO && activeGroup === g.formCode ? 'bg-sky-100 text-sky-800' : 'text-gray-600'"
                  @click="selectTreat(g.formCode, t)">
                  <div class="font-medium">{{ formatDate(t.INDATE) }} [{{ t.CLINCODE }}]</div>
                  <div class="text-[10px] text-gray-400 truncate">{{ t.DOCNAME }} [{{ t.CNT }}]</div>
                </div>
              </template>
            </div>
          </template>
        </div>
      </div>

      <!-- Col C: Thumbnail grid -->
      <div class="card flex flex-col flex-1 min-h-0">
        <div class="card-header py-2">
          <i class="bi bi-images" />
          {{ activeGroupName || 'เอกสาร' }}
          <span v-if="viewPages.length > 0" class="ml-2 text-xs text-gray-400 font-normal">{{ viewPages.length }} ภาพ</span>
          <span v-if="loadingPages" class="ml-2 loading-spinner" />
          <div class="ml-auto flex items-center gap-2">
            <!-- OCR Print toggle button -->
            <button
              class="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition-colors"
              :class="showOcrPanel
                ? 'bg-[#1a4f7a] text-white border-[#1a4f7a]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#1a4f7a] hover:text-[#1a4f7a]'"
              @click="showOcrPanel = !showOcrPanel"
            >
              <i class="bi bi-printer" /> OCR Print
            </button>
          </div>
        </div>
        <div class="flex flex-1 min-h-0">
          <!-- Thumbnail area -->
          <div class="flex-1 overflow-y-auto p-3 min-h-0">
            <div v-if="viewPages.length === 0 && !loadingPages" class="empty-state">
              <i class="bi bi-file-earmark-image text-3xl block mb-2" />
              <p class="text-sm">เลือกกลุ่มหรือรายการด้านซ้าย</p>
            </div>
            <div v-else class="grid gap-2" style="grid-template-columns: repeat(auto-fill, minmax(120px, 1fr))">
              <div v-for="(p, idx) in viewPages" :key="p.PAGENO"
                class="border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:border-sky-400 hover:shadow-sm transition-all"
                @click="openViewer(idx)">
                <img :src="`/api/image/${p.PAGENO}?ext=${p.EXTENSION||'jpg'}`"
                  class="w-full h-28 object-cover bg-gray-100" :alt="`หน้า ${p.PAGE}`"
                  @error="(e:any) => e.target.style.display='none'" />
                <div class="px-1 py-1 text-[10px] text-gray-400 text-center truncate">
                  หน้า {{ p.PAGE }} · {{ formatDate(p.CDATE) }}
                </div>
              </div>
            </div>
          </div>

          <!-- OCR Print side panel -->
          <Transition name="slide-right">
            <div v-if="showOcrPanel" class="w-72 border-l border-gray-200 flex flex-col flex-shrink-0 min-h-0">
              <!-- Filter tabs -->
              <div class="flex border-b border-gray-200 px-2 pt-2 gap-0.5 flex-shrink-0">
                <button v-for="tab in ocrTabs" :key="tab.value"
                  class="px-3 py-1.5 text-xs font-semibold rounded-t-lg border-b-2 transition-colors"
                  :class="ocrGubun === tab.value
                    ? 'border-[#1a4f7a] text-[#1a4f7a] bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-[#1a4f7a]'"
                  @click="changeOcrGubun(tab.value)">{{ tab.label }}</button>
              </div>

              <!-- Search -->
              <div class="px-2 py-2 flex-shrink-0">
                <input v-model="ocrSearch" type="text" class="form-input text-xs py-1" placeholder="ค้นหาฟอร์ม..." />
              </div>

              <!-- Form list -->
              <div class="flex-1 overflow-y-auto">
                <div v-if="loadingOcr" class="flex justify-center py-4"><span class="loading-spinner" /></div>
                <div v-else-if="filteredOcrForms.length === 0" class="empty-state py-6">
                  <i class="bi bi-inbox text-xl block mb-1" /><p class="text-xs">ไม่พบข้อมูล</p>
                </div>
                <div v-for="(f, idx) in filteredOcrForms" :key="`${f.FORMCODE}-${idx}`"
                  class="flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-gray-100 hover:bg-blue-50 transition-colors text-xs"
                  :class="selectedOcrForm?.FORMCODE === f.FORMCODE ? 'bg-blue-100 text-blue-800 font-semibold' : 'text-gray-700'"
                  @click="selectedOcrForm = f">
                  <i class="bi bi-file-earmark-text text-gray-400 flex-shrink-0" />
                  <div class="flex-1 min-w-0">
                    <div class="font-mono text-[10px] text-gray-400">{{ f.FORMCODE }}</div>
                    <div class="truncate">{{ f.FORMNAME }}</div>
                  </div>
                </div>
              </div>

              <!-- Action buttons -->
              <div class="p-2 border-t border-gray-100 flex gap-2 flex-shrink-0">
                <button class="btn-primary flex-1 justify-center text-xs py-1.5 gap-1"
                  :disabled="!selectedOcrForm || ocrPrinting" @click="doOcrPrint(false)">
                  <span v-if="ocrPrinting" class="loading-spinner" />
                  <i v-else class="bi bi-printer" /> Print
                </button>
                <button class="btn-outline flex-1 justify-center text-xs py-1.5 gap-1"
                  :disabled="!selectedOcrForm || ocrLoadingPdf" @click="doOcrPrint(true)">
                  <span v-if="ocrLoadingPdf" class="loading-spinner" />
                  <i v-else class="bi bi-eye" /> Preview
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>

    </div>
  </div>

  <!-- Image viewer overlay -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="viewerOpen" class="fixed inset-0 z-[9000] bg-black/90 flex flex-col"
        @click.self="viewerOpen = false">
        <div class="flex items-center gap-2 px-4 py-2 bg-black/60 flex-shrink-0">
          <button class="viewer-btn" @click="vZoom = Math.max(0.25, vZoom-0.25)"><i class="bi bi-zoom-out" /></button>
          <button class="viewer-btn" @click="vZoom = Math.min(4, vZoom+0.25)"><i class="bi bi-zoom-in" /></button>
          <button class="viewer-btn" @click="vZoom=1;vRotate=0"><i class="bi bi-aspect-ratio" /></button>
          <button class="viewer-btn" @click="vRotate=(vRotate+90)%360"><i class="bi bi-arrow-clockwise" /></button>
          <span class="flex-1 text-white/70 text-sm truncate">{{ viewerLabel }}</span>
          <span class="text-white/50 text-xs">{{ viewerIdx+1 }} / {{ viewPages.length }}</span>
          <button class="viewer-btn" :class="viewerIdx <= 0 ? 'opacity-30' : ''" @click="navViewer(-1)"><i class="bi bi-chevron-left" /></button>
          <button class="viewer-btn" :class="viewerIdx >= viewPages.length-1 ? 'opacity-30' : ''" @click="navViewer(1)"><i class="bi bi-chevron-right" /></button>
          <button class="viewer-btn" @click="viewerOpen=false"><i class="bi bi-x-lg" /></button>
        </div>
        <div class="flex-1 flex items-center justify-center overflow-hidden p-4">
          <img :src="viewerSrc"
            :style="{ transform: `scale(${vZoom}) rotate(${vRotate}deg)`, transition: 'transform 0.2s' }"
            class="max-w-full max-h-full object-contain" />
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- PDF Preview modal -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="pdfPreviewUrl" class="fixed inset-0 z-[8500] flex items-center justify-center">
        <div class="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" @click="pdfPreviewUrl=''" />
        <div class="relative bg-white rounded-xl shadow-2xl flex flex-col" style="width:85vw;height:90vh;">
          <div class="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <i class="bi bi-file-pdf text-red-500" />
            <span class="font-semibold text-sm">{{ selectedOcrForm?.FORMNAME }}</span>
            <span class="text-xs text-gray-400 ml-1">{{ selectedOcrForm?.FORMCODE }}</span>
            <div class="flex-1" />
            <button class="viewer-btn-dark" @click="pdfPreviewUrl=''"><i class="bi bi-x-lg" /></button>
          </div>
          <iframe :src="pdfPreviewUrl" class="flex-1 w-full border-0 rounded-b-xl" type="application/pdf" />
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Reprint reason modal -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showReasonModal" class="fixed inset-0 z-[9500] flex items-center justify-center">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
        <div class="relative bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden">
          <div class="flex items-center gap-2 px-5 py-3 border-b">
            <i class="bi bi-exclamation-triangle-fill text-amber-500" />
            <span class="font-semibold text-sm">เคยสั่งพิมพ์แล้ว — กรุณาระบุเหตุผล</span>
          </div>
          <div class="px-5 py-4 space-y-2">
            <p class="text-xs text-gray-500">ฟอร์ม <strong>{{ selectedOcrForm?.FORMCODE }}</strong> เคยถูกพิมพ์ไปแล้ว</p>
            <select v-model="selectedReason" class="form-select text-sm">
              <option value="">-- กรุณาเลือกเหตุผล --</option>
              <option v-for="r in reprintReasons" :key="r.DtlCod" :value="r.DtlCod">{{ r.DtlCodNam }}</option>
            </select>
          </div>
          <div class="px-5 py-3 border-t flex gap-2 justify-end">
            <button class="btn-outline" @click="showReasonModal=false">ยกเลิก</button>
            <button class="btn-primary gap-1" :disabled="!selectedReason" @click="confirmOcrPrint">
              <i class="bi bi-printer" /> ยืนยัน
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Treat selection modal -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showTreatModal" class="fixed inset-0 z-[8000] flex items-center justify-center">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
        <div class="relative bg-white rounded-xl shadow-2xl flex flex-col" style="width:780px;max-height:80vh;">
          <div class="flex items-center gap-2 px-5 py-3 border-b border-gray-100 flex-shrink-0">
            <i class="bi bi-folder2-open text-[#1a4f7a]" />
            <span class="font-semibold text-sm">เลือกข้อมูลการรักษา</span>
            <span v-if="pendingPatient" class="ml-2 text-xs text-gray-400">
              {{ pendingPatient.NAME }} | HN: {{ pendingPatient.PATID?.trim() }}
            </span>
          </div>

          <div class="flex-1 overflow-auto">
            <div v-if="loadingTreats" class="flex justify-center py-10">
              <span class="loading-spinner" />
            </div>
            <table v-else class="w-full text-xs border-collapse">
              <thead class="sticky top-0 z-10">
                <tr>
                  <th class="treat-th text-center">I/O</th>
                  <th class="treat-th text-center">Dept</th>
                  <th class="treat-th text-center">INDATE</th>
                  <th class="treat-th text-center">OUTDATE</th>
                  <th class="treat-th text-center">Doctor</th>
                  <th class="treat-th text-center">VN/AN</th>
                  <th class="treat-th text-center">TreatNo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="allTreatsModal.length === 0">
                  <td colspan="7" class="text-center py-6 text-gray-400">ไม่พบข้อมูล</td>
                </tr>
                <tr
                  v-for="t in allTreatsModal" :key="t.treatNo"
                  class="cursor-pointer hover:bg-blue-50 transition-colors"
                  :class="selectedTreat?.treatNo === t.treatNo ? 'bg-blue-100' : ''"
                  @click="selectedTreat = t"
                  @dblclick="selectedTreat = t; confirmTreat()"
                >
                  <td class="treat-td text-center font-bold" :class="t.classType === 'I' ? 'text-blue-700' : 'text-green-700'">
                    {{ t.classType }}
                  </td>
                  <td class="treat-td text-center">{{ t.clinCode }}</td>
                  <td class="treat-td text-center whitespace-nowrap">{{ formatDate(t.inDate) }}</td>
                  <td class="treat-td text-center whitespace-nowrap">{{ t.outDate ? formatDate(t.outDate) : '-' }}</td>
                  <td class="treat-td text-center truncate max-w-[120px]">{{ t.docName || t.docCode }}</td>
                  <td class="treat-td text-center">{{ (t.vstNum||'').trim() || (t.admNum||'').trim() || '-' }}</td>
                  <td class="treat-td text-center font-mono text-gray-400">{{ t.treatNo }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="px-5 py-3 border-t border-gray-100 flex gap-2 justify-between items-center flex-shrink-0">
            <span class="text-xs text-gray-400">ดับเบิ้ลคลิกเพื่อเลือกทันที</span>
            <div class="flex gap-2">
              <button class="btn-outline" @click="cancelTreatModal">ยกเลิก</button>
              <button class="btn-primary gap-1" :disabled="!selectedTreat" @click="confirmTreat">
                <i class="bi bi-check-lg" /> เลือก
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <PatientSearchModal v-model="showSearch" @selected="onPatientSelected" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { usePatientStore } from '@/stores/patient'
import { useAuthStore } from '@/stores/auth'
import type { Patient } from '@/types'
import HnInputer from '@/components/common/HnInputer.vue'
import PatientInfoBox from '@/components/common/PatientInfoBox.vue'
import PatientSearchModal from '@/components/common/PatientSearchModal.vue'
import api from '@/services/api'
import { useDialog } from '@/composables/useDialog'
const { alert: dlgAlert, confirm: dlgConfirm } = useDialog()

const patientStore = usePatientStore()
const authStore = useAuthStore()
const hnInputer = ref<InstanceType<typeof HnInputer>>()
const showSearch = ref(false)
const lastHn = ref('')
const notFound = ref(false)
const viewerPatient = ref<Patient|null>(null)
const loading = ref(false)

// Treat selection modal
const showTreatModal = ref(false)
const allTreatsModal = ref<any[]>([])
const loadingTreats = ref(false)
const selectedTreat = ref<any>(null)
const pendingPatient = ref<any>(null)
const loadingPages = ref(false)

// Filter
const activeFilter = ref('ALL')
const filters = [
  { label: 'ALL', value: 'ALL' },
  { label: 'OPD', value: 'O' },
  { label: 'IPD', value: 'I' },
]
const bottomBtns = ['SECU', 'RENT']

// Treats
const allTreats = ref<any[]>([])
const viewPages = ref<any[]>([])
const activeGroup = ref('')
const activeTreat = ref<number|null>(null)
const expandedGroups = ref<Set<string>>(new Set())

// Image viewer
const viewerOpen = ref(false)
const viewerIdx = ref(0)
const vZoom = ref(1)
const vRotate = ref(0)
const viewerSrc = computed(() => {
  const p = viewPages.value[viewerIdx.value]
  return p ? `/api/image/${p.PAGENO}?ext=${p.EXTENSION||'jpg'}` : ''
})
const viewerLabel = computed(() => {
  const p = viewPages.value[viewerIdx.value]
  return p ? `หน้า ${p.PAGE} — ${p.FORMCODE}` : ''
})

// OCR Print panel
const showOcrPanel = ref(false)
const ocrGubun = ref('ALL')
const ocrSearch = ref('')
const loadingOcr = ref(false)
const ocrPrinting = ref(false)
const ocrLoadingPdf = ref(false)
const allOcrForms = ref<any[]>([])
const selectedOcrForm = ref<any>(null)
const pdfPreviewUrl = ref('')
const showReasonModal = ref(false)
const reprintReasons = ref<any[]>([])
const selectedReason = ref('')
const pendingOcrPreview = ref(false)

const ocrTabs = [
  { label: 'Dept', value: 'D' },
  { label: 'User', value: 'U' },
  { label: 'All',  value: 'ALL' },
]

const filteredOcrForms = computed(() => {
  const kw = ocrSearch.value.toLowerCase().trim()
  // deduplicate by FORMCODE
  const seen = new Set<string>()
  const deduped = allOcrForms.value.filter(f => {
    if (seen.has(f.FORMCODE)) return false
    seen.add(f.FORMCODE)
    return true
  })
  if (!kw) return deduped
  return deduped.filter(f =>
    f.FORMCODE?.toLowerCase().includes(kw) || f.FORMNAME?.toLowerCase().includes(kw)
  )
})

// Load OCR forms when panel opens
watch(showOcrPanel, async (v) => {
  if (v && allOcrForms.value.length === 0) {
    await Promise.all([loadOcrForms(), loadReprintReasons()])
  }
})

async function loadOcrForms() {
  loadingOcr.value = true
  try {
    const res = await api.get('/ocrprint/setup', { params: { gubun: ocrGubun.value } })
    allOcrForms.value = res.data
  } catch (e) { console.error(e) }
  finally { loadingOcr.value = false }
}

async function loadReprintReasons() {
  try {
    const res = await api.get('/ocrprint/reasons')
    reprintReasons.value = res.data
  } catch (e) { console.error(e) }
}

async function changeOcrGubun(g: string) {
  ocrGubun.value = g
  selectedOcrForm.value = null
  await loadOcrForms()
}

async function doOcrPrint(preview: boolean) {
  if (!selectedOcrForm.value) return
  pendingOcrPreview.value = preview
  if (preview) {
      await executeOcrPrint(true, '')
      return
    }
  const ocmNum = viewerOcmNum.value
  try {
    const res = await api.get('/ocrprint/checkreprint', {
      params: { ocmNum, formCode: selectedOcrForm.value.FORMCODE }
    })
    if (res.data.reprinted) {
      selectedReason.value = ''
      showReasonModal.value = true
      return
    }
  } catch (e) { console.error(e) }
  await executeOcrPrint(preview, '')
}

async function confirmOcrPrint() {
  if (!selectedReason.value) return
  showReasonModal.value = false
  await executeOcrPrint(pendingOcrPreview.value, selectedReason.value)
}

async function executeOcrPrint(preview: boolean, reason: string) {
    console.log('viewerOcmNum:', viewerOcmNum.value)
  if (!selectedOcrForm.value) return
  if (preview) {
    ocrLoadingPdf.value = true
    try {
      pdfPreviewUrl.value = `/api/ocrprint/pdf/${encodeURIComponent(selectedOcrForm.value.FORMCODE)}`
    } finally { ocrLoadingPdf.value = false }
  } else {
    ocrPrinting.value = true
    try {
      const today = new Date().toISOString().substring(0,10).replace(/-/g,'')
      await api.post('/ocrprint/print', {
        formCode: selectedOcrForm.value.FORMCODE,
        ocmNum: viewerOcmNum.value,
        outDate: today,
        patId: viewerPatient.value?.PATID || '',
        inDate: today,
        clinCode: '',
        docCode: '',
        reason,
        patType: activeFilter.value === 'I' ? 'I' : 'O',
        treatNo: viewerTreatNo.value?.toString() || '', //Arty 20260610
      })
      await dlgAlert('บันทึกคำสั่งพิมพ์สำเร็จ', { type: 'success' })
    } catch (e: any) {
      await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
    } finally { ocrPrinting.value = false }
  }
}

// Reset groups on filter change
watch(() => activeFilter.value, () => {
  expandedGroups.value = new Set()
  activeGroup.value = ''
  activeTreat.value = null
  viewPages.value = []
})

interface TreatGroup {
  formCode: string; formName: string; totalCnt: number; treats: any[]
}

const filteredTreats = computed(() =>
  activeFilter.value === 'ALL' ? allTreats.value : allTreats.value.filter(t => t.CLASS === activeFilter.value)
)

const filteredGroups = computed<TreatGroup[]>(() => {
  const map = new Map<string, TreatGroup>()
  filteredTreats.value.forEach(t => {
    const formCodes = t._formCodes as string[] || []
    formCodes.forEach(fc => {
      if (!map.has(fc)) map.set(fc, { formCode: fc, formName: t._formNames?.[fc] || fc, totalCnt: 0, treats: [] })
      const g = map.get(fc)!
      g.totalCnt += t._formCntMap?.[fc] || 0
      if (!g.treats.find((x: any) => x.TREATNO === t.TREATNO)) g.treats.push({ ...t, CNT: t._formCntMap?.[fc] || 0 })
    })
  })
  return Array.from(map.values()).sort((a, b) => b.totalCnt - a.totalCnt)
})

const activeGroupName = computed(() => {
  const g = filteredGroups.value.find(x => x.formCode === activeGroup.value)
  return g ? `${g.formName} [${g.totalCnt}]` : ''
})

// Store selected treat's OCMNUM for OCR Print
const viewerOcmNum = ref('')
const viewerTreatNo = ref<number|null>(null)

async function loadTreats(hn: string, treat?: any) {
  loading.value = true
  allTreats.value = []; expandedGroups.value = new Set()
  activeGroup.value = ''; activeTreat.value = null; viewPages.value = []
  // store ocmnum from selected treat
  if (treat) {
    viewerOcmNum.value = (treat.ocmNum || treat.vstNum || treat.admNum || '').trim()
    viewerTreatNo.value = treat.treatNo
  } else {
    viewerOcmNum.value = ''
    viewerTreatNo.value = null
  }
  try {
    const treats = await api.get('/viewer/treatments', { params: { hn } }).then(r => r.data)
    const enhanced = await Promise.all(treats.map(async (t: any) => {
      const pages = await api.get('/chartpages/' + t.TREATNO).then(r => r.data)
      const formCntMap: Record<string, number> = {}
      const formNames: Record<string, string> = {}
      pages.forEach((p: any) => {
        formCntMap[p.formCode] = (formCntMap[p.formCode] || 0) + 1
        if (p.formName) formNames[p.formCode] = p.formName
      })
      return { ...t, _formCodes: Object.keys(formCntMap), _formCntMap: formCntMap, _formNames: formNames }
    }))
    allTreats.value = enhanced
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function selectGroup(g: TreatGroup) {
  if (expandedGroups.value.has(g.formCode)) expandedGroups.value.delete(g.formCode)
  else expandedGroups.value.add(g.formCode)
  expandedGroups.value = new Set(expandedGroups.value)
  activeGroup.value = g.formCode; activeTreat.value = null
  loadingPages.value = true; viewPages.value = []
  try {
    const hn = viewerPatient.value?.PATID || ''
    const pages = await api.get('/viewer/pages', { params: { hn, formCode: g.formCode, classFilter: activeFilter.value } }).then(r => r.data)
    viewPages.value = pages
  } catch (e) { console.error(e) }
  finally { loadingPages.value = false }
}

async function selectTreat(formCode: string, t: any) {
  activeGroup.value = formCode; activeTreat.value = t.TREATNO
  loadingPages.value = true; viewPages.value = []
  try {
    const pages = await api.get('/viewer/pages/treat', { params: { treatNo: t.TREATNO, formCode } }).then(r => r.data)
    viewPages.value = pages
  } catch (e) { console.error(e) }
  finally { loadingPages.value = false }
}

function openViewer(idx: number) { viewerIdx.value = idx; vZoom.value = 1; vRotate.value = 0; viewerOpen.value = true }
function navViewer(dir: number) {
  const next = viewerIdx.value + dir
  if (next >= 0 && next < viewPages.value.length) { viewerIdx.value = next; vZoom.value = 1; vRotate.value = 0 }
}

function onKeydown(e: KeyboardEvent) {
  if (pdfPreviewUrl.value && e.key === 'Escape') { pdfPreviewUrl.value = ''; return }
  if (!viewerOpen.value) return
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); navViewer(1) }
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); navViewer(-1) }
  else if (e.key === 'Escape') { viewerOpen.value = false }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

function formatDate(d: string) {
  if (!d || d.length < 8) return d || '-'
  return `${d.substring(6,8)}-${d.substring(4,6)}-${d.substring(0,4)}`
}

async function onHnSearch(hn: string) {
  lastHn.value = hn; notFound.value = false; viewerPatient.value = null
  if (!hn) return
  const found = await patientStore.findByHn(hn)
  if (!found) { notFound.value = true; return }
  pendingPatient.value = found
  // load all treats (no filter) for modal
  loadingTreats.value = true
  showTreatModal.value = true
  try {
    const res = await api.get('/treatments', { params: { hn: found.PATID } })
    allTreatsModal.value = res.data
    if (allTreatsModal.value.length === 0) {
      showTreatModal.value = false
      await dlgAlert('ไม่พบข้อมูลการรักษาของผู้ป่วยรายนี้', { type: 'warning' })
      pendingPatient.value = null
    }
  } catch (e) { console.error(e); showTreatModal.value = false }
  finally { loadingTreats.value = false }
}

async function onPatientSelected(p: Patient) {
  hnInputer.value?.setValue(p.PATID)
  lastHn.value = p.PATID.trim(); notFound.value = false
  pendingPatient.value = p
  loadingTreats.value = true
  showTreatModal.value = true
  try {
    const res = await api.get('/treatments', { params: { hn: p.PATID } })
    allTreatsModal.value = res.data
    if (allTreatsModal.value.length === 0) {
      showTreatModal.value = false
      await dlgAlert('ไม่พบข้อมูลการรักษาของผู้ป่วยรายนี้', { type: 'warning' })
      pendingPatient.value = null
    }
  } catch (e) { console.error(e); showTreatModal.value = false }
  finally { loadingTreats.value = false }
}

async function confirmTreat() {
  if (!selectedTreat.value || !pendingPatient.value) return
  console.log('selectedTreat:', JSON.stringify(selectedTreat.value))
  showTreatModal.value = false
  viewerPatient.value = pendingPatient.value
  await loadTreats(pendingPatient.value.PATID, selectedTreat.value)
  pendingPatient.value = null
}

function cancelTreatModal() {
  showTreatModal.value = false
  pendingPatient.value = null
  selectedTreat.value = null
  hnInputer.value?.resetSilent()
  lastHn.value = ''
}

function clearAll() {
  viewerPatient.value = null
  hnInputer.value?.resetSilent()
  lastHn.value = ''; notFound.value = false
  allTreats.value = []; viewPages.value = []
  activeGroup.value = ''; activeTreat.value = null
  expandedGroups.value = new Set()
  viewerOcmNum.value = ''; viewerTreatNo.value = null
  selectedTreat.value = null
}
</script>

<style scoped>
.viewer-btn {
  background: rgba(255,255,255,0.12); border: none; color: white;
  padding: 0.35rem 0.65rem; border-radius: 0.375rem;
  font-size: 0.875rem; cursor: pointer; transition: background 0.15s;
}
.viewer-btn:hover { background: rgba(255,255,255,0.28); }
.viewer-btn-dark {
  background: rgba(0,0,0,0.08); border: 1px solid #e5e7eb; color: #374151;
  padding: 0.35rem 0.65rem; border-radius: 0.375rem;
  font-size: 0.875rem; cursor: pointer; transition: background 0.15s;
}
.viewer-btn-dark:hover { background: rgba(0,0,0,0.15); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-right-enter-active, .slide-right-leave-active { transition: all 0.2s ease; }
.slide-right-enter-from, .slide-right-leave-to { opacity: 0; transform: translateX(20px); }
.treat-th { background: #1a4f7a; color: white; padding: 0.4rem 0.5rem; text-align: left; font-size: 0.7rem; font-weight: 500; white-space: nowrap; }
.treat-td { padding: 0.3rem 0.5rem; border-bottom: 1px solid #f3f4f6; font-size: 0.7rem; }
</style>