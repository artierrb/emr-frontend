<template>
  <BaseModal
    :model-value="modelValue"
    title="เพิ่มแฟ้มผู้ป่วย"
    icon="bi-folder-plus"
    width="520px"
    :z-index="6000"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-4">

      <!-- HN readonly -->
      <div>
        <label class="form-label">HN</label>
        <input :value="hn" type="text" class="form-input bg-gray-50" readonly />
      </div>

      <!-- วันที่ลงทะเบียน -->
      <div>
        <label class="form-label">วันที่ลงทะเบียน <span class="text-red-500">*</span></label>
        <input v-model="form.inDateRaw" type="date" class="form-input" />
      </div>

      <!-- DEPT -->
      <div>
        <label class="form-label">แผนก (DEPT)</label>
        <div class="flex gap-2">
          <input
            :value="form.clinCode ? `${form.clinCode} - ${form.clinName}` : ''"
            type="text"
            class="form-input flex-1 bg-gray-50"
            placeholder="-- ยังไม่ได้เลือก --"
            readonly
          />
          <button class="btn-outline px-3" @click="showClinicSearch = true">
            <i class="bi bi-search" />
          </button>
          <button v-if="form.clinCode" class="btn-outline px-3 text-red-400" @click="form.clinCode = ''; form.clinName = ''">
            <i class="bi bi-x" />
          </button>
        </div>
      </div>

      <!-- DOCCODE -->
      <div>
        <label class="form-label">แพทย์</label>
        <div class="flex gap-2">
          <input
            :value="form.docCode ? `${form.docCode} - ${form.docName}` : ''"
            type="text"
            class="form-input flex-1 bg-gray-50"
            placeholder="-- ยังไม่ได้เลือก --"
            readonly
          />
          <button class="btn-outline px-3" @click="showUserSearch = true">
            <i class="bi bi-search" />
          </button>
          <button v-if="form.docCode" class="btn-outline px-3 text-red-400" @click="form.docCode = ''; form.docName = ''">
            <i class="bi bi-x" />
          </button>
        </div>
      </div>

      <!-- OPD/IPD -->
      <div>
        <label class="form-label">ประเภท <span class="text-red-500">*</span></label>
        <select v-model="form.classType" class="form-select">
          <option value="O">OPD</option>
          <option value="I">IPD</option>
        </select>
      </div>

      <!-- VN / AN -->
      <div>
        <label class="form-label">{{ form.classType === 'O' ? 'VN (Visit Number)' : 'AN (Admission Number)' }}</label>
        <input v-model="form.vnAn" type="text" class="form-input" maxlength="10" />
      </div>

    </div>

    <template #footer>
      <button class="btn-outline" @click="emit('update:modelValue', false)">ยกเลิก</button>
      <button class="btn-primary gap-1" :disabled="saving" @click="save">
        <i class="bi bi-check-lg" /> บันทึก
      </button>
    </template>
  </BaseModal>

  <!-- Clinic Search -->
  <BaseModal
    :model-value="showClinicSearch"
    title="ค้นหาแผนก"
    icon="bi-building"
    width="520px"
    :z-index="7000"
    @update:model-value="showClinicSearch = false"
  >
    <div class="flex gap-2 mb-3">
      <input v-model="clinicKw" type="text" class="form-input flex-1" placeholder="ค้นหา Code หรือ ชื่อแผนก..."
        @keydown.enter="searchClinic" />
      <button class="btn-primary gap-1" @click="searchClinic"><i class="bi bi-search" /> ค้นหา</button>
    </div>
    <div v-if="clinicLoading" class="flex justify-center py-6"><span class="loading-spinner" /></div>
    <div v-else class="overflow-y-auto" style="max-height:320px;">
      <table class="result-table">
        <thead><tr><th>Code</th><th>ชื่อแผนก</th></tr></thead>
        <tbody>
          <tr v-if="clinicResults.length === 0"><td colspan="2" class="text-center py-4 text-gray-400">ไม่พบข้อมูล</td></tr>
          <tr v-for="c in clinicResults" :key="c.CLINCODE" class="clickable" @click="selectClinic(c)">
            <td class="font-mono text-xs">{{ c.CLINCODE }}</td>
            <td>{{ c.NAME }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </BaseModal>

  <!-- User Search -->
  <BaseModal
    :model-value="showUserSearch"
    title="ค้นหาแพทย์ / ผู้ใช้"
    icon="bi-person-badge"
    width="520px"
    :z-index="7000"
    @update:model-value="showUserSearch = false"
  >
    <div class="flex gap-2 mb-3">
      <input v-model="userKw" type="text" class="form-input flex-1" placeholder="ค้นหา ID หรือ ชื่อ..."
        @keydown.enter="searchUser" />
      <button class="btn-primary gap-1" @click="searchUser"><i class="bi bi-search" /> ค้นหา</button>
    </div>
    <div v-if="userLoading" class="flex justify-center py-6"><span class="loading-spinner" /></div>
    <div v-else class="overflow-y-auto" style="max-height:320px;">
      <table class="result-table">
        <thead><tr><th>User ID</th><th>ชื่อ</th></tr></thead>
        <tbody>
          <tr v-if="userResults.length === 0"><td colspan="2" class="text-center py-4 text-gray-400">ไม่พบข้อมูล</td></tr>
          <tr v-for="u in userResults" :key="u.USERID" class="clickable" @click="selectUser(u)">
            <td class="font-mono text-xs">{{ u.USERID }}</td>
            <td>{{ u.NAME }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useDialog } from '@/composables/useDialog'
const { alert: dlgAlert, confirm: dlgConfirm } = useDialog()
import BaseModal from './BaseModal.vue'
import { clinicApi, userApi, treatApi } from '@/services/api'

const props = defineProps<{
  modelValue: boolean
  hn: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
}>()

const saving = ref(false)
const showClinicSearch = ref(false)
const showUserSearch = ref(false)
const clinicKw = ref('')
const userKw = ref('')
const clinicResults = ref<any[]>([])
const userResults = ref<any[]>([])
const clinicLoading = ref(false)
const userLoading = ref(false)

const form = reactive({
  inDateRaw: new Date().toISOString().substring(0, 10), // YYYY-MM-DD
  clinCode: '',
  clinName: '',
  docCode: '',
  docName: '',
  classType: 'O',
  vnAn: '',
})

// reset form when modal opens
watch(() => props.modelValue, (v) => {
  if (v) {
    form.inDateRaw = new Date().toISOString().substring(0, 10)
    form.clinCode = ''; form.clinName = ''
    form.docCode = ''; form.docName = ''
    form.classType = 'O'; form.vnAn = ''
    clinicKw.value = ''; userKw.value = ''
    clinicResults.value = []; userResults.value = []
  }
})

async function searchClinic() {
  clinicLoading.value = true
  try { clinicResults.value = await clinicApi.search(clinicKw.value) }
  finally { clinicLoading.value = false }
}

async function searchUser() {
  userLoading.value = true
  try { userResults.value = await userApi.search(userKw.value) }
  finally { userLoading.value = false }
}

function selectClinic(c: any) {
  form.clinCode = c.CLINCODE
  form.clinName = c.NAME
  showClinicSearch.value = false
}

function selectUser(u: any) {
  form.docCode = u.USERID
  form.docName = u.NAME
  showUserSearch.value = false
}

async function save() {
  if (!form.inDateRaw) { await dlgAlert('กรุณาเลือกวันที่ลงทะเบียน', { type: 'warning' }); return }
  const inDate = form.inDateRaw.replace(/-/g, '') // YYYYMMDD
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
