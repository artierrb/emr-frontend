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
        <HnInputer ref="hnInputer" :is-sep="patientStore.hnConfig.hnSep === 'Y'" />
      </div>
      <div>
        <label class="form-label">ชื่อ-สกุล <span class="text-red-500">*</span></label>
        <input v-model="form.name" type="text" class="form-input w-full" maxlength="64" />
      </div>
      <div>
        <label class="form-label">เพศ</label>
        <select v-model="form.sex" class="form-select w-full">
          <option value="">-- เลือก --</option>
          <option value="M">M - Male</option>
          <option value="F">F - Female</option>
        </select>
      </div>
      <div>
        <label class="form-label">เลขบัตรประชาชน</label>
        <input v-model="form.jumiNno" type="text" class="form-input w-full" maxlength="13" />
      </div>
      <div>
        <label class="form-label">วันเกิด</label>
        <input v-model="form.birthDate" type="date" class="form-input w-full" />
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
import { ref, reactive } from 'vue'
import { useDialog } from '@/composables/useDialog'
const { alert: dlgAlert, confirm: dlgConfirm } = useDialog()
import { usePatientStore } from '@/stores/patient'
import { patientApi } from '@/services/api'
import BaseModal from './BaseModal.vue'
import HnInputer from './HnInputer.vue'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
}>()

const patientStore = usePatientStore()
const hnInputer = ref<InstanceType<typeof HnInputer>>()
const saving = ref(false)
const form = reactive({ name: '', sex: '', jumiNno: '', birthDate: '' })

async function save() {
  const hn = hnInputer.value?.hnValue?.trim()
  if (!hn) { await dlgAlert('กรุณากรอก HN', { type: 'warning' }); return }
  if (!form.name.trim()) { await dlgAlert('กรุณากรอกชื่อ', { type: 'warning' }); return }

  saving.value = true
  try {
    const birthDate = form.birthDate ? form.birthDate.replace(/-/g, '') : ''
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
