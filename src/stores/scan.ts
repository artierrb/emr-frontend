import { defineStore } from 'pinia'
import { ref } from 'vue'
import { scanApi, formApi, configApi, treatApi } from '@/services/api'
import api from '@/services/api'
import type { Form, TreatmentFull } from '@/types'

export const useScanStore = defineStore('scan', () => {
  const forms = ref<Form[]>([])
  const formGroups = ref<any[]>([])
  const selectedFormCode = ref('')
  const selectedFiles = ref<File[]>([])
  const uploading = ref(false)
  const uploadProgress = ref(0)

  const treatments = ref<TreatmentFull[]>([])
  const selectedTreatNo = ref<number | null>(null)
  const selectedTreat = ref<TreatmentFull | null>(null)
  const loadingTreatments = ref(false)
  const formCountMap = ref<Record<string, number>>({})

  const prgMode = ref<'LITE' | 'HIS'>('LITE')

  async function loadForms() {
    try { forms.value = await formApi.getAll() }
    catch (e) { console.error('Failed to load forms', e) }
  }

  async function loadFormGroups() {
    try {
      const res = await api.get('/forms/groups')
      formGroups.value = res.data
    } catch (e) {
      console.error('Failed to load form groups', e)
      formGroups.value = []
    }
  }

  async function loadPrgMode() {
    try {
      const mode = await configApi.getPrgMode()
      prgMode.value = mode === 'HIS' ? 'HIS' : 'LITE'
    } catch { prgMode.value = 'LITE' }
  }

  async function loadTreatments(hn: string) {
    if (!hn) { treatments.value = []; return }
    loadingTreatments.value = true
    selectedTreatNo.value = null
    selectedTreat.value = null
    formCountMap.value = {}
    try { treatments.value = await treatApi.getFull(hn) }
    catch (e) { console.error('Failed to load treatments', e); treatments.value = [] }
    finally { loadingTreatments.value = false }
  }

  async function selectTreatment(t: TreatmentFull) {
    selectedTreatNo.value = t.TREATNO
    selectedTreat.value = t
    try {
      const rows = await treatApi.getFormCount(t.TREATNO)
      const map: Record<string, number> = {}
      rows.forEach((r: any) => { map[r.FORMCODE] = r.CNT })
      formCountMap.value = map
    } catch (e) { formCountMap.value = {} }
  }

  async function toggleCheck(treatNo: number, checkNo: number, currentVal: string) {
    const newVal = currentVal === '1' ? '0' : '1'
    try {
      await treatApi.updateCheck(treatNo, checkNo, newVal)
      const t = treatments.value.find(x => x.TREATNO === treatNo)
      if (t) {
        if (checkNo === 1) t.CHECKED = newVal
        if (checkNo === 2) t.CHECKED2 = newVal
        if (checkNo === 3) t.CHECKED3 = newVal
      }
    } catch (e) { console.error('updateCheck failed', e) }
  }

  function clearTreatments() {
    treatments.value = []
    selectedTreatNo.value = null
    selectedTreat.value = null
    formCountMap.value = {}
  }

  function addFiles(files: File[]) {
    const allowed = ['image/jpeg', 'image/png', 'image/tiff', 'application/pdf']
    files.forEach(f => {
      if (allowed.includes(f.type) || /\.(tif|tiff)$/i.test(f.name))
        selectedFiles.value.push(f)
    })
  }

  function removeFile(index: number) { selectedFiles.value.splice(index, 1) }
  function clearFiles() { selectedFiles.value = [] }

  async function uploadAll(hn: string, formCode: string): Promise<{ success: number; fail: number }> {
    uploading.value = true
    uploadProgress.value = 0
    let success = 0, fail = 0
    for (let i = 0; i < selectedFiles.value.length; i++) {
      const file = selectedFiles.value[i]
      if (!file) continue          // กัน undefined จาก index access (strict TS)
      const fd = new FormData()
      fd.append('hn', hn)
      fd.append('formCode', formCode)
      fd.append('userId', 'DEMO')
      if (selectedTreatNo.value) fd.append('treatNo', String(selectedTreatNo.value))
      fd.append('file', file)
      try {
        const result = await scanApi.upload(fd)
        if (result.success) success++
        else fail++
      } catch { fail++ }
      uploadProgress.value = Math.round(((i + 1) / selectedFiles.value.length) * 100)
    }
    uploading.value = false
    if (success > 0) clearFiles()
    return { success, fail }
  }

  return {
    forms, formGroups, selectedFormCode, selectedFiles, uploading, uploadProgress,
    treatments, selectedTreatNo, selectedTreat, loadingTreatments, formCountMap,
    prgMode,
    loadForms, loadFormGroups, loadPrgMode, loadTreatments, selectTreatment,
    toggleCheck, clearTreatments, addFiles, removeFile, clearFiles, uploadAll,
  }
})