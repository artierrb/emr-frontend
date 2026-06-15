export interface Patient {
  PATID: string
  NAME: string
  SEX: string
  JUMINNO: string
  BIRTHDATE: string
  AGE: number
}

export interface Form {
  formCode: string
  name: string
  grpMid: string
  grpCode: string
  active: string
  ocrYn: string
  pageCount: number
}

export interface Treatment {
  treatNo: number
  patId: string
  inDate: string
  clinCode: string
  docCode: string
  classType: string
  ocmNum: string
  ward: string
  vstNum: string
  admNum: string
}

export interface TreatmentFull {
  TREATNO: number
  PATID: string
  CLASS: string
  CLINCODE: string
  CLINNAME: string
  INDATE: string
  OUTDATE: string
  DOCCODE: string
  DOCNAME: string
  CHECKED: string
  CHECKED2: string
  CHECKED3: string
  CHKDATE: string
  CHKUSRID: string
  CHKDATE2: string
  CHK2USRID: string
  CHKDATE3: string
  CHK3USRID: string
  VSTNUM: string
  ADMNUM: string
  CNT: number
}

export interface ChartPage {
  pageNo: number
  treatNo: number
  formCode: string
  formName: string
  page: number
  cDate: string
  extension: string
  filePath: string
}

export interface ScanUploadResult {
  success: boolean
  pageNo: number
  message: string
  error?: string
}

export interface HnConfig {
  hnSep: 'Y' | 'N'
}

// ─── OCR Return ─────────────────────────────────────────────
export interface OcrReturnRow {
  PATID: string
  NAME: string
  VN: string
  DEPTCODE: string
  INDATE: string
  INTIME: string
  SCANYN: string
  OCRPK: string
  FORMNAME: string
  PAGECOUNT: string
  CLASS: string
  BIGO: string
}

export interface Clinic {
  CLINCODE: string
  NAME: string
}

export interface FormGroup {
  GRPCODE: string
  NAME: string
}
