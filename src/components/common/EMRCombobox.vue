<template>
  <div class="emrcb" ref="rootRef">
    <!-- Control -->
    <div
      class="emrcb-control"
      :class="{ 'emrcb-open': isOpen, 'emrcb-disabled': disabled }"
      @click="onControlClick"
    >
      <i v-if="leadingIcon" :class="['emrcb-lead', leadingIcon]" />
      <input
        ref="inputRef"
        v-model="query"
        class="emrcb-input"
        :placeholder="displayPlaceholder"
        :disabled="disabled"
        autocomplete="off"
        @focus="onFocus"
        @input="onInput"
        @keydown="onKeydown"
      />
      <button
        v-if="modelValue && clearable && !disabled"
        type="button" class="emrcb-btn" tabindex="-1"
        title="ล้างค่า" @mousedown.prevent="clearSelection"
      ><i class="bi bi-x" /></button>
      <button
        type="button" class="emrcb-btn emrcb-caret" tabindex="-1"
        @mousedown.prevent="toggle"
      ><i class="bi" :class="isOpen ? 'bi-chevron-up' : 'bi-chevron-down'" /></button>
    </div>

    <!-- Dropdown (Teleport พ้น modal ที่ overflow clip) -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="panelRef"
        class="emrcb-panel"
        :style="panelStyle"
        @mousedown.prevent
      >
      <div v-if="loading" class="emrcb-state">
        <span class="loading-spinner" /> กำลังค้นหา...
      </div>
      <template v-else-if="visibleOptions.length > 0">
        <button
          v-for="(opt, idx) in visibleOptions"
          :key="opt.value"
          ref="optRefs"
          type="button"
          class="emrcb-opt"
          :class="{ 'emrcb-opt-active': idx === activeIndex, 'emrcb-opt-selected': opt.value === modelValue }"
          @mousemove="activeIndex = idx"
          @click="choose(opt)"
        >
          <span class="emrcb-opt-label">
            <span v-if="opt.code" class="emrcb-opt-code">{{ opt.code }}</span>
            {{ opt.label }}
          </span>
          <i v-if="opt.value === modelValue" class="bi bi-check-lg emrcb-opt-check" />
        </button>
        <div v-if="hasMore" class="emrcb-more">
          แสดง {{ limit }} จาก {{ filtered.length }} รายการ — พิมพ์เพื่อกรองเพิ่ม
        </div>
      </template>
      <div v-else class="emrcb-state emrcb-empty">
        <i class="bi bi-inbox" /> {{ query.trim() ? 'ไม่พบข้อมูล' : emptyText }}
      </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

export interface ComboOption {
  value: string
  label: string
  code?: string   // โค้ดนำหน้า (เช่น CLINCODE / USERID) แสดงตัวเล็กหน้า label
}

const props = withDefaults(defineProps<{
  modelValue?: string | null
  /** ข้อความที่แสดงของ option ที่ถูกเลือก (parent ส่งมา เพื่อโชว์ค่าเดิมได้แม้ไม่มีใน options) */
  selectedLabel?: string
  /** static mode: ส่ง options ตรงๆ */
  options?: ComboOption[]
  /** async mode: ฟังก์ชันค้นหา คืน ComboOption[] */
  searchFn?: (keyword: string) => Promise<ComboOption[]>
  placeholder?: string
  emptyText?: string
  disabled?: boolean
  clearable?: boolean
  leadingIcon?: string
  /** จำนวนสูงสุดที่แสดง (top N) */
  limit?: number
  /** async: หน่วงก่อนยิง (ms) */
  debounce?: number
}>(), {
  placeholder: 'เลือกหรือค้นหา...',
  emptyText: 'พิมพ์เพื่อค้นหา',
  disabled: false,
  clearable: true,
  leadingIcon: '',
  limit: 5,
  debounce: 250,
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | null): void
  (e: 'change', v: string | null, opt: ComboOption | null): void
}>()

const rootRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const optRefs = ref<HTMLElement[]>([])
const panelStyle = ref<Record<string, string>>({})

const isOpen = ref(false)
const query = ref('')
const activeIndex = ref(0)
const loading = ref(false)
const asyncResults = ref<ComboOption[]>([])

const isAsync = computed(() => typeof props.searchFn === 'function')

// label ที่แสดงเมื่อ "ไม่ได้เปิด dropdown" — โชว์ค่าที่เลือกไว้
const selectedText = computed(() => {
  if (!props.modelValue) return ''
  const inList = (props.options ?? []).find(o => o.value === props.modelValue)
  if (inList) return labelOf(inList)
  const inAsync = asyncResults.value.find(o => o.value === props.modelValue)
  if (inAsync) return labelOf(inAsync)
  return props.selectedLabel ?? ''
})

const displayPlaceholder = computed(() => selectedText.value || props.placeholder)

function labelOf(o: ComboOption) {
  return o.code ? `${o.code} - ${o.label}` : o.label
}

// ── filtering ────────────────────────────────────────────────
const filtered = computed<ComboOption[]>(() => {
  const kw = query.value.trim().toLowerCase()
  if (isAsync.value) {
    // async: ผลมาจาก server แล้ว (server กรองให้) — ไม่กรองซ้ำ
    return asyncResults.value
  }
  const opts = props.options ?? []
  if (!kw) return opts
  return opts.filter(o =>
    o.label.toLowerCase().includes(kw) ||
    (o.code ?? '').toLowerCase().includes(kw)
  )
})

const visibleOptions = computed(() => filtered.value.slice(0, props.limit))
const hasMore = computed(() => filtered.value.length > props.limit)

// ── open / close ─────────────────────────────────────────────
function openPanel() {
  if (props.disabled || isOpen.value) return
  isOpen.value = true
  activeIndex.value = 0
  query.value = ''
  positionPanel()
  // async: โหลดชุดเริ่มต้น (ค้นหาด้วย keyword ว่าง)
  if (isAsync.value && asyncResults.value.length === 0) runSearch('')
}

// คำนวณตำแหน่ง panel แบบ fixed ตามพิกัดจริงของ control
// dropdown ลอยพ้น modal (Teleport to body) → ไม่ถูก overflow clip
// flip ขึ้นบนถ้าด้านล่างไม่พอ
const PANEL_MAX = 236
function positionPanel() {
  nextTick(() => {
    const el = rootRef.value
    if (!el) return
    const r = el.getBoundingClientRect()
    const spaceBelow = window.innerHeight - r.bottom
    const spaceAbove = r.top
    const up = spaceBelow < PANEL_MAX && spaceAbove > spaceBelow
    // ความสูงที่ใช้ได้จริงในฝั่งที่เลือก (กันล้นจอ)
    const avail = Math.min(PANEL_MAX, (up ? spaceAbove : spaceBelow) - 8)

    const style: Record<string, string> = {
      position: 'fixed',
      left: `${r.left}px`,
      width: `${r.width}px`,
      maxHeight: `${Math.max(120, avail)}px`,
      zIndex: '9500',
    }
    if (up) style.bottom = `${window.innerHeight - r.top + 4}px`
    else style.top = `${r.bottom + 4}px`
    panelStyle.value = style
  })
}

function closePanel() {
  isOpen.value = false
  query.value = ''
}

function toggle() {
  if (props.disabled) return
  if (isOpen.value) closePanel()
  else { openPanel(); nextTick(() => inputRef.value?.focus()) }
}

function onControlClick() {
  if (props.disabled) return
  if (!isOpen.value) { openPanel(); nextTick(() => inputRef.value?.focus()) }
}

function onFocus() {
  if (!isOpen.value) openPanel()
}

// ── async search (debounced) ─────────────────────────────────
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function onInput() {
  activeIndex.value = 0
  if (!isOpen.value) isOpen.value = true
  if (isAsync.value) {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => runSearch(query.value.trim()), props.debounce)
  }
}

async function runSearch(kw: string) {
  if (!props.searchFn) return
  loading.value = true
  try {
    const res = await props.searchFn(kw)
    asyncResults.value = Array.isArray(res) ? res : []
  } catch {
    asyncResults.value = []
  } finally {
    loading.value = false
    activeIndex.value = 0
  }
}

// ── keyboard ─────────────────────────────────────────────────
function onKeydown(e: KeyboardEvent) {
  if (!isOpen.value && (e.key === 'ArrowDown' || e.key === 'Enter')) {
    openPanel(); return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, visibleOptions.value.length - 1)
    scrollActiveIntoView()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
    scrollActiveIntoView()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const opt = visibleOptions.value[activeIndex.value]
    if (opt) choose(opt)
  } else if (e.key === 'Escape') {
    closePanel()
    inputRef.value?.blur()
  }
}

function scrollActiveIntoView() {
  nextTick(() => {
    optRefs.value[activeIndex.value]?.scrollIntoView({ block: 'nearest' })
  })
}

// ── select / clear ───────────────────────────────────────────
function choose(opt: ComboOption) {
  emit('update:modelValue', opt.value)
  emit('change', opt.value, opt)
  closePanel()
  inputRef.value?.blur()
}

function clearSelection() {
  emit('update:modelValue', null)
  emit('change', null, null)
  query.value = ''
}

// ── click outside ────────────────────────────────────────────
// panel ถูก Teleport ไป body แล้ว → ต้องเช็ค panelRef ด้วย
// ไม่งั้นคลิกใน dropdown จะถือเป็น outside แล้วปิดทันที
function onClickOutside(e: MouseEvent) {
  const t = e.target as Node
  if (rootRef.value?.contains(t)) return
  if (panelRef.value?.contains(t)) return
  closePanel()
}

// reposition ตาม scroll/resize (dropdown เป็น fixed ต้องขยับตาม control)
function onReposition() {
  if (isOpen.value) positionPanel()
}

onMounted(() => {
  document.addEventListener('mousedown', onClickOutside)
  window.addEventListener('scroll', onReposition, true)
  window.addEventListener('resize', onReposition)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside)
  window.removeEventListener('scroll', onReposition, true)
  window.removeEventListener('resize', onReposition)
  if (debounceTimer) clearTimeout(debounceTimer)
})

// reset async cache เมื่อ modelValue ถูกล้างจากภายนอก
watch(() => props.modelValue, (v) => {
  if (!v && !isOpen.value) query.value = ''
})
</script>

<style scoped>
.emrcb { position: relative; width: 100%; }

/* ── control ── */
.emrcb-control {
  display: flex; align-items: center;
  min-height: 40px;
  border: 1px solid var(--cis-border, #e2e8f0);
  border-radius: var(--cis-radius-sm, 8px);
  background: #fff;
  padding: 0 4px 0 10px;
  cursor: text;
  transition: border-color .15s, box-shadow .15s;
}
.emrcb-control:hover:not(.emrcb-disabled) { border-color: #cbd5e1; }
.emrcb-open {
  border-color: var(--cis-primary, #2563a8) !important;
  box-shadow: 0 0 0 3px var(--cis-primary-soft, #e3edf7);
}
.emrcb-disabled { background: #f8fafc; opacity: .6; cursor: not-allowed; }

.emrcb-lead { color: var(--cis-text-muted, #64748b); font-size: .95rem; margin-right: 6px; flex-shrink: 0; }

.emrcb-input {
  flex: 1; min-width: 0;
  border: none; background: transparent; outline: none;
  height: 38px; font-size: .875rem; color: var(--cis-text-primary, #1e293b);
}
.emrcb-input::placeholder { color: #94a3b8; }
.emrcb-input:disabled { cursor: not-allowed; }

.emrcb-btn {
  flex-shrink: 0;
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  border: none; background: none; cursor: pointer;
  color: #94a3b8; font-size: .85rem; border-radius: 6px;
  transition: background .12s, color .12s;
}
.emrcb-btn:hover { background: #f1f5f9; color: #475569; }
.emrcb-caret:hover { color: var(--cis-primary, #2563a8); }

/* ── panel ── */
/* ── panel (Teleport to body, position มาจาก inline style) ── */
.emrcb-panel {
  background: #fff;
  border: 1px solid var(--cis-border, #e2e8f0);
  border-radius: var(--cis-radius-md, 12px);
  box-shadow: 0 12px 32px rgba(15,23,42,.14), 0 2px 8px rgba(15,23,42,.06);
  overflow-y: auto;
  padding: 4px;
}
.emrcb-panel::-webkit-scrollbar { width: 6px; }
.emrcb-panel::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
.emrcb-panel::-webkit-scrollbar-track { background: transparent; }

.emrcb-opt {
  width: 100%;
  display: flex; align-items: center; gap: 8px;
  padding: 9px 10px;
  border: none; background: none; cursor: pointer;
  border-radius: 8px; text-align: left;
  font-size: .875rem; color: var(--cis-text-primary, #1e293b);
  transition: background .1s;
}
.emrcb-opt-active { background: var(--cis-primary-soft, #e3edf7); }
.emrcb-opt-selected { font-weight: 600; }
.emrcb-opt-label { flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; }
.emrcb-opt-code {
  font-family: 'SF Mono','Consolas',monospace;
  font-size: .72rem; color: var(--cis-primary, #2563a8);
  background: var(--cis-primary-soft, #e3edf7);
  padding: 1px 6px; border-radius: 5px; flex-shrink: 0;
}
.emrcb-opt-check { color: var(--cis-primary, #2563a8); flex-shrink: 0; }

.emrcb-more {
  padding: 7px 10px 4px;
  font-size: .72rem; color: var(--cis-text-muted, #64748b);
  text-align: center; border-top: 1px solid #f1f5f9; margin-top: 2px;
}

.emrcb-state {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 16px; font-size: .82rem; color: var(--cis-text-muted, #64748b);
}
.emrcb-empty { color: #94a3b8; }
</style>
