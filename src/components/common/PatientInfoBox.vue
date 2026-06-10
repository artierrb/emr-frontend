<template>
  <Transition name="slide-down">
    <div
      v-if="patient"
      :class="[
        'flex items-center gap-3 px-3 py-2 rounded-lg border text-sm mt-2',
        notFound
          ? 'bg-red-50 border-red-200 text-red-700'
          : 'bg-green-50 border-green-200 text-green-800'
      ]"
    >
      <i :class="['bi text-base', notFound ? 'bi-exclamation-circle-fill' : 'bi-person-fill']" />
      <div class="flex-1">
        <template v-if="notFound">
          <span class="font-medium">ไม่พบข้อมูลผู้ป่วย HN: {{ hn }}</span>
        </template>
        <template v-else>
          <div class="font-semibold">{{ patient.NAME }}</div>
          <div class="text-xs text-gray-500">
            HN: {{ patient.PATID.trim() }} &nbsp;|&nbsp; อายุ: {{ age }}
          </div>
        </template>
      </div>
      <button
        type="button"
        class="text-gray-400 hover:text-gray-600 ml-auto"
        @click="emit('clear')"
      >
        <i class="bi bi-x-circle" />
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Patient } from '@/types'

const props = defineProps<{
  patient: Patient | null
  hn?: string
  notFound?: boolean
}>()

const emit = defineEmits<{ clear: [] }>()

const age = computed(() => {
  if (!props.patient?.BIRTHDATE) return '-'
  const year = parseInt(props.patient.BIRTHDATE.substring(0, 4))
  return `${new Date().getFullYear() - year} ปี`
})
</script>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
