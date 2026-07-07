<template>
  <div class="flex gap-4 h-[calc(100vh-115px)]">

    <!-- Left panel -->
    <div class="card flex flex-col w-80 flex-shrink-0 min-h-0">
      <div class="card-header"><i class="bi bi-printer" /> OCR Print</div>

      <!-- Patient info -->
      <div v-if="patientStore.viewerPatient" class="px-3 py-2 border-b border-gray-100 bg-blue-50 text-xs flex-shrink-0">
        <div class="font-semibold text-[#1a4f7a]">{{ patientStore.viewerPatient.NAME?.trim() }}</div>
        <div class="text-gray-500">HN: {{ patientStore.viewerLastHn }}
          <span v-if="patientStore.viewerOcmNum" class="ml-2">OcmNum: {{ patientStore.viewerOcmNum }}</span>
        </div>
      </div>
      <div v-else class="px-3 py-2 border-b border-gray-100 bg-amber-50 text-xs text-amber-700 flex-shrink-0">
        <i class="bi bi-exclamation-triangle mr-1" />กรุณาค้นหาผู้ป่วยจากแถบด้านบนก่อน
      </div>

      <!-- Filter tabs -->
      <div class="flex border-b border-gray-200 px-2 pt-2 gap-1 flex-shrink-0">
        <button v-for="tab in filterTabs" :key="tab.value"
          class="px-3 py-1.5 text-xs font-semibold rounded-t-lg border-b-2 transition-colors"
          :class="activeGubun === tab.value
            ? 'border-[#1a4f7a] text-[#1a4f7a] bg-blue-50'
            : 'border-transparent text-gray-500 hover:text-[#1a4f7a]'"
          @click="changeGubun(tab.value)">{{ tab.label }}</button>
      </div>

      <!-- Search + (User) add-doc button -->
      <div class="p-2 flex-shrink-0 space-y-2">
        <div class="relative">
          <input v-model="searchKw" type="text"
            class="form-input text-xs py-1 pr-7" placeholder="ค้นหาฟอร์ม..." />
          <button v-if="searchKw" type="button"
            class="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="ล้างการค้นหา" @click="clearSearch">
            <i class="bi bi-x-lg text-[10px]" />
          </button>
        </div>
        <button v-if="activeGubun === 'U' || activeGubun === 'D'"
          class="btn-outline w-full justify-center text-xs py-1.5 gap-1"
          @click="openAddDocModal">
          <i class="bi bi-plus-circle" /> เพิ่ม/ลบ เอกสาร
        </button>
      </div>

      <!-- Form list (Group -> Form tree) -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="loading" class="flex justify-center py-8"><span class="loading-spinner" /></div>
        <div v-else-if="filteredGroups.length === 0" class="empty-state py-8">
          <i class="bi bi-inbox text-2xl block mb-2" /><p class="text-xs">ไม่พบข้อมูล</p>
        </div>
        <template v-else v-for="grp in filteredGroups" :key="grp.code">
          <!-- Group header -->
          <div
            class="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors sticky top-0 z-10"
            @click="toggleGroup(grp.code)">
            <i class="bi text-xs text-gray-400"
              :class="expandedGroups.has(grp.code) ? 'bi-chevron-down' : 'bi-chevron-right'" />
            <i class="bi text-base text-blue-400"
              :class="expandedGroups.has(grp.code) ? 'bi-folder2-open' : 'bi-folder-fill'" />
            <span class="text-xs font-semibold text-gray-600 flex-1 truncate">{{ grp.name }}</span>
            <span class="text-[11px] text-gray-400 min-w-[24px] text-right">[{{ grp.forms.length }}]</span>
          </div>
          <!-- Forms under group -->
          <template v-if="expandedGroups.has(grp.code)">
            <div v-for="f in grp.forms" :key="f.FORMCODE"
              class="flex items-center gap-2 pl-8 pr-3 py-2 cursor-pointer border-b border-gray-100 last:border-0 hover:bg-blue-50 transition-colors text-xs"
              :class="selectedForm?.FORMCODE === f.FORMCODE ? 'bg-blue-100 text-blue-800 font-semibold' : 'text-gray-700'"
              @click="selectForm(f)">
              <i class="bi bi-file-earmark-text text-gray-300 flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <div class="font-mono text-[10px] text-gray-400">{{ f.FORMCODE }}</div>
                <div class="truncate">{{ f.FORMNAME }}</div>
              </div>
            </div>
          </template>
        </template>
      </div>

      <!-- Action buttons -->
      <div class="p-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
        <button class="btn-primary flex-1 justify-center text-xs py-1.5 gap-1"
          :disabled="!selectedForm || printing || !patientStore.viewerPatient" @click="doPrint(false)">
          <span v-if="printing" class="loading-spinner" />
          <i v-else class="bi bi-printer" /> Print
        </button>
        <button class="btn-outline flex-1 justify-center text-xs py-1.5 gap-1"
          :disabled="!selectedForm || loadingPdf" @click="doPrint(true)">
          <span v-if="loadingPdf" class="loading-spinner" />
          <i v-else class="bi bi-eye" /> Preview
        </button>
      </div>
    </div>

    <!-- Right panel: PDF viewer -->
    <div class="card flex flex-col flex-1 min-h-0">
      <div class="card-header">
        <i class="bi bi-file-pdf" />
        {{ selectedForm ? selectedForm.FORMNAME : 'เลือกฟอร์มด้านซ้าย' }}
        <span v-if="selectedForm" class="ml-2 text-xs text-gray-400 font-normal">{{ selectedForm.FORMCODE }}</span>
      </div>
      <div class="flex-1 min-h-0">
        <div v-if="!pdfUrl" class="empty-state h-full">
          <i class="bi bi-file-earmark-pdf text-4xl block mb-3" />
          <p>เลือกฟอร์มแล้วกด Preview</p>
        </div>
        <iframe v-else :src="pdfUrl" class="w-full h-full border-0 rounded-b-xl" type="application/pdf" />
      </div>
    </div>
  </div>

  <!-- Reprint reason modal -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showReasonModal" class="fixed inset-0 z-[8000] flex items-center justify-center">
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
        <div class="relative bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden">
          <div class="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
            <i class="bi bi-exclamation-triangle-fill text-amber-500" />
            <span class="font-semibold text-sm">เคยสั่งพิมพ์แล้ว — กรุณาระบุเหตุผล</span>
          </div>
          <div class="px-5 py-4 space-y-2">
            <p class="text-xs text-gray-500">ฟอร์ม <strong>{{ selectedForm?.FORMCODE }}</strong> เคยถูกพิมพ์ไปแล้ว</p>
            <select v-model="selectedReason" class="form-select text-sm">
              <option value="">-- กรุณาเลือกเหตุผล --</option>
              <option v-for="r in reprintReasons" :key="r.DtlCod" :value="r.DtlCod">{{ r.DtlCodNam }}</option>
            </select>
          </div>
          <div class="px-5 py-3 border-t border-gray-100 flex gap-2 justify-end">
            <button class="btn-outline" @click="showReasonModal=false">ยกเลิก</button>
            <button class="btn-primary gap-1" :disabled="!selectedReason" @click="confirmPrint">
              <i class="bi bi-printer" /> ยืนยัน
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Add-document modal (User tab) -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showAddDocModal" class="fixed inset-0 z-[8000] flex items-center justify-center">
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="showAddDocModal=false" />
        <div class="relative bg-white rounded-2xl shadow-2xl w-[520px] max-h-[80vh] flex flex-col overflow-hidden">
          <!-- header -->
          <div class="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-[#1a4f7a] to-[#2563a8] text-white flex-shrink-0">
            <i class="bi bi-folder-plus" />
            <span class="font-semibold text-sm flex-1">
              แก้ไขรายการเอกสาร
              <span class="font-normal text-white/70 text-xs">
                ({{ activeGubun === 'D' ? 'ระดับแผนก' : 'ระดับผู้ใช้' }})
              </span>
            </span>
            <button class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              @click="showAddDocModal=false">
              <i class="bi bi-x-lg text-xs" />
            </button>
          </div>

          <!-- search inside modal -->
          <div class="px-5 pt-4 pb-2 flex-shrink-0">
            <div class="relative">
              <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input v-model="modalSearchKw" type="text"
                class="form-input text-sm py-2 pl-8 pr-8" placeholder="     ค้นหาเอกสาร..." />
              <button v-if="modalSearchKw" type="button"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                @click="modalSearchKw=''">
                <i class="bi bi-x-lg text-[10px]" />
              </button>
            </div>
            <div class="mt-2 text-[11px] text-gray-400">
              เลือกแล้ว <span class="font-semibold text-[#1a4f7a]">{{ checkedFormCodes.size }}</span> รายการ
            </div>
          </div>

          <!-- list -->
          <div class="flex-1 overflow-y-auto px-3 pb-2 min-h-[240px]">
            <div v-if="modalLoading" class="flex justify-center py-10"><span class="loading-spinner" /></div>
            <div v-else-if="filteredDocOptions.length === 0" class="empty-state py-10">
              <i class="bi bi-inbox text-2xl block mb-2" /><p class="text-xs">ไม่พบเอกสาร</p>
            </div>
            <label v-else v-for="opt in filteredDocOptions" :key="opt.FORMCODE"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer border border-transparent hover:bg-blue-50 transition-colors"
              :class="checkedFormCodes.has(opt.FORMCODE) ? 'bg-blue-50/60' : ''">
              <input type="checkbox" class="w-4 h-4 accent-[#1a4f7a] flex-shrink-0"
                :checked="checkedFormCodes.has(opt.FORMCODE)"
                :disabled="togglingForm === opt.FORMCODE"
                @change="onToggleDoc(opt)" />
              <div class="flex-1 min-w-0">
                <div class="text-sm text-gray-700 truncate">{{ opt.FORMNAME }}</div>
                <div class="font-mono text-[10px] text-gray-400">{{ opt.FORMCODE }}</div>
              </div>
              <span v-if="togglingForm === opt.FORMCODE" class="loading-spinner flex-shrink-0" />
              <i v-else-if="checkedFormCodes.has(opt.FORMCODE)"
                class="bi bi-check-circle-fill text-[#1a4f7a] flex-shrink-0" />
            </label>
          </div>

          <!-- footer -->
          <div class="px-5 py-3 border-t border-gray-100 flex justify-end flex-shrink-0">
            <button class="btn-primary gap-1" @click="closeAddDocModal">
              <i class="bi bi-check2" /> เสร็จสิ้น
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { usePatientStore } from '@/stores/patient'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { useDialog } from '@/composables/useDialog'

const patientStore = usePatientStore()
const authStore = useAuthStore()
const { alert: dlgAlert } = useDialog()

const filterTabs = [
  { label: 'Dept', value: 'D' },
  { label: 'User', value: 'U' },
  { label: 'All',  value: 'ALL' },
]

const activeGubun     = ref('ALL')
const searchKw        = ref('')
const loading         = ref(false)
const loadingPdf      = ref(false)
const printing        = ref(false)
const allForms        = ref<any[]>([])
const selectedForm    = ref<any>(null)
const pdfUrl          = ref('')
const showReasonModal = ref(false)
const reprintReasons  = ref<any[]>([])
const selectedReason  = ref('')
const pendingPreview  = ref(false)
const expandedGroups  = ref<Set<string>>(new Set())

// ── Add-document modal (User tab) ──
const showAddDocModal = ref(false)
const modalLoading    = ref(false)
const modalSearchKw   = ref('')
const docOptions      = ref<any[]>([])
const checkedFormCodes = ref<Set<string>>(new Set())
const togglingForm    = ref('')

// จัด forms เป็น group -> forms (เหมือนหน้า ScanView) พร้อม filter ตามคำค้น
const filteredGroups = computed(() => {
  const kw = searchKw.value.toLowerCase().trim()
  const forms = kw
    ? allForms.value.filter(f =>
        f.FORMCODE?.toLowerCase().includes(kw) || f.FORMNAME?.toLowerCase().includes(kw))
    : allForms.value

  const map = new Map<string, { code: string; name: string; forms: any[] }>()
  for (const f of forms) {
    const code = (f.GRPCODE || '').trim() || '__NOGROUP__'
    if (!map.has(code)) {
      map.set(code, {
        code,
        name: (f.GRPNAME || '').trim() || 'ไม่ระบุกลุ่ม',
        forms: [],
      })
    }
    map.get(code)!.forms.push(f)
  }
  return Array.from(map.values())
})

const filteredDocOptions = computed(() => {
  const kw = modalSearchKw.value.toLowerCase().trim()
  if (!kw) return docOptions.value
  return docOptions.value.filter(o =>
    o.FORMCODE?.toLowerCase().includes(kw) || o.FORMNAME?.toLowerCase().includes(kw))
})

// เมื่อค้นหา ให้เปิดทุก group ที่มีผลลัพธ์อัตโนมัติ
watch(searchKw, (kw) => {
  if (kw.trim()) {
    expandedGroups.value = new Set(filteredGroups.value.map(g => g.code))
  }
})

onMounted(async () => {
  await Promise.all([loadForms(), loadReasons()])
})

async function loadForms() {
  loading.value = true
  try {
    const res = await api.get('/ocrprint/setup', { params: { gubun: activeGubun.value } })
    allForms.value = res.data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function loadReasons() {
  try {
    const res = await api.get('/ocrprint/reasons')
    reprintReasons.value = res.data
  } catch (e) { console.error(e) }
}

async function changeGubun(g: string) {
  activeGubun.value = g
  selectedForm.value = null
  pdfUrl.value = ''
  searchKw.value = ''          // เคลียร์ช่องค้นหาทุกครั้งที่เปลี่ยนแถบ
  expandedGroups.value = new Set()
  await loadForms()
}

function clearSearch() {
  searchKw.value = ''
  expandedGroups.value = new Set()   // reset folder ที่ expand
}

function toggleGroup(code: string) {
  if (expandedGroups.value.has(code)) expandedGroups.value.delete(code)
  else expandedGroups.value.add(code)
  expandedGroups.value = new Set(expandedGroups.value)
}

function selectForm(f: any) {
  selectedForm.value = f
  pdfUrl.value = ''
}

// ── Add-document modal ──
async function openAddDocModal() {
  // แถบ Dept ต้องมีสิทธิ์ (auth <> '0')
  if (activeGubun.value === 'D') {
    const auth = (authStore.user?.auth || '').trim()
    if (auth === '0' || auth === '') {
      await dlgAlert('ไม่มีสิทธิ์ เฉพาะ User ตำแหน่ง Manager เท่านั้น โปรดติดต่อ Admin', { type: 'warning' })
      return
    }
  }
  showAddDocModal.value = true
  modalSearchKw.value = ''
  modalLoading.value = true
  try {
    const res = await api.get('/ocrprint/usersetup', { params: { gubun: activeGubun.value } })
    docOptions.value = res.data.forms || []
    checkedFormCodes.value = new Set(res.data.checked || [])
  } catch (e: any) {
    showAddDocModal.value = false
    await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
  } finally { modalLoading.value = false }
}

async function onToggleDoc(opt: any) {
  const formCode = opt.FORMCODE
  const willCheck = !checkedFormCodes.value.has(formCode)
  togglingForm.value = formCode
  try {
    await api.post('/ocrprint/usersetup/toggle', {
      gubun: activeGubun.value, formCode, checked: willCheck
    })
    if (willCheck) checkedFormCodes.value.add(formCode)
    else checkedFormCodes.value.delete(formCode)
    checkedFormCodes.value = new Set(checkedFormCodes.value)
  } catch (e: any) {
    await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
  } finally { togglingForm.value = '' }
}

async function closeAddDocModal() {
  showAddDocModal.value = false
  // refresh รายการฝั่งซ้ายถ้ากำลังอยู่แถบ User หรือ Dept
  if (activeGubun.value === 'U' || activeGubun.value === 'D') await loadForms()
}

async function doPrint(preview: boolean) {
  if (!selectedForm.value) return
  pendingPreview.value = preview

  if (preview) {
    loadingPdf.value = true
    try {
      pdfUrl.value = `/api/ocrprint/pdf/${encodeURIComponent(selectedForm.value.FORMCODE)}`
    } finally { loadingPdf.value = false }
    return
  }

  const ocmNum = patientStore.viewerOcmNum
  try {
    const res = await api.get('/ocrprint/checkreprint', {
      params: { ocmNum, formCode: selectedForm.value.FORMCODE }
    })
    if (res.data.reprinted) {
      selectedReason.value = ''
      showReasonModal.value = true
      return
    }
  } catch (e) { console.error(e) }

  await executePrint('')
}

async function confirmPrint() {
  if (!selectedReason.value) return
  showReasonModal.value = false
  await executePrint(selectedReason.value)
}

async function executePrint(reason: string) {
  if (!selectedForm.value) return
  printing.value = true
  try {
    const today = new Date().toISOString().substring(0,10).replace(/-/g,'')
    const res = await api.post('/ocrprint/print', {
      formCode: selectedForm.value.FORMCODE,
      ocmNum:   patientStore.viewerOcmNum,
      outDate:  today,
      patId:    patientStore.viewerPatient?.PATID || '',
      inDate:   today,
      clinCode: '', docCode: '', reason,
      patType:  'O',
      treatNo:  patientStore.viewerTreatNo?.toString() || '',
    })
    const { ocrPk, token } = res.data
    window.location.href =
      `emrprint://print?ocrPk=${encodeURIComponent(ocrPk)}&token=${encodeURIComponent(token)}`
    await dlgAlert('ส่งคำสั่งพิมพ์ไปที่เครื่องพิมพ์แล้ว', { type: 'success' })
  } catch (e: any) {
    await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
  } finally { printing.value = false }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>