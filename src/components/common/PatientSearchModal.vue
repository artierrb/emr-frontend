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
    <div v-else-if="isSearchMode && displayRows.length === 0" class="empty-state">
      <i class="bi bi-inbox text-3xl block mb-2" />
      <p>ไม่พบข้อมูล</p>
    </div>
    <div v-else-if="displayRows.length === 0" class="empty-state">
      <i class="bi bi-people text-3xl block mb-2" />
      <p>ไม่มีข้อมูลผู้ป่วย</p>
    </div>
    <template v-else>
      <table class="result-table">
        <thead>
          <tr><th>HN</th><th>ชื่อ-สกุล</th><th>เลขบัตร</th><th>อายุ</th></tr>
        </thead>
        <tbody>
          <tr
            v-for="p in displayRows"
            :key="p.PATID"
            class="clickable"
            @click="select(p)"
          >
            <td class="font-mono">{{ formatHn(p.PATID) }}</td>
            <td>{{ p.NAME }}</td>
            <td class="text-sm text-gray-500">{{ p.JUMINNO }}</td>
            <td>{{ calcAge(p.BIRTHDATE) }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination (list mode เท่านั้น) -->
      <div v-if="!isSearchMode && store.listPages > 1"
        class="flex items-center justify-between mt-3 text-sm">
        <span class="text-gray-500">
          ทั้งหมด {{ store.listTotal.toLocaleString() }} คน ·
          หน้า {{ store.listPage + 1 }} / {{ store.listPages }}
        </span>
        <div class="flex items-center gap-1">
          <button class="pg-btn" :disabled="store.listPage <= 0"
            @click="goPage(0)" title="หน้าแรก">
            <i class="bi bi-chevron-double-left" />
          </button>
          <button class="pg-btn" :disabled="store.listPage <= 0"
            @click="goPage(store.listPage - 1)" title="ก่อนหน้า">
            <i class="bi bi-chevron-left" />
          </button>
          <button
            v-for="pg in pageWindow" :key="pg"
            class="pg-btn"
            :class="pg === store.listPage ? 'pg-btn-active' : ''"
            @click="goPage(pg)"
          >{{ pg + 1 }}</button>
          <button class="pg-btn" :disabled="store.listPage >= store.listPages - 1"
            @click="goPage(store.listPage + 1)" title="ถัดไป">
            <i class="bi bi-chevron-right" />
          </button>
          <button class="pg-btn" :disabled="store.listPage >= store.listPages - 1"
            @click="goPage(store.listPages - 1)" title="หน้าสุดท้าย">
            <i class="bi bi-chevron-double-right" />
          </button>
        </div>
      </div>
    </template>
  </BaseModal>

  <AddPatientModal v-model="showAdd" @saved="onPatientAdded" />
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { usePatientStore } from '@/stores/patient'
import type { Patient } from '@/types'
import BaseModal from './BaseModal.vue'
import AddPatientModal from './AddPatientModal.vue'
import HnInputer from './HnInputer.vue'

const props = defineProps<{ modelValue: boolean }>()
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

// อยู่โหมดค้นหาเมื่อผู้ใช้ค้นหาแล้ว (มี searched=true) ไม่งั้นเป็นโหมด list ทั้งหมด
const isSearchMode = computed(() => searched.value)
const displayRows = computed(() =>
  isSearchMode.value ? store.searchResults : store.listResults
)

// หน้าต่างเลขหน้า แสดงรอบๆ หน้าปัจจุบัน (สูงสุด 5 ปุ่ม)
const pageWindow = computed(() => {
  const total = store.listPages
  const cur = store.listPage
  const win = 5
  let start = Math.max(0, cur - Math.floor(win / 2))
  let end = Math.min(total, start + win)
  start = Math.max(0, end - win)
  const arr: number[] = []
  for (let i = start; i < end; i++) arr.push(i)
  return arr
})

// แสดง HN ตาม HNSEP
function formatHn(patid: string) {
  const raw = patid || ''
  if (store.hnConfig.hnSep === 'Y') {
    const padded = raw.padEnd(8, ' ')
    return `${padded.substring(0, 2).trim()}-${padded.substring(2).trim()}`
  }
  return raw.trim()
}

// เปิด modal → โหลดหน้าแรกของ list ทั้งหมด
watch(() => props.modelValue, (open) => {
  if (open) {
    searched.value = false
    store.clearSearch()
    store.loadPatientPage(0)
  }
})

function goPage(pg: number) {
  if (pg < 0 || pg >= store.listPages) return
  store.loadPatientPage(pg)
}

function onFieldChange() {
  // clear ค่าเมื่อเปลี่ยน field → กลับโหมด list
  keyword.value = ''
  hnInputer.value?.resetSilent()
  store.clearSearch()
  searched.value = false
}

async function onHnSearch(hn: string) {
  const val = hn.trim()
  if (!val) { backToList(); return }
  await store.searchPatient('PATID', val)
  searched.value = true
}

async function doSearch() {
  if (!keyword.value.trim()) { backToList(); return }
  await store.searchPatient(searchField.value, keyword.value)
  searched.value = true
}

// กลับสู่โหมด list ทั้งหมด (เมื่อล้างคำค้น)
function backToList() {
  store.clearSearch()
  searched.value = false
  if (store.listResults.length === 0) store.loadPatientPage(0)
}

function select(patient: Patient) {
  store.selectPatient(patient)
  emit('selected', patient)
  emit('update:modelValue', false)
  store.clearSearch()
  store.clearList()
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
  // รีเฟรช: ถ้ากำลังค้นหาให้ค้นซ้ำ ไม่งั้นรีโหลด list หน้าปัจจุบัน
  if (searched.value && keyword.value) doSearch()
  else store.loadPatientPage(store.listPage)
}
</script>

<style scoped>
.pg-btn {
  min-width: 2rem; height: 2rem; padding: 0 0.4rem;
  display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid var(--cis-border, #e2e8f0); border-radius: 0.375rem;
  background: #fff; color: var(--cis-text-secondary, #475569);
  font-size: 0.8rem; cursor: pointer; transition: all 0.15s;
}
.pg-btn:hover:not(:disabled) {
  border-color: var(--cis-primary, #2563a8);
  color: var(--cis-primary, #2563a8);
  background: var(--cis-primary-soft, #e3edf7);
}
.pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pg-btn-active {
  background: var(--cis-primary, #2563a8);
  border-color: var(--cis-primary, #2563a8);
  color: #fff; font-weight: 600;
}
.pg-btn-active:hover { color: #fff; background: var(--cis-primary, #2563a8); }
</style>