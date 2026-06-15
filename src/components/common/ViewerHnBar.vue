<template>
  <div class="flex items-center gap-2">
    <!-- Patient info (when selected) -->
    <div v-if="patientStore.viewerPatient" class="flex items-center gap-2 text-gray-700">
      <div class="flex flex-col leading-tight">
        <span class="text-xs font-semibold text-[#1a4f7a]">{{ patientStore.viewerPatient.NAME?.trim() }}</span>
        <span class="text-[10px] text-gray-400">HN: {{ patientStore.viewerLastHn }}</span>
      </div>
      <!-- ปุ่ม clear — ซ่อนใน OCS mode (กันหลุด ปิดได้อย่างเดียว) -->
      <button v-if="!authStore.ocsMode" class="text-gray-400 hover:text-red-500 transition-colors" @click="clearViewer" title="ล้างผู้ป่วย">
        <i class="bi bi-x-circle" />
      </button>
    </div>

    <!-- HN inputer — ซ่อนทั้งแถบใน OCS mode (มาจาก OCS ระบุคนไข้แล้ว ห้ามค้นใหม่) -->
    <template v-if="!authStore.ocsMode">
      <div class="flex items-center gap-1">
        <input
          ref="mainInput"
          v-model="mainValue"
          type="text"
          :maxlength="8"
          :placeholder="patientStore.hnConfig.hnSep === 'Y' ? 'ปี+HN' : 'HN 8 หลัก'"
          class="form-input text-xs py-1 w-32 font-mono"
          :class="notFound ? 'border-red-400' : ''"
          @keydown.enter.prevent="onEnter"
        />
        <template v-if="patientStore.hnConfig.hnSep === 'Y'">
          <span class="text-gray-400 text-xs">-</span>
          <input v-model="yearValue" type="text" maxlength="2" readonly tabindex="-1"
            class="form-input text-xs py-1 w-10 font-mono bg-gray-50" />
        </template>
        <button class="btn-outline px-2 py-1 text-xs gap-1 whitespace-nowrap" @click="showSearch = true" title="ค้นหา">
          <i class="bi bi-person-search" /> ค้นหา
        </button>
      </div>

      <span v-if="searching" class="loading-spinner" />
      <span v-if="notFound" class="text-red-500 text-xs">ไม่พบ HN</span>
    </template>
  </div>

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
            <div v-if="loadingTreats" class="flex justify-center py-10"><span class="loading-spinner" /></div>
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
                <tr v-if="allTreats.length === 0">
                  <td colspan="7" class="text-center py-6 text-gray-400">ไม่พบข้อมูล</td>
                </tr>
                <tr v-for="t in allTreats" :key="t.treatNo"
                  class="cursor-pointer hover:bg-blue-50 transition-colors"
                  :class="selectedTreat?.treatNo === t.treatNo ? 'bg-blue-100' : ''"
                  @click="selectedTreat = t"
                  @dblclick="selectedTreat = t; confirmTreat()">
                  <td class="treat-td text-center font-bold" :class="t.classType === 'I' ? 'text-blue-700' : 'text-green-700'">{{ t.classType }}</td>
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
              <button class="btn-outline" @click="cancelTreat">ยกเลิก</button>
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
import { ref } from 'vue'
import { usePatientStore } from '@/stores/patient'
import { useAuthStore } from '@/stores/auth'
import PatientSearchModal from '@/components/common/PatientSearchModal.vue'
import api from '@/services/api'
import { useDialog } from '@/composables/useDialog'
import type { Patient } from '@/types'

const patientStore = usePatientStore()
const authStore = useAuthStore()
const { alert: dlgAlert } = useDialog()

const mainInput   = ref<HTMLInputElement>()
const mainValue   = ref('')
const yearValue   = ref('')
const searching   = ref(false)
const notFound    = ref(false)
const showSearch  = ref(false)
const showTreatModal = ref(false)
const allTreats   = ref<any[]>([])
const loadingTreats = ref(false)
const selectedTreat = ref<any>(null)
const pendingPatient = ref<Patient | null>(null)

const emit = defineEmits<{ 'treatSelected': [] }>()

function computeHn() {
  if (patientStore.hnConfig.hnSep === 'Y') {
    const yr = yearValue.value.trim()
    const hn = mainValue.value.trim()
    if (!yr && !hn) return ''
    return yr + hn.padStart(6, ' ')
  }
  const hn = mainValue.value.trim()
  return hn ? hn.padStart(8, ' ') : ''
}

async function onEnter() {
  if (patientStore.hnConfig.hnSep === 'Y' && mainValue.value.length >= 3) {
    yearValue.value = mainValue.value.substring(0, 2)
    mainValue.value = mainValue.value.substring(2)
  }
  // ส่ง HN แบบ padded เต็ม (ไม่ trim) ให้ findByHn → SP sync
  const hn = computeHn()
  if (!hn.trim()) return
  await searchHn(hn)
}

async function searchHn(hn: string) {
  notFound.value = false
  searching.value = true
  try {
    const found = await patientStore.findByHn(hn)
    if (!found) { notFound.value = true; return }
    await openTreatModal(found)
  } finally { searching.value = false }
}

async function onPatientSelected(p: Patient) {
  if (patientStore.hnConfig.hnSep === 'Y') {
    yearValue.value = p.PATID.substring(0, 2)
    mainValue.value = p.PATID.substring(2).trimStart()
  } else {
    mainValue.value = p.PATID.trimStart()
  }
  await openTreatModal(p)
}

async function openTreatModal(patient: Patient) {
  pendingPatient.value = patient
  loadingTreats.value = true
  showTreatModal.value = true
  selectedTreat.value = null
  try {
    const res = await api.get('/treatments', { params: { hn: patient.PATID } })
    allTreats.value = res.data
    if (allTreats.value.length === 0) {
      showTreatModal.value = false
      await dlgAlert('ไม่พบข้อมูลการรักษาของผู้ป่วยรายนี้', { type: 'warning' })
      pendingPatient.value = null
    }
  } catch (e) { console.error(e); showTreatModal.value = false }
  finally { loadingTreats.value = false }
}

function confirmTreat() {
  if (!selectedTreat.value || !pendingPatient.value) return
  patientStore.setViewerTreat(pendingPatient.value, selectedTreat.value)
  showTreatModal.value = false
  pendingPatient.value = null
  emit('treatSelected')
}

function cancelTreat() {
  showTreatModal.value = false
  pendingPatient.value = null
  selectedTreat.value = null
}

function clearViewer() {
  mainValue.value = ''
  yearValue.value = ''
  notFound.value = false
  patientStore.clearViewer()
  emit('treatSelected')
}

function formatDate(d: string) {
  if (!d || d.length < 8) return d || '-'
  return `${d.substring(6,8)}-${d.substring(4,6)}-${d.substring(0,4)}`
}
</script>

<style scoped>
.treat-th { background: #1a4f7a; color: white; padding: 0.4rem 0.5rem; text-align: left; font-size: 0.7rem; font-weight: 500; white-space: nowrap; }
.treat-td { padding: 0.3rem 0.5rem; border-bottom: 1px solid #f3f4f6; font-size: 0.7rem; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>