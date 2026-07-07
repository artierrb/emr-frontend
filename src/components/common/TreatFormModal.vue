<template>
  <BaseModal
    :model-value="modelValue"
    title="เพิ่มแฟ้มผู้ป่วย"
    icon="bi-folder-plus"
    width="560px"
    :z-index="6000"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="tf-body">

      <!-- HN highlight -->
      <div class="tf-hn">
        <div class="tf-hn-icon"><i class="bi bi-person-vcard" /></div>
        <div class="tf-hn-meta">
          <span class="tf-hn-label">HN ผู้ป่วย</span>
          <span class="tf-hn-value">{{ hnDisplay || '—' }}</span>
        </div>
        <div v-if="patientName" class="tf-hn-name">
          <i class="bi bi-person-fill" />
          <span>{{ patientName }}</span>
        </div>
      </div>

      <!-- Section: ข้อมูลการรักษา -->
      <div class="tf-section">
        <div class="tf-section-title">
          <i class="bi bi-clipboard2-pulse" /> ข้อมูลการรักษา
        </div>

        <div class="tf-grid">
          <!-- วันที่ลงทะเบียน -->
          <div class="tf-field tf-col-2">
            <label class="tf-label">วันที่ลงทะเบียน <span class="tf-req">*</span></label>
            <EMRDatePicker v-model="form.inDateRaw" placeholder="วว/ดด/ปปปป" />
          </div>

          <!-- แผนก -->
          <div class="tf-field tf-col-2">
            <label class="tf-label">แผนก (DEPT)</label>
            <EMRCombobox
              v-model="form.clinCode"
              :selected-label="form.clinName ? `${form.clinCode} - ${form.clinName}` : ''"
              :search-fn="searchClinicFn"
              leading-icon="bi bi-building"
              placeholder="ค้นหาแผนก..."
              empty-text="พิมพ์ชื่อหรือรหัสแผนก"
              @change="onClinicChange"
            />
          </div>

          <!-- แพทย์ -->
          <div class="tf-field tf-col-2">
            <label class="tf-label">แพทย์</label>
            <EMRCombobox
              v-model="form.docCode"
              :selected-label="form.docName ? `${form.docCode} - ${form.docName}` : ''"
              :search-fn="searchUserFn"
              leading-icon="bi bi-person-badge"
              placeholder="ค้นหาแพทย์ / ผู้ใช้..."
              empty-text="พิมพ์ ID หรือชื่อ"
              @change="onUserChange"
            />
          </div>

          <!-- ประเภท -->
          <div class="tf-field tf-col-1">
            <label class="tf-label">ประเภท <span class="tf-req">*</span></label>
            <EMRCombobox
              v-model="form.classType"
              :options="classOptions"
              :clearable="false"
              leading-icon="bi bi-hospital"
              placeholder="เลือกประเภท"
            />
          </div>

          <!-- VN / AN -->
          <div class="tf-field tf-col-1">
            <label class="tf-label">{{ form.classType === 'O' ? 'VN (Visit No.)' : 'AN (Admission No.)' }}</label>
            <div class="tf-input-wrap">
              <i class="bi bi-hash tf-input-lead" />
              <input v-model="form.vnAn" type="text" class="tf-input" maxlength="10"
                :placeholder="form.classType === 'O' ? 'เลข Visit' : 'เลข Admission'" />
            </div>
          </div>
        </div>
      </div>

    </div>

    <template #footer>
      <button class="btn-outline" @click="emit('update:modelValue', false)">ยกเลิก</button>
      <button class="btn-primary gap-1" :disabled="saving" @click="save">
        <span v-if="saving" class="loading-spinner !w-4 !h-4 !border-white/40 !border-t-white" />
        <i v-else class="bi bi-check-lg" /> บันทึก
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useDialog } from '@/composables/useDialog'
const { alert: dlgAlert, confirm: dlgConfirm } = useDialog()
import BaseModal from './BaseModal.vue'
import EMRDatePicker from './EMRDatePicker.vue'
import EMRCombobox, { type ComboOption } from './EMRCombobox.vue'
import { clinicApi, userApi, treatApi } from '@/services/api'
import { usePatientStore } from '@/stores/patient'

const props = defineProps<{
  modelValue: boolean
  hn: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
}>()

const patientStore = usePatientStore()

const saving = ref(false)

// ─── HN display ตาม HNSEP (แสดงผลเท่านั้น — ค่า save ใช้ props.hn เต็ม) ───
const hnDisplay = computed(() => {
  const raw = (props.hn || '').trim()
  if (!raw) return ''
  if (patientStore.hnConfig.hnSep === 'Y') {
    const padded = raw.padStart(8, ' ')
    const year = padded.slice(0, 2).trim()
    const rest = padded.slice(2).trim()
    return `${year}-${rest}`
  }
  return raw
})

// ─── ชื่อผู้ป่วย (ดึงจาก store — ฟอร์มนี้เปิดจากผู้ป่วยที่เลือกไว้) ───
const patientName = computed(() => patientStore.selectedPatient?.NAME?.trim() ?? '')

// ─── ประเภท OPD/IPD (static options) ───
const classOptions: ComboOption[] = [
  { value: 'O', label: 'OPD (ผู้ป่วยนอก)' },
  { value: 'I', label: 'IPD (ผู้ป่วยใน)' },
]

const form = reactive({
  inDateRaw: dateToDbToday(), // YYYYMMDD (DB format ที่ EMRDatePicker ใช้)
  clinCode: '',
  clinName: '',
  docCode: '',
  docName: '',
  classType: 'O',
  vnAn: '',
})

function dateToDbToday(): string {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

// reset form when modal opens
watch(() => props.modelValue, (v) => {
  if (v) {
    form.inDateRaw = dateToDbToday()
    form.clinCode = ''; form.clinName = ''
    form.docCode = ''; form.docName = ''
    form.classType = 'O'; form.vnAn = ''
  }
})

// ─── Combobox search functions (ใช้ API เดิม) ───
async function searchClinicFn(kw: string): Promise<ComboOption[]> {
  const rows = await clinicApi.search(kw)
  return (rows ?? []).map((c: any) => ({ value: c.CLINCODE, label: c.NAME, code: c.CLINCODE }))
}

async function searchUserFn(kw: string): Promise<ComboOption[]> {
  const rows = await userApi.search(kw)
  return (rows ?? []).map((u: any) => ({ value: u.USERID, label: u.NAME, code: u.USERID }))
}

function onClinicChange(_v: string | null, opt: ComboOption | null) {
  form.clinCode = opt?.value ?? ''
  form.clinName = opt?.label ?? ''
}

function onUserChange(_v: string | null, opt: ComboOption | null) {
  form.docCode = opt?.value ?? ''
  form.docName = opt?.label ?? ''
}

async function save() {
  if (!form.inDateRaw) { await dlgAlert('กรุณาเลือกวันที่ลงทะเบียน', { type: 'warning' }); return }
  const inDate = form.inDateRaw // EMRDatePicker ส่งมาเป็น YYYYMMDD อยู่แล้ว
  saving.value = true
  try {
    await treatApi.insert({
      patId: props.hn.padEnd(10, ' '),
      inDate,
      clinCode: form.clinCode,
      docCode: form.docCode,
      classType: form.classType,
      vstNum: form.classType === 'O' ? form.vnAn : '',
      admNum: form.classType === 'I' ? form.vnAn : '',
      userId: 'DEMO',
    })
    emit('saved')
    emit('update:modelValue', false)
  } catch (e: any) {
    await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.tf-body { display: flex; flex-direction: column; gap: 20px; }

/* ── HN highlight ── */
.tf-hn {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 16px;
  border-radius: var(--cis-radius-md, 12px);
  background: linear-gradient(135deg, var(--cis-primary-soft, #e3edf7) 0%, #eef4fb 100%);
  border: 1px solid #d5e3f2;
}
.tf-hn-icon {
  width: 44px; height: 44px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px;
  background: var(--cis-primary, #2563a8); color: #fff; font-size: 1.3rem;
  box-shadow: 0 4px 10px rgba(37,99,168,.28);
}
.tf-hn-meta { display: flex; flex-direction: column; line-height: 1.3; }
.tf-hn-label { font-size: .72rem; font-weight: 600; color: var(--cis-primary, #2563a8); letter-spacing: .02em; }
.tf-hn-value {
  font-size: 1.25rem; font-weight: 700; color: var(--cis-primary-strong, #17385f);
  font-family: 'SF Mono','Consolas',monospace; font-variant-numeric: tabular-nums; letter-spacing: .03em;
}
.tf-hn-name {
  margin-left: auto;
  display: flex; align-items: center; gap: 8px;
  padding-left: 16px;
  border-left: 1px solid #cdddee;
  font-size: 1rem; font-weight: 600; color: var(--cis-text-primary, #1e293b);
}
.tf-hn-name i { color: var(--cis-primary, #2563a8); font-size: 1.05rem; }

/* ── Section ── */
.tf-section {
  border: 1px solid var(--cis-border, #e2e8f0);
  border-radius: var(--cis-radius-md, 12px);
  padding: 16px;
  background: #fff;
}
.tf-section-title {
  display: flex; align-items: center; gap: 7px;
  font-size: .8rem; font-weight: 700; color: var(--cis-text-secondary, #475569);
  margin-bottom: 14px; padding-bottom: 10px;
  border-bottom: 1px solid #f1f5f9;
}
.tf-section-title i { color: var(--cis-primary, #2563a8); font-size: .95rem; }

/* ── Grid ── */
.tf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.tf-col-2 { grid-column: span 2; }
.tf-col-1 { grid-column: span 1; }
.tf-field { display: flex; flex-direction: column; }

.tf-label {
  font-size: .8rem; font-weight: 600; color: var(--cis-text-secondary, #475569);
  margin-bottom: 6px;
}
.tf-req { color: var(--cis-danger, #dc2626); }

/* ── plain input (VN/AN) ── */
.tf-input-wrap {
  display: flex; align-items: center;
  min-height: 40px;
  border: 1px solid var(--cis-border, #e2e8f0);
  border-radius: var(--cis-radius-sm, 8px);
  background: #fff; padding: 0 10px;
  transition: border-color .15s, box-shadow .15s;
}
.tf-input-wrap:focus-within {
  border-color: var(--cis-primary, #2563a8);
  box-shadow: 0 0 0 3px var(--cis-primary-soft, #e3edf7);
}
.tf-input-lead { color: var(--cis-text-muted, #64748b); font-size: .9rem; margin-right: 6px; }
.tf-input {
  flex: 1; min-width: 0; height: 38px;
  border: none; outline: none; background: transparent;
  font-size: .875rem; color: var(--cis-text-primary, #1e293b);
  font-variant-numeric: tabular-nums;
}
.tf-input::placeholder { color: #94a3b8; }

@media (max-width: 560px) {
  .tf-grid { grid-template-columns: 1fr; }
  .tf-col-2, .tf-col-1 { grid-column: span 1; }
}
</style>
