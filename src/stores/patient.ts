import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { patientApi } from '@/services/api'
import type { Patient, HnConfig } from '@/types'

export const usePatientStore = defineStore('patient', () => {
  const hnConfig = ref<HnConfig>({ hnSep: 'N' })
  const selectedPatient = ref<Patient | null>(null)
  const searchResults = ref<Patient[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ─── โหมดโหลดทั้งหมดแบบแบ่งหน้า (PatientSearchModal) ───────────
  const listResults = ref<Patient[]>([])
  const listPage    = ref(0)      // หน้าปัจจุบัน (เริ่มที่ 0)
  const listPages   = ref(0)      // จำนวนหน้าทั้งหมด
  const listTotal   = ref(0)      // จำนวนผู้ป่วยทั้งหมด
  const listSize    = ref(100)    // ต่อหน้า

  // ─── Viewer shared state ───────────────────────────────────
  const viewerPatient  = ref<Patient | null>(null)
  const viewerOcmNum   = ref('')
  const viewerTreatNo  = ref<number | null>(null)
  const viewerLastHn   = ref('')
  const viewerNotFound = ref(false)

  function setViewerTreat(patient: Patient, treat: any) {
    viewerPatient.value  = patient
    viewerOcmNum.value   = (treat.ocmNum || treat.vstNum || treat.admNum || '').trim()
    viewerTreatNo.value  = treat.treatNo ?? null
    viewerLastHn.value   = patient.PATID.trim()
    viewerNotFound.value = false
  }

  function clearViewer() {
    viewerPatient.value  = null
    viewerOcmNum.value   = ''
    viewerTreatNo.value  = null
    viewerLastHn.value   = ''
    viewerNotFound.value = false
  }
  // ──────────────────────────────────────────────────────────

  const patientAge = computed(() => {
    if (!selectedPatient.value?.BIRTHDATE) return '-'
    const year = parseInt(selectedPatient.value.BIRTHDATE.substring(0, 4))
    return `${new Date().getFullYear() - year} ปี`
  })

  async function loadHnConfig() {
    try {
      hnConfig.value = await patientApi.getHnConfig()
    } catch {
      hnConfig.value = { hnSep: 'N' }
    }
  }

  async function searchPatient(field: string, keyword: string) {
    loading.value = true
    error.value = null
    try {
      searchResults.value = await patientApi.search(field, keyword)
    } catch (e: any) {
      error.value = e.message
      searchResults.value = []
    } finally {
      loading.value = false
    }
  }

  // โหลดผู้ป่วยทั้งหมดแบบแบ่งหน้า (order by PATID) — page เริ่มที่ 0
  async function loadPatientPage(page = 0) {
    loading.value = true
    error.value = null
    try {
      const res = await patientApi.list(page, listSize.value)
      listResults.value = res.data
      listPage.value    = res.page
      listPages.value   = res.pages
      listTotal.value   = res.total
      listSize.value    = res.size
    } catch (e: any) {
      error.value = e.message
      listResults.value = []
      listPages.value = 0
      listTotal.value = 0
    } finally {
      loading.value = false
    }
  }

  function clearList() {
    listResults.value = []
    listPage.value = 0
    listPages.value = 0
    listTotal.value = 0
  }

  async function findByHn(hn: string): Promise<Patient | null> {
    try {
      // sync HIS เฉพาะ HN นี้ก่อน (exec SP 2 ตัว) แล้วค่อยหาคนไข้
      // ส่ง hn เข้าไปแบบเต็ม (padded) ไม่ trim เพราะ SP ต้องการ HN padded 8 หลัก
      const results = await patientApi.syncFind(hn)
      return results.find(p => p.PATID.trim() === hn.trim()) ?? null
    } catch {
      return null
    }
  }

  function selectPatient(patient: Patient) {
    selectedPatient.value = patient
  }

  function clearPatient() {
    selectedPatient.value = null
  }

  function clearSearch() {
    searchResults.value = []
  }

  return {
    hnConfig, selectedPatient, searchResults, loading, error, patientAge,
    loadHnConfig, searchPatient, findByHn, selectPatient, clearPatient, clearSearch,
    // list mode (แบ่งหน้า)
    listResults, listPage, listPages, listTotal, listSize, loadPatientPage, clearList,
    // viewer shared
    viewerPatient, viewerOcmNum, viewerTreatNo, viewerLastHn, viewerNotFound,
    setViewerTreat, clearViewer,
  }
})