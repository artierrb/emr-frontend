<template>
  <div class="cdp" ref="rootRef" @mousedown="onRootMousedown">

    <!-- Input row -->
    <div class="cdp-input-wrap" :class="{ 'cdp-focused': isOpen, 'cdp-disabled': disabled }">
      <input
        ref="inputRef"
        v-model="inputText"
        class="cdp-input"
        :placeholder="placeholder"
        :disabled="disabled"
        maxlength="10"
        autocomplete="off"
        @input="onTextInput"
        @keydown="onKeydown"
        @focus="openCal"
      />
      <button v-if="modelValue && clearable && !disabled" class="cdp-clear"
        type="button" tabindex="-1" @mousedown.prevent="clear">
        <i class="bi bi-x" />
      </button>
      <button class="cdp-ico" type="button" tabindex="-1" @mousedown.prevent="toggleCal">
        <i class="bi bi-calendar3" />
      </button>
    </div>

    <!-- Calendar panel (Teleport พ้น modal ที่ overflow clip) -->
    <Teleport to="body">
    <div
      v-if="isOpen"
      ref="panelRef"
      class="cdp-panel"
      :style="panelStyle"
      @mousedown.stop
    >
      <!-- ── MONTH PICKER ── -->
      <template v-if="showMonthPicker">
        <div class="cdp-head">
          <span class="cdp-head-title">เลือกเดือน — {{ viewYear + 543 }}</span>
          <button class="cdp-nav cdp-nav-close" @mousedown.prevent="showMonthPicker = false">
            <i class="bi bi-x" />
          </button>
        </div>
        <div class="cdp-picker-grid">
          <button v-for="(m, i) in MONTHS_TH" :key="i"
            class="cdp-picker-btn" :class="{ 'cdp-picker-active': i === viewMonth }"
            @mousedown.prevent="selectMonth(i)">{{ m }}</button>
        </div>
      </template>

      <!-- ── YEAR PICKER ── -->
      <template v-else-if="showYearPicker">
        <div class="cdp-head">
          <span class="cdp-head-title">เลือกปี (พ.ศ.)</span>
          <button class="cdp-nav cdp-nav-close" @mousedown.prevent="showYearPicker = false">
            <i class="bi bi-x" />
          </button>
        </div>
        <div class="cdp-year-wrap" ref="yearListRef">
          <div class="cdp-year-grid">
            <button v-for="y in yearRange" :key="y"
              class="cdp-picker-btn" :class="{ 'cdp-picker-active': y === viewYear }"
              @mousedown.prevent="selectYear(y)">{{ y + 543 }}</button>
          </div>
        </div>
      </template>

      <!-- ── CALENDAR ── -->
      <template v-else>
        <div class="cdp-head">
          <button class="cdp-nav" @mousedown.prevent="prevYear"><i class="bi bi-chevron-double-left"/></button>
          <button class="cdp-nav" @mousedown.prevent="prevMonth"><i class="bi bi-chevron-left"/></button>
          <div class="cdp-head-center">
            <button class="cdp-head-btn" @mousedown.prevent="showMonthPicker = true">{{ MONTHS_TH[viewMonth] }}</button>
            <button class="cdp-head-btn" @mousedown.prevent="openYearPicker">{{ viewYear + 543 }}</button>
          </div>
          <button class="cdp-nav" @mousedown.prevent="nextMonth"><i class="bi bi-chevron-right"/></button>
          <button class="cdp-nav" @mousedown.prevent="nextYear"><i class="bi bi-chevron-double-right"/></button>
        </div>
        <div class="cdp-dow-row">
          <span v-for="d in DAYS" :key="d" class="cdp-dow">{{ d }}</span>
        </div>
        <div class="cdp-days">
          <button v-for="cell in cells" :key="cell.key"
            class="cdp-day"
            :class="{
              'cdp-day-other':    cell.other,
              'cdp-day-today':    cell.today && !cell.selected,
              'cdp-day-selected': cell.selected,
            }"
            :disabled="cell.disabled"
            @mousedown.prevent="selectDay(cell)">{{ cell.d }}</button>
        </div>
        <div class="cdp-footer">
          <button class="cdp-today-btn" @mousedown.prevent="goToday">วันนี้</button>
          <button v-if="modelValue" class="cdp-clear-btn" @mousedown.prevent="clear">ล้างค่า</button>
        </div>
      </template>
    </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: string | null
  placeholder?: string
  disabled?:   boolean
  clearable?:  boolean
  minDate?:    string
  maxDate?:    string
}>(), {
  placeholder: 'วว/ดด/ปปปป',
  disabled:    false,
  clearable:   true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: string | null): void
  (e: 'change', val: string | null): void
}>()

const MONTHS_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
const DAYS      = ['อา','จ','อ','พ','พฤ','ศ','ส']

const rootRef    = ref<HTMLElement | null>(null)
const inputRef   = ref<HTMLInputElement | null>(null)
const yearListRef = ref<HTMLElement | null>(null)
const panelRef   = ref<HTMLElement | null>(null)
const panelStyle = ref<Record<string, string>>({})

const isOpen          = ref(false)
const inputText       = ref('')
const showMonthPicker = ref(false)
const showYearPicker  = ref(false)

const todayDate = new Date()
const viewMonth = ref(todayDate.getMonth())
const viewYear  = ref(todayDate.getFullYear())

const yearRange = computed(() => {
  const cur = todayDate.getFullYear()
  return Array.from({ length: 91 }, (_, i) => cur - 80 + i)
})

// ── Sync modelValue → inputText ───────────────────────────────────────────────
watch(() => props.modelValue, (v) => {
  inputText.value = v ? dbToDisplay(v) : ''
  if (v && v.length === 8) {
    viewYear.value  = parseInt(v.slice(0, 4))
    viewMonth.value = parseInt(v.slice(4, 6)) - 1
  } else if (!v) {
    // reset view กลับมาเป็นวันนี้เมื่อล้างค่า
    viewYear.value  = todayDate.getFullYear()
    viewMonth.value = todayDate.getMonth()
  }
}, { immediate: true })

function dbToDisplay(db: string) {
  return `${db.slice(6,8)}/${db.slice(4,6)}/${db.slice(0,4)}`
}

function displayToDb(txt: string): string | null {
  const parts = txt.trim().split('/')
  if (parts.length !== 3) return null
  const [d, m, y] = parts
  if (!d || !m || !y || y.length !== 4) return null
  const yi = parseInt(y), mi = parseInt(m), di = parseInt(d)
  if (isNaN(yi) || isNaN(mi) || isNaN(di) || mi < 1 || mi > 12 || di < 1 || di > 31) return null
  return `${y}${m.padStart(2,'0')}${d.padStart(2,'0')}`
}

function dateToDb(d: Date) {
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
}

// ── Calendar cells ─────────────────────────────────────────────────────────────
interface DayCell { key:string; d:number; other:boolean; today:boolean; selected:boolean; disabled:boolean; date:Date }

const cells = computed<DayCell[]>(() => {
  const first   = new Date(viewYear.value, viewMonth.value, 1)
  const last    = new Date(viewYear.value, viewMonth.value + 1, 0)
  const todayDb = dateToDb(todayDate)
  const rows: DayCell[] = []

  for (let i = first.getDay() - 1; i >= 0; i--)
    rows.push(mkCell(new Date(viewYear.value, viewMonth.value, -i), true, todayDb))
  for (let i = 1; i <= last.getDate(); i++)
    rows.push(mkCell(new Date(viewYear.value, viewMonth.value, i), false, todayDb))
  for (let i = 1; i <= 42 - rows.length; i++)
    rows.push(mkCell(new Date(viewYear.value, viewMonth.value + 1, i), true, todayDb))
  return rows
})

function mkCell(date: Date, other: boolean, todayDb: string): DayCell {
  const db = dateToDb(date)
  return {
    key: db, d: date.getDate(), other,
    today:    db === todayDb,
    selected: db === (props.modelValue ?? ''),
    disabled: (!!props.minDate && db < props.minDate) || (!!props.maxDate && db > props.maxDate),
    date,
  }
}

// ── Open / Close ───────────────────────────────────────────────────────────────
function openCal() {
  if (props.disabled || isOpen.value) return
  isOpen.value          = true
  showMonthPicker.value = false
  showYearPicker.value  = false
  if (props.modelValue?.length === 8) {
    viewYear.value  = parseInt(props.modelValue.slice(0,4))
    viewMonth.value = parseInt(props.modelValue.slice(4,6)) - 1
  }
  positionPanel()
}

// คำนวณตำแหน่ง panel แบบ fixed ตามพิกัดจริงของ input
// panel Teleport ไป body → ไม่ถูก modal overflow clip · flip ขึ้นบนถ้าล่างไม่พอ
const PANEL_H = 340  // สูงโดยประมาณของปฏิทิน
const PANEL_W = 280  // = width ของ .cdp-panel
function positionPanel() {
  nextTick(() => {
    const el = rootRef.value
    if (!el) return
    const r = el.getBoundingClientRect()
    const spaceBelow = window.innerHeight - r.bottom
    const spaceAbove = r.top
    const up = spaceBelow < PANEL_H && spaceAbove > spaceBelow

    // left: ยึดซ้ายของ input แต่กันล้นขอบขวาจอ
    let left = r.left
    if (left + PANEL_W > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - PANEL_W - 8)
    }

    const style: Record<string, string> = {
      position: 'fixed',
      left: `${left}px`,
      zIndex: '9500',
    }
    if (up) style.bottom = `${window.innerHeight - r.top + 4}px`
    else style.top = `${r.bottom + 4}px`
    panelStyle.value = style
  })
}

function closeCal() {
  isOpen.value          = false
  showMonthPicker.value = false
  showYearPicker.value  = false
}

function toggleCal() {
  if (props.disabled) return
  if (isOpen.value) closeCal()
  else { openCal(); nextTick(() => inputRef.value?.focus()) }
}

// ── onRootMousedown — ป้องกัน input blur เมื่อคลิกใน component ──────────────
function onRootMousedown(e: MouseEvent) {
  // ถ้าคลิก input เอง ไม่ต้อง prevent
  if (e.target === inputRef.value) return
  e.preventDefault()
}

// ── Click outside — panel Teleport ไป body แล้ว ต้องเช็ค panelRef ด้วย ──
// ไม่งั้นคลิกในปฏิทินจะถือเป็น outside แล้ว commit/ปิดทันที
function onClickOutside(e: MouseEvent) {
  const t = e.target as Node
  if (rootRef.value?.contains(t)) return
  if (panelRef.value?.contains(t)) return
  commitText()
}

// reposition ตาม scroll/resize (panel เป็น fixed ต้องขยับตาม input)
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
})

// ── Select ─────────────────────────────────────────────────────────────────────
function selectDay(c: DayCell) {
  if (c.disabled) return
  const db = dateToDb(c.date)
  inputText.value = dbToDisplay(db)
  emit('update:modelValue', db)
  emit('change', db)
  closeCal()
}

function selectMonth(m: number) { viewMonth.value = m; showMonthPicker.value = false }

function selectYear(y: number) { viewYear.value = y; showYearPicker.value = false }

function openYearPicker() {
  showYearPicker.value  = true
  showMonthPicker.value = false
  nextTick(() => {
    yearListRef.value?.querySelector('.cdp-picker-active')
      ?.scrollIntoView({ block: 'center' })
  })
}

function goToday() {
  const db = dateToDb(todayDate)
  inputText.value = dbToDisplay(db)
  viewMonth.value = todayDate.getMonth()
  viewYear.value  = todayDate.getFullYear()
  emit('update:modelValue', db)
  emit('change', db)
  closeCal()
}

function clear() {
  inputText.value = ''
  emit('update:modelValue', null)
  emit('change', null)
  closeCal()
}

// ── Navigation ─────────────────────────────────────────────────────────────────
function prevMonth() { viewMonth.value === 0 ? (viewMonth.value=11,viewYear.value--) : viewMonth.value-- }
function nextMonth() { viewMonth.value === 11 ? (viewMonth.value=0,viewYear.value++) : viewMonth.value++ }
function prevYear()  { viewYear.value-- }
function nextYear()  { viewYear.value++ }

// ── Keyboard ───────────────────────────────────────────────────────────────────
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') { closeCal(); inputRef.value?.blur() }
  if (e.key === 'Enter' || e.key === 'Tab') commitText()
}

function commitText() {
  const db = displayToDb(inputText.value)
  if (db) {
    emit('update:modelValue', db)
    emit('change', db)
    viewYear.value  = parseInt(db.slice(0,4))
    viewMonth.value = parseInt(db.slice(4,6)) - 1
  } else if (!inputText.value.trim()) {
    emit('update:modelValue', null)
    emit('change', null)
  } else {
    inputText.value = props.modelValue ? dbToDisplay(props.modelValue) : ''
  }
  closeCal()
}

// ── Auto slash ─────────────────────────────────────────────────────────────────
function onTextInput() {
  let raw = inputText.value.replace(/\D/g, '')
  let out = raw
  if (raw.length > 2) out = raw.slice(0,2) + '/' + raw.slice(2)
  if (raw.length > 4) out = raw.slice(0,2) + '/' + raw.slice(2,4) + '/' + raw.slice(4,8)
  inputText.value = out.slice(0,10)
}
</script>

<style scoped>
/* ── Wrapper ── */
.cdp { position:relative; width:100%; }

/* ── Input ── */
.cdp-input-wrap {
  display:flex; align-items:center;
  border:1px solid #E2E8F0; border-radius:9px; background:#fff;
  overflow:hidden; transition:border .15s,box-shadow .15s;
}
.cdp-input-wrap:hover:not(.cdp-disabled) { border-color:#CBD5E1; }
.cdp-focused  { border-color:var(--cis-primary,#2563a8) !important; box-shadow:0 0 0 3px rgba(37,99,168,.15); }
.cdp-disabled { background:#F8FAFC; opacity:.6; }

.cdp-input {
  flex:1; padding:9px 4px 9px 12px; border:none; background:transparent;
  font-size:.875rem; font-family:'SF Mono','Consolas',monospace;
  font-variant-numeric:tabular-nums; letter-spacing:.04em;
  color:#1E293B; outline:none; min-width:0;
}
.cdp-input::placeholder { color:#CBD5E1; font-family:'IBM Plex Sans Thai','Sarabun',sans-serif; font-size:.82rem; }
.cdp-input:disabled { cursor:not-allowed; }

.cdp-clear,.cdp-ico {
  flex-shrink:0; border:none; background:none; cursor:pointer;
  padding:0 8px; display:flex; align-items:center;
  color:#CBD5E1; font-size:.9rem; height:100%; transition:color .15s;
}
.cdp-clear:hover { color:#94A3B8; }
.cdp-ico:hover   { color:var(--cis-primary,#2563a8); }

/* ── Panel (Teleport to body, position มาจาก inline style) ── */
.cdp-panel {
  width:280px;
  background:#fff; border:1px solid #E2E8F0; border-radius:14px;
  box-shadow:0 12px 40px rgba(15,23,42,.15),0 2px 8px rgba(15,23,42,.07);
  overflow:hidden; user-select:none;
}

/* ── Header ── */
.cdp-head {
  display:flex; align-items:center;
  padding:10px 8px; border-bottom:1px solid #F1F5F9; gap:2px;
}
.cdp-head-title { flex:1; font-size:.82rem; font-weight:600; color:#374151; padding-left:6px; }
.cdp-nav {
  width:28px; height:28px; border:none; background:none; cursor:pointer;
  border-radius:7px; color:#64748B; display:flex; align-items:center; justify-content:center;
  font-size:.8rem; transition:background .12s,color .12s; flex-shrink:0;
}
.cdp-nav:hover       { background:var(--cis-primary-soft,#e3edf7); color:var(--cis-primary,#2563a8); }
.cdp-nav-close:hover { background:#FEF2F2; color:#DC2626; }
.cdp-head-center { flex:1; display:flex; align-items:center; justify-content:center; gap:4px; }
.cdp-head-btn {
  padding:5px 10px; border:none; background:none; cursor:pointer;
  font-size:.9rem; font-weight:700; color:#0F172A; border-radius:8px;
  transition:background .12s,color .12s; font-family:inherit;
}
.cdp-head-btn:hover { background:var(--cis-primary-soft,#e3edf7); color:var(--cis-primary,#2563a8); }

/* ── Days ── */
.cdp-dow-row { display:grid; grid-template-columns:repeat(7,1fr); padding:8px 8px 2px; }
.cdp-dow { text-align:center; font-size:.68rem; font-weight:700; color:#94A3B8; }
.cdp-days { display:grid; grid-template-columns:repeat(7,1fr); padding:0 6px 6px; gap:1px; }
.cdp-day {
  aspect-ratio:1; display:flex; align-items:center; justify-content:center;
  border:none; background:none; cursor:pointer; border-radius:8px;
  font-size:.8rem; color:#1E293B; font-family:inherit; transition:background .1s,color .1s;
}
.cdp-day:hover:not(:disabled)  { background:var(--cis-primary-soft,#e3edf7); color:var(--cis-primary,#2563a8); font-weight:600; }
.cdp-day:disabled               { opacity:.3; cursor:not-allowed; }
.cdp-day-other                  { color:#CBD5E1; }
.cdp-day-today                  { color:var(--cis-primary,#2563a8); font-weight:700; background:var(--cis-primary-soft,#e3edf7); }
.cdp-day-selected               { background:var(--cis-primary,#2563a8) !important; color:#fff !important; font-weight:700; box-shadow:0 2px 8px rgba(37,99,168,.35); }

/* ── Pickers ── */
.cdp-picker-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:4px; padding:10px; }
.cdp-year-wrap   { max-height:200px; overflow-y:auto; padding:8px; }
.cdp-year-wrap::-webkit-scrollbar       { width:4px; }
.cdp-year-wrap::-webkit-scrollbar-thumb { background:#E2E8F0; border-radius:2px; }
.cdp-year-grid   { display:grid; grid-template-columns:repeat(4,1fr); gap:4px; }
.cdp-picker-btn  {
  padding:7px 4px; border:none; background:none; cursor:pointer;
  font-size:.78rem; color:#374151; border-radius:8px; text-align:center;
  transition:background .1s,color .1s; font-family:inherit; font-weight:500;
}
.cdp-picker-btn:hover    { background:var(--cis-primary-soft,#e3edf7); color:var(--cis-primary,#2563a8); }
.cdp-picker-active       { background:var(--cis-primary,#2563a8); color:#fff; font-weight:700; }
.cdp-picker-active:hover { background:var(--cis-primary-hover,#1d4d85); }

/* ── Footer ── */
.cdp-footer {
  display:flex; align-items:center; justify-content:center; gap:8px;
  padding:8px; border-top:1px solid #F1F5F9;
}
.cdp-today-btn,.cdp-clear-btn {
  padding:5px 14px; border-radius:7px; font-size:.78rem; font-weight:600;
  cursor:pointer; font-family:inherit; transition:all .12s; border:none;
}
.cdp-today-btn       { background:var(--cis-primary,#2563a8); color:#fff; }
.cdp-today-btn:hover { background:var(--cis-primary-hover,#1d4d85); }
.cdp-clear-btn       { background:#F1F5F9; color:#64748B; }
.cdp-clear-btn:hover { background:#FEE2E2; color:#DC2626; }
</style>