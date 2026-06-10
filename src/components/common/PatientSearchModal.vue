<template>
  <BaseModal
    :model-value="modelValue"
    title="ค้นหาผู้ป่วย"
    icon="bi-person-search"
    width="760px"
    :z-index="6000"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header-actions>
      <button class="btn-outline text-xs px-2 py-1 gap-1" @click="showAdd = true">
        <i class="bi bi-plus-lg" /> เพิ่มผู้ป่วย
      </button>
    </template>

    <!-- Search bar -->
    <div class="flex gap-2 mb-4 items-end">
      <select v-model="searchField" class="form-select" style="max-width:180px;" @change="onFieldChange">
        <option value="PATID">HN</option>
        <option value="NAME">ชื่อ</option>
        <option value="JUMINNO">เลขบัตรประชาชน</option>
      </select>

      <!-- HN mode: HnInputer มีปุ่มค้นหาในตัวอยู่แล้ว -->
      <div v-if="searchField === 'PATID'" class="flex-1">
        <HnInputer
          ref="hnInputer"
          :is-sep="store.hnConfig.hnSep === 'Y'"
          @search="onHnSearch"
          @open-search="() => {}"
        />
      </div>

      <!-- Other modes: plain input + search button -->
      <template v-else>
        <input
          ref="kwInput"
          v-model="keyword"
          type="text"
          class="form-input flex-1"
          placeholder="คำค้นหา..."
          @keydown.enter="doSearch"
        />
        <button class="btn-primary gap-1" @click="doSearch">
          <i class="bi bi-search" /> ค้นหา
        </button>
      </template>
    </div>

    <!-- Results -->
    <div v-if="store.loading" class="flex justify-center py-8">
      <span class="loading-spinner" />
    </div>
    <div v-else-if="store.searchResults.length === 0 && searched" class="empty-state">
      <i class="bi bi-inbox text-3xl block mb-2" />
      <p>ไม่พบข้อมูล</p>
    </div>
    <div v-else-if="store.searchResults.length === 0" class="empty-state">
      <i class="bi bi-person-search text-3xl block mb-2" />
      <p>กรอกคำค้นหาแล้วกด Enter</p>
    </div>
    <table v-else class="result-table">
      <thead>
        <tr><th>HN</th><th>ชื่อ-สกุล</th><th>เลขบัตร</th><th>อายุ</th></tr>
      </thead>
      <tbody>
        <tr
          v-for="p in store.searchResults"
          :key="p.PATID"
          class="clickable"
          @click="select(p)"
        >
          <td class="font-mono">{{ p.PATID.trim() }}</td>
          <td>{{ p.NAME }}</td>
          <td class="text-sm text-gray-500">{{ p.JUMINNO }}</td>
          <td>{{ calcAge(p.BIRTHDATE) }}</td>
        </tr>
      </tbody>
    </table>
  </BaseModal>

  <AddPatientModal v-model="showAdd" @saved="onPatientAdded" />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { usePatientStore } from '@/stores/patient'
import type { Patient } from '@/types'
import BaseModal from './BaseModal.vue'
import AddPatientModal from './AddPatientModal.vue'
import HnInputer from './HnInputer.vue'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'selected': [patient: Patient]
}>()

const store = usePatientStore()
const searchField = ref('PATID')
const keyword = ref('')
const searched = ref(false)
const showAdd = ref(false)
const kwInput = ref<HTMLInputElement>()
const hnInputer = ref<InstanceType<typeof HnInputer>>()

watch(() => store.searchResults, () => { searched.value = true })

function onFieldChange() {
  // clear ค่าเมื่อเปลี่ยน field
  keyword.value = ''
  hnInputer.value?.resetSilent()
  store.clearSearch()
  searched.value = false
}

async function onHnSearch(hn: string) {
  const val = hn.trim()
  if (!val) return
  await store.searchPatient('PATID', val)
}

async function doSearch() {
  if (!keyword.value.trim()) return
  await store.searchPatient(searchField.value, keyword.value)
}

function select(patient: Patient) {
  store.selectPatient(patient)
  emit('selected', patient)
  emit('update:modelValue', false)
  store.clearSearch()
  keyword.value = ''
  hnInputer.value?.resetSilent()
  searched.value = false
}

function calcAge(birthDate: string) {
  if (!birthDate || birthDate.length < 4) return '-'
  return `${new Date().getFullYear() - parseInt(birthDate.substring(0, 4))} ปี`
}

function onPatientAdded() {
  showAdd.value = false
  if (keyword.value) doSearch()
}
</script>
