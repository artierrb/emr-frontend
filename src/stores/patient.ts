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

  async function findByHn(hn: string): Promise<Patient | null> {
    try {
      const results = await patientApi.search('PATID', hn)
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
  }
})
