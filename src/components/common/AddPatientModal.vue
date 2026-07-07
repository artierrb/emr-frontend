<template>
  <BaseModal
    :model-value="modelValue"
    title="เพิ่มข้อมูลผู้ป่วย"
    icon="bi-person-plus"
    width="480px"
    :z-index="7000"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <div>
        <label class="form-label">HN <span class="text-red-500">*</span></label>
        <HnInputer ref="hnInputer" :is-sep="patientStore.hnConfig.hnSep === 'Y'" :searchable="false" />
      </div>
      <div>
        <label class="form-label">ชื่อ-สกุล <span class="text-red-500">*</span></label>
        <input v-model="form.name" type="text" class="form-input w-full" maxlength="64" />
      </div>
      <div>
        <label class="form-label">เพศ</label>
        <EMRCombobox
          v-model="form.sex"
          :options="sexOptions"
          :selected-label="sexSelectedLabel"
          placeholder="-- เลือก --"
          leading-icon="bi bi-gender-ambiguous"
          clearable
        />
      </div>
      <div>
        <label class="form-label">เลขบัตรประชาชน</label>
        <input v-model="form.jumiNno" type="text" class="form-input w-full" maxlength="13" />
      </div>
      <div>
        <label class="form-label">วันเกิด</label>
        <EMRDatePicker v-model="form.birthDate" placeholder="วว/ดด/ปปปป" />
      </div>
    </div>

    <template #footer>
      <button class="btn-outline" @click="emit('update:modelValue', false)">ยกเลิก</button>
      <button class="btn-primary gap-1" :disabled="saving" @click="save">
        <i class="bi bi-check-lg" /> บันทึก
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useDialog } from '@/composables/useDialog'
const { alert: dlgAlert, confirm: dlgConfirm } = useDialog()
import { usePatientStore } from '@/stores/patient'
import { patientApi } from '@/services/api'
import BaseModal from './BaseModal.vue'
import HnInputer from './HnInputer.vue'
import EMRDatePicker from '@/components/common/EMRDatePicker.vue'
import EMRCombobox from '@/components/common/EMRCombobox.vue'
import type { ComboOption } from '@/components/common/EMRCombobox.vue'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
}>()

const patientStore = usePatientStore()
const hnInputer = ref<InstanceType<typeof HnInputer>>()
const saving = ref(false)
const form = reactive({ name: '', sex: '', jumiNno: '', birthDate: '' })

// เพศ → EMRCombobox (static)
const sexOptions: ComboOption[] = [
  { value: 'M', label: 'M - Male' },
  { value: 'F', label: 'F - Female' },
]
const sexSelectedLabel = computed(() =>
  sexOptions.find(o => o.value === form.sex)?.label || ''
)

async function save() {
  const hn = hnInputer.value?.hnValue?.trim()
  if (!hn) { await dlgAlert('กรุณากรอก HN', { type: 'warning' }); return }
  if (!form.name.trim()) { await dlgAlert('กรุณากรอกชื่อ', { type: 'warning' }); return }

  saving.value = true
  try {
    // EMRDatePicker เก็บค่าเป็น yyyyMMdd อยู่แล้ว ส่งตรงได้เลย
    const birthDate = form.birthDate || ''
    await patientApi.insert({
      patId: hn,  // HnInputer returns 8-char padded value
      name: form.name,
      sex: form.sex,
      jumiNno: form.jumiNno,
      birthDate,
      userId: 'DEMO',
    })
    emit('saved')
  } catch (e: any) {
    await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
  } finally {
    saving.value = false
  }
}
</script>