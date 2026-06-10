<template>
  <div class="flex gap-4 h-[calc(100vh-115px)]">

    <!-- Left panel: Filter + Form list -->
    <div class="card flex flex-col w-80 flex-shrink-0 min-h-0">
      <div class="card-header"><i class="bi bi-printer" /> OCR Print</div>

      <!-- Filter tabs: Dept / User / All -->
      <div class="flex border-b border-gray-200 px-2 pt-2 gap-1 flex-shrink-0">
        <button
          v-for="tab in filterTabs" :key="tab.value"
          class="px-3 py-1.5 text-xs font-semibold rounded-t-lg border-b-2 transition-colors"
          :class="activeGubun === tab.value
            ? 'border-[#1a4f7a] text-[#1a4f7a] bg-blue-50'
            : 'border-transparent text-gray-500 hover:text-[#1a4f7a]'"
          @click="changeGubun(tab.value)"
        >{{ tab.label }}</button>
      </div>

      <!-- Search -->
      <div class="p-2 flex-shrink-0">
        <input v-model="searchKw" type="text" class="form-input text-xs py-1" placeholder="ค้นหาฟอร์ม..." />
      </div>

      <!-- Form list -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="loading" class="flex justify-center py-8"><span class="loading-spinner" /></div>
        <div v-else-if="filteredForms.length === 0" class="empty-state py-8">
          <i class="bi bi-inbox text-2xl block mb-2" />
          <p class="text-xs">ไม่พบข้อมูล</p>
        </div>
        <div
          v-for="f in filteredForms" :key="f.FORMCODE"
          class="flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-gray-100 hover:bg-blue-50 transition-colors text-xs"
          :class="selectedForm?.FORMCODE === f.FORMCODE ? 'bg-blue-100 text-blue-800 font-semibold' : 'text-gray-700'"
          @click="selectForm(f)"
        >
          <i class="bi bi-file-earmark-text text-gray-400 flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <div class="font-mono text-[10px] text-gray-400">{{ f.FORMCODE }}</div>
            <div class="truncate">{{ f.FORMNAME }}</div>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="p-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
        <button class="btn-primary flex-1 justify-center text-xs py-1.5 gap-1"
          :disabled="!selectedForm || printing" @click="doPrint(false)">
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
              <option v-for="r in reprintReasons" :key="r.DtlCod" :value="r.DtlCod">
                {{ r.DtlCodNam }}
              </option>
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { useDialog } from '@/composables/useDialog'
const { alert: dlgAlert, confirm: dlgConfirm } = useDialog()

const authStore = useAuthStore()

const filterTabs = [
  { label: 'Dept', value: 'D' },
  { label: 'User', value: 'U' },
  { label: 'All',  value: 'ALL' },
]

const activeGubun  = ref('ALL')
const searchKw     = ref('')
const loading      = ref(false)
const loadingPdf   = ref(false)
const printing     = ref(false)
const allForms     = ref<any[]>([])
const selectedForm = ref<any>(null)
const pdfUrl       = ref('')
const showReasonModal  = ref(false)
const reprintReasons   = ref<any[]>([])
const selectedReason   = ref('')
const pendingPreview   = ref(false)

const filteredForms = computed(() => {
  const kw = searchKw.value.toLowerCase().trim()
  if (!kw) return allForms.value
  return allForms.value.filter(f =>
    f.FORMCODE?.toLowerCase().includes(kw) || f.FORMNAME?.toLowerCase().includes(kw)
  )
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
  await loadForms()
}

function selectForm(f: any) {
  selectedForm.value = f
  pdfUrl.value = ''
}

async function doPrint(preview: boolean) {
  if (!selectedForm.value) return
  pendingPreview.value = preview

  // check reprint
  const ocmNum = selectedForm.value.FORMCODE
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

  await executePrint(preview, '')
}

async function confirmPrint() {
  if (!selectedReason.value) return
  showReasonModal.value = false
  await executePrint(pendingPreview.value, selectedReason.value)
}

async function executePrint(preview: boolean, reason: string) {
  if (!selectedForm.value) return
  if (preview) {
    loadingPdf.value = true
    try {
      pdfUrl.value = `/api/ocrprint/pdf/${encodeURIComponent(selectedForm.value.FORMCODE)}`
    } finally { loadingPdf.value = false }
  } else {
    printing.value = true
    try {
      const today = new Date().toISOString().substring(0,10).replace(/-/g,'')
      await api.post('/ocrprint/print', {
        formCode: selectedForm.value.FORMCODE,
        ocmNum: '', outDate: today,
        patId: '', inDate: today, clinCode: '', docCode: '',
        reason, patType: 'O',
      })
      await dlgAlert('บันทึกคำสั่งพิมพ์สำเร็จ', { type: 'success' })
    } catch (e: any) {
      await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
    } finally { printing.value = false }
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
