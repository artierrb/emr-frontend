<template>
  <div class="flex gap-2 items-center">
    <input
      ref="mainInput"
      v-model="mainValue"
      type="text"
      :maxlength="isSep ? 8 : 8"
      :placeholder="isSep ? 'พิมพ์ปี+HN แล้วกด Enter' : '8 หลัก'"
      class="form-input font-mono tracking-wide"
      :class="{ 'flex-[3]': isSep }"
      @keydown.enter.prevent="onEnter"
    />
    <template v-if="isSep">
      <span class="text-gray-400">-</span>
      <input
        v-model="yearValue"
        type="text"
        maxlength="2"
        placeholder="ปี"
        readonly
        tabindex="-1"
        class="form-input font-mono flex-1 bg-gray-50"
      />
    </template>
    <button
      type="button"
      class="btn-outline px-3"
      title="ล้างค่า"
      @click="clear"
    >
      <i class="bi bi-x-circle" />
    </button>
    <button
      type="button"
      class="btn-primary px-3 gap-1"
      @click="emit('open-search')"
    >
      <i class="bi bi-person-search" />
      ค้นหา
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  isSep: boolean
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'search': [hn: string]
  'open-search': []
  'clear': []
}>()

const mainInput = ref<HTMLInputElement>()
const mainValue = ref('')
const yearValue = ref('')

const hnValue = computed(() => {
  if (props.isSep) {
    const yr = yearValue.value.trim()
    const hn = mainValue.value.trim()
    if (!yr && !hn) return ''
    // year 2 chars + hn right-aligned in 6 chars → total 8
    return yr + hn.padStart(6, ' ')
  }
  // no sep: right-aligned in 8 chars
  const hn = mainValue.value.trim()
  return hn ? hn.padStart(8, ' ') : ''
})

function onEnter() {
  if (props.isSep && mainValue.value.length >= 3) {
    // split 2 หลักแรกเป็นปี
    yearValue.value = mainValue.value.substring(0, 2)
    mainValue.value = mainValue.value.substring(2)
  }
  // ส่ง HN แบบ padded 8 หลักเต็ม (ห้าม trim) — backend/SP ต้องการ padding เพื่อ match record
  // เช่น '69     1' (แยกปี) หรือ '     123' (ไม่แยกปี)
  emit('search', hnValue.value)
}

function clear() {
  mainValue.value = ''
  yearValue.value = ''
  emit('update:modelValue', '')
  emit('clear')
  mainInput.value?.focus()
}

function setValue(patId: string) {
  // patId is 8-char padded, e.g. "67 15825" or "  461944"
  const raw = patId.padEnd(8, ' ') // ensure 8 chars
  if (props.isSep) {
    yearValue.value = raw.substring(0, 2)          // first 2 = year
    mainValue.value = raw.substring(2).trimStart() // rest, remove leading spaces
  } else {
    mainValue.value = raw.trimStart() // remove leading spaces for display
  }
}

function resetSilent() {
  mainValue.value = ''
  yearValue.value = ''
}

defineExpose({ setValue, clear, resetSilent, hnValue })
</script>