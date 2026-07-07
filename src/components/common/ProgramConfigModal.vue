<template>
  <BaseModal
    :model-value="modelValue"
    title="Program Configuration"
    icon="bi-gear"
    width="680px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="flex gap-2 mb-4">
      <div class="relative flex-1">
        <input
          v-model="search"
          type="text"
          class="form-input w-full pr-8"
          placeholder="ค้นหา..."
          @keydown.enter="load"
        />
        <button
          v-if="search"
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          title="ล้างคำค้นหา"
          @click="clearSearch"
        ><i class="bi bi-x-lg text-xs" /></button>
      </div>
      <button class="btn-primary gap-1" @click="load">
        <i class="bi bi-search" /> ค้นหา
      </button>
      <span class="text-xs text-gray-400 self-center">{{ items.length }} รายการ</span>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <span class="loading-spinner" />
    </div>

    <table v-else class="w-full text-sm border-collapse">
      <thead>
        <tr>
          <th class="bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-500 border-b border-gray-200 w-1/2">
            Question
          </th>
          <th class="bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-500 border-b border-gray-200">
            Answer
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.DtlCod" class="hover:bg-gray-50">
          <td class="px-3 py-2 border-b border-gray-100 text-gray-500 text-xs">
            {{ labelOf(item.DtlCodNam) }}
          </td>
          <td class="px-3 py-2 border-b border-gray-100">
            <select
              v-if="optionsOf(item.DtlCodNam).length > 0"
              v-model="item.DtlCodVal"
              class="form-select text-xs py-1"
            >
              <option v-for="opt in optionsOf(item.DtlCodNam)" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
            <input
              v-else
              v-model="item.DtlCodVal"
              type="text"
              class="form-input text-xs py-1"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <template #footer>
      <button class="btn-outline" @click="emit('update:modelValue', false)">ยกเลิก</button>
      <button class="btn-primary gap-1" :disabled="saving" @click="save">
        <i class="bi bi-save" /> Save
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import api from '@/services/api'
import { useDialog } from '@/composables/useDialog'
const { alert: dlgAlert, confirm: dlgConfirm } = useDialog()

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const search = ref('')
const items = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)

watch(() => props.modelValue, (v) => {
  if (v) load()
  else { search.value = ''; items.value = [] }   // เคลียร์ค่าเมื่อปิด modal
})

// ล้างคำค้นหาแล้วโหลดใหม่
function clearSearch() {
  search.value = ''
  load()
}

async function load() {
  loading.value = true
  try {
    const res = await api.get('/config', { params: { search: search.value } })
    items.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function labelOf(name: string) {
  const idx = (name || '').indexOf('|')
  return idx >= 0 ? name.substring(0, idx).trim() : (name || '').trim()
}

function optionsOf(name: string): string[] {
  const idx = (name || '').indexOf('|')
  if (idx < 0) return []
  return name.substring(idx + 1).split('|').map(s => s.trim()).filter(Boolean)
}

async function save() {
  saving.value = true
  try {
    const payload = items.value.map(i => ({ dtlCod: i.DtlCod, dtlCodVal: i.DtlCodVal }))
    await api.post('/config/save?userId=DEMO', payload)
    emit('update:modelValue', false)
    // reload หน้าโปรแกรม 1 ครั้งหลัง save config
    setTimeout(() => window.location.reload(), 300)
  } catch (e) {
    console.error(e)
    await dlgAlert('บันทึกล้มเหลว', { type: 'error' })
  } finally {
    saving.value = false
  }
}
</script>