import axios from 'axios'
import type { Patient, Form, Treatment, ChartPage, ScanUploadResult, HnConfig } from '@/types'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// ─── Patient ──────────────────────────────────────────────────
export const patientApi = {
  getHnConfig: () =>
    api.get<HnConfig>('/patient/config').then(r => r.data),

  search: (field: string, keyword: string) =>
    api.get<Patient[]>('/patient/search', { params: { field, keyword } }).then(r => r.data),

  insert: (data: {
    patId: string; name: string; sex: string
    jumiNno: string; birthDate: string; userId: string
  }) => api.post('/patient/insert', data).then(r => r.data),
}

// ─── Forms ────────────────────────────────────────────────────
export const formApi = {
  getAll: () =>
    api.get<Form[]>('/forms').then(r => r.data),
}

// ─── Config ───────────────────────────────────────────────────
export const configApi = {
  getPrgMode: () =>
    api.get<{ prgMode: string }>('/config/prgmode').then(r => r.data.prgMode),
}

// ─── Clinic / User search ────────────────────────────────────
export const clinicApi = {
  search: (keyword: string) =>
    api.get('/clinic/search', { params: { keyword } }).then(r => r.data),
}

export const userApi = {
  search: (keyword: string) =>
    api.get('/user/search', { params: { keyword } }).then(r => r.data),
}

// ─── Treatments full ─────────────────────────────────────────
export const treatApi = {
  getFull: (hn: string) =>
    api.get('/treatments/full', { params: { hn } }).then(r => r.data),

  insert: (data: Record<string, string>) =>
    api.post('/treatments/insert', data).then(r => r.data),

  delete: (treatNo: number) =>
    api.delete(`/treatments/${treatNo}`).then(r => r.data),

  updateCheck: (treatNo: number, checkNo: number, value: string, userId = 'DEMO') =>
    api.post('/treatments/check', { treatNo: String(treatNo), checkNo: String(checkNo), value, userId }).then(r => r.data),

  getFormCount: (treatNo: number) =>
    api.get('/treatments/formcount', { params: { treatNo } }).then(r => r.data),
}

// ─── Scan ─────────────────────────────────────────────────────
export const scanApi = {
  upload: (formData: FormData) =>
    api.post<ScanUploadResult>('/scan/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),
}

// ─── Viewer ───────────────────────────────────────────────────
export const viewerApi = {
  getTreatments: (hn: string) =>
    api.get<Treatment[]>('/treatments', { params: { hn } }).then(r => r.data),

  getChartPages: (treatNo: number) =>
    api.get<ChartPage[]>(`/chartpages/${treatNo}`).then(r => r.data),

  getImageUrl: (pageNo: number, ext: string) =>
    `/api/image/${pageNo}?ext=${ext}`,

  movePages: (pageNos: number[], newFormCode: string) =>
    api.post('/chartpages/move', { pageNos, newFormCode }).then(r => r.data),
}

export default api
