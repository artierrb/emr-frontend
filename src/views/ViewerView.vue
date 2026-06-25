<template>
  <!-- OCS launch overlay — กำลังเปิด / block states / error -->
  <Teleport to="body">
    <div v-if="ocsLaunching" class="fixed inset-0 z-[9999] bg-white/95 flex items-center justify-center">
      <div class="text-center px-6">
        <span class="loading-spinner" />
        <p class="text-sm text-gray-500 mt-3">กำลังเปิดข้อมูลจาก OCS...</p>
      </div>
    </div>

    <!-- Block screen: ค้างหน้า ทำอะไรไม่ได้ (IP not allowed / secure / rent already requested) -->
    <div v-else-if="blockScreen" class="fixed inset-0 z-[9999] bg-slate-50 flex items-center justify-center">
      <div class="text-center px-8 max-w-md">
        <i class="bi bi-shield-lock-fill text-5xl mb-4"
          :class="blockScreen.icon" />
        <h2 class="text-lg font-semibold text-gray-700 mb-2">{{ blockScreen.title }}</h2>
        <p class="text-sm text-gray-500">{{ blockScreen.message }}</p>
      </div>
    </div>
  </Teleport>

  <!-- Rent registration modal (BLOCKRENT + ยังไม่เคย request) -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showRentModal" class="fixed inset-0 z-[9600] flex items-center justify-center">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
        <div class="relative bg-white rounded-xl shadow-2xl w-[460px] overflow-hidden">
          <div class="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
            <i class="bi bi-folder-plus text-[#1a4f7a]" />
            <span class="font-semibold text-sm">ระบบลงทะเบียนขอยืมแฟ้ม</span>
          </div>
          <div class="px-5 py-4 space-y-3">
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="form-label">USERID</label>
                <input :value="rentForm.userId" class="form-input bg-gray-50 text-xs" readonly />
              </div>
              <div>
                <label class="form-label">CLINCODE</label>
                <input :value="rentForm.clinCode" class="form-input bg-gray-50 text-xs" readonly />
              </div>
              <div>
                <label class="form-label">PATID (HN)</label>
                <input :value="formatHnDisplay(rentForm.patId)" class="form-input bg-gray-50 text-xs" readonly />
              </div>
            </div>
            <div>
              <label class="form-label">เหตุผลในการยืมแฟ้ม <span class="text-red-500">*</span></label>
              <select v-model="rentForm.rentCode" class="form-select text-sm">
                <option value="">-- เลือกเหตุผล --</option>
                <option v-for="r in rentReasons" :key="r.DtlCod" :value="r.DtlCod">{{ r.DtlCodNam }}</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="form-label">วันที่เริ่ม <span class="text-red-500">*</span></label>
                <input v-model="rentForm.rentSdtRaw" type="date" class="form-input text-sm" />
              </div>
              <div>
                <label class="form-label">วันที่สิ้นสุด <span class="text-red-500">*</span></label>
                <input v-model="rentForm.rentEdtRaw" type="date" class="form-input text-sm" />
              </div>
            </div>
            <div>
              <label class="form-label">หมายเหตุ</label>
              <input v-model="rentForm.rentRemark" class="form-input text-sm" maxlength="100" placeholder="ระบุหมายเหตุ (ถ้ามี)" />
            </div>
          </div>
          <div class="px-5 py-3 border-t border-gray-100 flex justify-end">
            <button class="btn-primary gap-1" :disabled="rentSaving || !rentForm.rentCode" @click="saveRent">
              <span v-if="rentSaving" class="loading-spinner" />
              <i v-else class="bi bi-check-lg" /> บันทึก
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Secure registration modal (ลงทะเบียนปกปิดข้อมูลผู้ป่วย) -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showSecureModal" class="fixed inset-0 z-[9600] flex items-center justify-center">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="showSecureModal = false" />
        <div class="relative rounded-xl shadow-2xl w-[440px] overflow-hidden"
          :class="secureExists ? 'bg-red-600' : 'bg-white'">

          <!-- กรณีมี request ค้างแล้ว → แจ้งข้อความ (พื้นแดง ฟ้อนขาว ทั้ง modal) -->
          <template v-if="secureExists">
            <div class="flex items-center gap-2 px-5 py-3 border-b border-red-500">
              <i class="bi bi-shield-lock text-white" />
              <span class="font-semibold text-sm text-white">ระบบลงทะเบียนปกปิดข้อมูลผู้ป่วย</span>
            </div>
            <div class="px-5 py-6 text-center">
              <i class="bi bi-check-circle-fill text-white text-4xl block mb-3" />
              <p class="text-sm text-white font-semibold">มีการลงทะเบียนปกปิดข้อมูลผู้ป่วยเรียบร้อยแล้ว</p>
              <p class="text-sm text-white/90 mt-1">กรุณาติดต่อแอดมิน</p>
            </div>
            <div class="px-5 py-3 border-t border-red-500 flex justify-end">
              <button class="px-4 py-1.5 text-sm rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
                @click="showSecureModal = false">ปิด</button>
            </div>
          </template>

          <!-- กรณียังไม่เคย request → ฟอร์มลงทะเบียน (พื้นขาว, header แดงฟ้อนขาว) -->
          <template v-else>
            <div class="flex items-center gap-2 px-5 py-3 bg-red-600">
              <i class="bi bi-shield-lock text-white" />
              <span class="font-semibold text-sm text-white">ระบบลงทะเบียนปกปิดข้อมูลผู้ป่วย</span>
            </div>
            <div class="px-5 py-4 space-y-3">
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="form-label">USERID</label>
                  <input :value="secureForm.userId" class="form-input bg-gray-50 text-xs" disabled />
                </div>
                <div>
                  <label class="form-label">HN</label>
                  <input :value="formatHnDisplay(secureForm.patId)" class="form-input bg-gray-50 text-xs" disabled />
                </div>
              </div>
              <div>
                <label class="form-label">เหตุผล <span class="text-red-500">*</span></label>
                <textarea v-model="secureForm.memo" rows="3" class="form-input text-sm" maxlength="255"
                  placeholder="ระบุเหตุผลในการปกปิดข้อมูล" />
              </div>
            </div>
            <div class="px-5 py-3 border-t border-red-500 flex gap-2 justify-end">
              <button class="btn-outline" @click="showSecureModal = false">ยกเลิก</button>
              <button class="btn-primary gap-1" :disabled="secureSaving || !secureForm.memo.trim()" @click="saveSecure">
                <span v-if="secureSaving" class="loading-spinner" />
                <i v-else class="bi bi-check-lg" /> บันทึก
              </button>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- PrintNeed request modal (ขอพิมพ์เอกสาร — auth != 3) -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showPrintNeedModal" class="fixed inset-0 z-[9600] flex items-center justify-center">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="showPrintNeedModal = false" />
        <div class="relative rounded-xl shadow-2xl w-[460px] overflow-hidden"
          :class="printNeedExists ? 'bg-red-600' : 'bg-white'">

          <!-- กรณีมี request ค้างแล้ว → แจ้งข้อความ (พื้นแดง ฟ้อนขาว) -->
          <template v-if="printNeedExists">
            <div class="flex items-center gap-2 px-5 py-3 border-b border-red-500">
              <i class="bi bi-printer text-white" />
              <span class="font-semibold text-sm text-white">ระบบขอพิมพ์เอกสาร</span>
            </div>
            <div class="px-5 py-6 text-center">
              <i class="bi bi-exclamation-circle-fill text-white text-4xl block mb-3" />
              <p class="text-sm text-white font-semibold">มีการ request ขอพิมพ์เอกสารแล้ว</p>
              <p class="text-sm text-white/90 mt-1">กรุณาติดต่อ Admin</p>
            </div>
            <div class="px-5 py-3 border-t border-red-500 flex justify-end">
              <button class="px-4 py-1.5 text-sm rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
                @click="showPrintNeedModal = false">ปิด</button>
            </div>
          </template>

          <!-- กรณียังไม่เคย request → ฟอร์มขอพิมพ์ -->
          <template v-else>
            <div class="flex items-center gap-2 px-5 py-3 bg-[#1a4f7a]">
              <i class="bi bi-printer text-white" />
              <span class="font-semibold text-sm text-white">ระบบขอพิมพ์เอกสาร</span>
            </div>
            <div class="px-5 py-4 space-y-3">
              <div class="grid grid-cols-3 gap-2">
                <div>
                  <label class="form-label">HN</label>
                  <input :value="formatHnDisplay(printNeedForm.patId)" class="form-input bg-gray-50 text-xs" disabled />
                </div>
                <div>
                  <label class="form-label">ผู้ขอ</label>
                  <input :value="printNeedForm.userId" class="form-input bg-gray-50 text-xs" disabled />
                </div>
                <div>
                  <label class="form-label">วันที่</label>
                  <input :value="printNeedForm.cDate" type="date" class="form-input bg-gray-50 text-xs" disabled />
                </div>
              </div>
              <div>
                <label class="form-label">เหตุผลในการพิมพ์ <span class="text-red-500">*</span></label>
                <select v-model="printNeedForm.printCode" class="form-select text-sm">
                  <option value="">-- เลือกเหตุผล --</option>
                  <option v-for="r in printReasons" :key="r.DtlCod" :value="r.DtlCod">{{ r.DtlCodNam }}</option>
                </select>
              </div>
              <div>
                <label class="form-label">คลินิก</label>
                <select v-model="printNeedForm.needClin" class="form-select text-sm">
                  <option value="">-- เลือกคลินิก --</option>
                  <option v-for="c in printClinics" :key="c.CLINCODE" :value="c.CLINCODE">{{ c.NAME }}</option>
                </select>
              </div>
            </div>
            <div class="px-5 py-3 border-t border-gray-100 flex gap-2 justify-end">
              <button class="btn-outline" @click="showPrintNeedModal = false">ยกเลิก</button>
              <button class="btn-primary gap-1" :disabled="printNeedSaving || !printNeedForm.printCode" @click="savePrintNeed">
                <span v-if="printNeedSaving" class="loading-spinner" />
                <i v-else class="bi bi-check-lg" /> บันทึก
              </button>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>

  <div class="flex flex-col h-[calc(100vh-115px)]">
    <div class="flex gap-3 flex-1 min-h-0 h-full">

      <!-- Col A: Filter buttons -->
      <div class="flex flex-col gap-2 flex-shrink-0 w-12">
        <div class="flex flex-col gap-1">
          <button v-for="f in filters" :key="f.value"
            class="w-10 h-10 rounded-lg border text-xs font-semibold transition-colors"
            :class="activeFilter === f.value
              ? 'bg-[#1a4f7a] text-white border-[#1a4f7a]'
              : 'bg-white text-gray-600 border-gray-200 hover:border-[#1a4f7a] hover:text-[#1a4f7a]'"
            @click="activeFilter = f.value">{{ f.label }}</button>
        </div>
        <div class="flex-1" />
        <div class="flex flex-col gap-1">
          <!-- SECU: ลงทะเบียนปกปิดข้อมูลผู้ป่วย — กดได้เมื่อมีข้อมูลผู้ป่วยแล้ว -->
          <button
            class="w-10 h-10 rounded-lg border text-[9px] font-semibold transition-colors"
            :class="patientStore.viewerPatient
              ? 'bg-red-600 text-white border-red-600 hover:bg-red-700 cursor-pointer'
              : 'bg-white text-gray-300 border-gray-200 cursor-not-allowed'"
            :disabled="!patientStore.viewerPatient"
            @click="openSecureModal"
            title="ลงทะเบียนปกปิดข้อมูลผู้ป่วย">SECU</button>
        </div>
      </div>

      <!-- Col B: Group/Treat list -->
      <div class="card flex flex-col flex-shrink-0 w-80 min-h-0">
        <!-- Patient info from shared store -->
        <div v-if="patientStore.viewerPatient" class="px-3 py-2 border-b border-gray-100 bg-blue-50 flex-shrink-0">
          <div class="text-xs font-semibold text-[#1a4f7a]">{{ patientStore.viewerPatient.NAME?.trim() }}</div>
          <div class="text-[10px] text-gray-500">HN: {{ patientStore.viewerLastHn }}</div>
          <span v-if="loading" class="loading-spinner mt-1" />
        </div>
        <div v-else class="px-3 py-2 border-b border-gray-100 bg-amber-50 flex-shrink-0">
          <p class="text-xs text-amber-700"><i class="bi bi-exclamation-triangle mr-1" />ค้นหาผู้ป่วยจากแถบด้านบน</p>
        </div>

        <div class="card-header py-2">
          <i class="bi bi-folder2" /> รายการ
          <span class="ml-auto text-xs text-gray-400 font-normal">{{ filteredGroups.length }} กลุ่ม</span>
        </div>
        <div class="flex-1 overflow-y-auto">
          <div v-if="!patientStore.viewerPatient" class="empty-state py-8">
            <i class="bi bi-search text-2xl block mb-2" /><p class="text-xs">ค้นหาผู้ป่วยก่อน</p>
          </div>
          <div v-else-if="loading" class="flex justify-center py-8"><span class="loading-spinner" /></div>
          <div v-else-if="filteredGroups.length === 0" class="empty-state py-8">
            <i class="bi bi-inbox text-2xl block mb-2" /><p class="text-xs">ไม่พบข้อมูล</p>
          </div>
          <template v-else>
            <div v-for="g in filteredGroups" :key="g.formCode">
              <div
                class="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 sticky top-0 bg-white z-10"
                :class="activeGroup === g.formCode && !activeTreat ? 'bg-blue-50 text-blue-800' : 'text-gray-700'"
                @click="selectGroup(g)">
                <i class="bi text-xs flex-shrink-0"
                  :class="expandedGroups.has(g.formCode) ? 'bi-chevron-down' : 'bi-chevron-right'" />
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-semibold truncate">{{ g.formName }}</div>
                  <div class="text-[10px] text-gray-400">{{ g.formCode }} [{{ g.totalCnt }}]</div>
                </div>
              </div>
              <template v-if="expandedGroups.has(g.formCode)">
                <div v-for="t in g.treats" :key="t.TREATNO"
                  class="pl-6 pr-3 py-1.5 cursor-pointer hover:bg-sky-50 transition-colors border-b border-gray-100 text-xs"
                  :class="activeTreat === t.TREATNO && activeGroup === g.formCode ? 'bg-sky-100 text-sky-800' : 'text-gray-600'"
                  @click="selectTreat(g.formCode, t)">
                  <div class="font-medium">{{ formatDate(t.INDATE) }} [{{ t.CLINCODE }}]</div>
                  <div class="text-[10px] text-gray-400 truncate">{{ t.DOCNAME }} [{{ t.CNT }}]</div>
                </div>
              </template>
            </div>
          </template>
        </div>
      </div>

      <!-- Col C: Thumbnail grid -->
      <div class="card flex flex-col flex-1 min-h-0">
        <div class="card-header py-2">
          <i class="bi bi-images" />
          {{ activeGroupName || 'เอกสาร' }}
          <span v-if="viewPages.length > 0" class="ml-2 text-xs text-gray-400 font-normal">{{ viewPages.length }} ภาพ</span>
          <span v-if="loadingPages" class="ml-2 loading-spinner" />
        </div>
        <div class="flex-1 overflow-y-auto p-3 min-h-0">
          <div v-if="viewPages.length === 0 && !loadingPages" class="empty-state">
            <i class="bi bi-file-earmark-image text-3xl block mb-2" />
            <p class="text-sm">เลือกกลุ่มหรือรายการด้านซ้าย</p>
          </div>
          <div v-else class="grid gap-2" style="grid-template-columns: repeat(auto-fill, minmax(120px, 1fr))">
            <div v-for="(p, idx) in viewPages" :key="p.PAGENO"
              class="border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:border-sky-400 hover:shadow-sm transition-all"
              @click="openViewer(idx)">
              <img :src="`/api/image/${p.PAGENO}?ext=${p.EXTENSION||'jpg'}&thumb=1`"
                loading="lazy" decoding="async"
                class="w-full h-28 object-cover bg-gray-100" :alt="`หน้า ${p.PAGE}`"
                @error="(e:any) => e.target.style.display='none'" />
              <div class="px-1 py-1 text-[10px] text-gray-400 text-center truncate">
                หน้า {{ p.PAGE }} · {{ formatDate(p.CDATE) }}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- Image viewer overlay -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="viewerOpen" class="fixed inset-0 z-[9000] bg-black/90 flex flex-col"
        @click.self="viewerOpen = false">
        <div class="flex items-center gap-2 px-4 py-2 bg-black/60 flex-shrink-0">
          <button class="viewer-btn" @click="vZoom = Math.max(0.25, vZoom-0.25)"><i class="bi bi-zoom-out" /></button>
          <button class="viewer-btn" @click="vZoom = Math.min(4, vZoom+0.25)"><i class="bi bi-zoom-in" /></button>
          <button class="viewer-btn" @click="vZoom=1;vRotate=0"><i class="bi bi-aspect-ratio" /></button>
          <button class="viewer-btn" @click="vRotate=(vRotate+90)%360"><i class="bi bi-arrow-clockwise" /></button>
          <button class="viewer-btn" @click="printCurrentImage" title="พิมพ์รูป"><i class="bi bi-printer" /></button>
          <span class="flex-1 text-white/70 text-sm truncate">{{ viewerLabel }}</span>
          <span class="text-white/50 text-xs">{{ viewerIdx+1 }} / {{ viewPages.length }}</span>
          <button class="viewer-btn" :class="viewerIdx <= 0 ? 'opacity-30' : ''" @click="navViewer(-1)"><i class="bi bi-chevron-left" /></button>
          <button class="viewer-btn" :class="viewerIdx >= viewPages.length-1 ? 'opacity-30' : ''" @click="navViewer(1)"><i class="bi bi-chevron-right" /></button>
          <button class="viewer-btn" @click="viewerOpen=false"><i class="bi bi-x-lg" /></button>
        </div>
        <div class="flex-1 flex items-center justify-center overflow-hidden p-4">
          <img :src="viewerSrc"
            :style="{ transform: `scale(${vZoom}) rotate(${vRotate}deg)`, transition: 'transform 0.2s' }"
            class="max-w-full max-h-full object-contain" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePatientStore } from '@/stores/patient'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { useDialog } from '@/composables/useDialog'
const { alert: dlgAlert } = useDialog()

const route        = useRoute()
const router       = useRouter()
const patientStore = usePatientStore()
const authStore    = useAuthStore()
const loading      = ref(false)
const loadingPages = ref(false)

// OCS launch
const ocsLaunching = ref(false)
const ocsError     = ref('')

// Block screen (ค้างหน้า ทำอะไรไม่ได้)
// type: 'IP' | 'SECURE' | 'RENT_REQUESTED' | 'ERROR'
const blockType = ref<string>('')
const blockScreen = computed(() => {
  switch (blockType.value) {
    case 'IP':
      return { title: 'ไม่อนุญาตให้เข้าใช้งานจากเครื่องนี้', message: 'IP not allowed', icon: 'text-red-400' }
    case 'SECURE':
      return { title: 'ผู้ป่วยร้องขอปกปิดข้อมูล', message: 'กรุณาติดต่อ Admin', icon: 'text-amber-500' }
    case 'RENT_REQUESTED':
      return { title: 'มีการลงทะเบียนขอยืมแฟ้มแล้ว', message: 'กรุณาติดต่อ Admin', icon: 'text-sky-500' }
    case 'ERROR':
      return { title: 'ไม่สามารถเปิดจาก OCS ได้', message: ocsError.value, icon: 'text-red-400' }
    default:
      return null
  }
})

// Rent registration modal
const showRentModal = ref(false)
const rentSaving = ref(false)
const rentReasons = ref<any[]>([])
const rentForm = ref({
  userId: '', clinCode: '', patId: '',
  rentCode: '', rentSdtRaw: '', rentEdtRaw: '', rentRemark: '',
})

// Secure registration modal (ปกปิดข้อมูลผู้ป่วย)
const showSecureModal = ref(false)
const secureSaving = ref(false)
const secureExists = ref(false)   // true = มี request ค้างแล้ว → แสดงข้อความแทนฟอร์ม
const secureForm = ref({ userId: '', patId: '', memo: '' })

// แสดง PATID (8 หลัก padded) เป็นรูปแบบ HN ตาม config HNSEP
//   HNSEP='Y' → "ปี-HN" (ปี 2 หลักหน้า, HN ที่เหลือ trim ซ้าย)
//   HNSEP='N' → HN 8 หลัก (trim)
function formatHnDisplay(patId: string | undefined): string {
  if (!patId) return ''
  if (patientStore.hnConfig.hnSep === 'Y') {
    const yr = patId.substring(0, 2)
    const hn = patId.substring(2).trim()
    return `${hn}-${yr}`
  }
  return patId.trim()
}

// Filter
const activeFilter = ref('ALL')
const filters   = [{ label: 'ALL', value: 'ALL' }, { label: 'OPD', value: 'O' }, { label: 'IPD', value: 'I' }]

// Treats
const allTreats     = ref<any[]>([])
const viewPages     = ref<any[]>([])
const activeGroup   = ref('')
const activeTreat   = ref<number|null>(null)
const expandedGroups = ref<Set<string>>(new Set())

// Image viewer
const viewerOpen = ref(false)
const viewerIdx  = ref(0)
const vZoom      = ref(1)
const vRotate    = ref(0)

// Watermark config (โหลดตอน mount)
const wmEnabled = ref(false)
const wmOpacity = ref(0.2)

// PrintNeed (request ขอพิมพ์ — สำหรับ auth != 3)
const showPrintNeedModal = ref(false)
const printNeedExists = ref(false)      // true = มี request ค้างแล้ว → แสดงข้อความแจ้ง
const printNeedSaving = ref(false)
const printReasons = ref<any[]>([])
const printClinics = ref<any[]>([])
const printNeedForm = ref({
  pageNo: 0,
  patId: '',
  userId: '',
  cDate: '',          // yyyy-mm-dd แสดงใน date picker
  printCode: '',
  needClin: '',
})
const viewerSrc  = computed(() => {
  const p = viewPages.value[viewerIdx.value]
  // fmt=jpg → backend แปลง tiff เป็น jpeg เต็มขนาด (Chrome/Edge แสดง tiff ตรงๆ ไม่ได้)
  return p ? `/api/image/${p.PAGENO}?ext=${p.EXTENSION||'jpg'}&fmt=jpg` : ''
})
const viewerLabel = computed(() => {
  const p = viewPages.value[viewerIdx.value]
  return p ? `หน้า ${p.PAGE} — ${p.FORMCODE}` : ''
})

// Watch patientStore.viewerPatient — reload treats when patient/treat changes
watch(() => patientStore.viewerPatient, async (patient) => {
  if (patient) {
    await loadTreats(patient.PATID)
  } else {
    allTreats.value = []; viewPages.value = []
    activeGroup.value = ''; activeTreat.value = null
    expandedGroups.value = new Set()
  }
}, { immediate: true })

watch(() => activeFilter.value, () => {
  expandedGroups.value = new Set()
  activeGroup.value = ''; activeTreat.value = null; viewPages.value = []
})

// ─── OCS Launch ────────────────────────────────────────────────
function qp(...keys: string[]): string {
  for (const k of keys) {
    const v = route.query[k]
    if (typeof v === 'string' && v) return v
  }
  return ''
}

function todayIso(): string {
  return new Date().toISOString().substring(0, 10)   // yyyy-mm-dd สำหรับ <input type=date>
}

async function handleOcsLaunch(): Promise<boolean> {
  const mode = qp('PROGRAMMODE', 'programmode').toUpperCase()
  if (mode !== 'OCS') return false

  ocsLaunching.value = true
  ocsError.value = ''
  try {
    const data = await authStore.ocsLaunch({
      patId:    qp('PATID', 'patid'),
      userId:   qp('USERID', 'userid'),
      clinCode: qp('CLINCODE', 'clincode'),
      inDate:   qp('INDATE', 'indate'),
      ocmNum:   qp('OCMNUM', 'ocmnum'),
    })

    // ลบ query ออกจาก URL ทันที (กัน refresh ยิงซ้ำ + ซ่อนข้อมูลคนไข้)
    router.replace({ path: '/viewer' })

    // ตรวจผล access control
    const status = data.accessStatus || 'OK'
    if (status === 'BLOCKSECURE') {
      blockType.value = 'SECURE'           // ค้างหน้า
      return false
    }
    if (status === 'BLOCKRENT') {
      if (data.rentAlreadyRequested) {
        blockType.value = 'RENT_REQUESTED' // ค้างหน้า "ลงทะเบียนแล้ว"
        return false
      }
      // ยังไม่เคย request → เปิด modal ลงทะเบียนยืมแฟ้ม
      await openRentModal(data)
      return false
    }

    // OK → fill viewer ตามปกติ
    await fillViewer(data)
    return true
  } catch (e: any) {
    // IP not allowed (backend คืน 403 พร้อม error) หรือ error อื่น → ค้างหน้า ไม่เด้งไปไหน
    const msg = e.response?.data?.error || 'ไม่สามารถเปิดจาก OCS ได้'
    if (msg.includes('IP not allowed') || msg.includes('เครื่องนี้')) {
      blockType.value = 'IP'
    } else {
      ocsError.value = msg
      blockType.value = 'ERROR'
    }
    return false
  } finally {
    ocsLaunching.value = false
  }
}

async function fillViewer(data: any) {
  await patientStore.loadHnConfig()
  const treat = data.treat
  const patient: any = { PATID: treat.PATID, NAME: treat.PATNAME || '' }
  const treatForStore = {
    treatNo:   treat.TREATNO,
    ocmNum:    treat.OCMNUM,
    vstNum:    treat.VSTNUM,
    admNum:    treat.ADMNUM,
    clinCode:  treat.CLINCODE,
    classType: treat.CLASS,
  }
  patientStore.setViewerTreat(patient, treatForStore)
}

async function openRentModal(data: any) {
  // เตรียมฟอร์ม — fill auto จาก OCS (แก้ไม่ได้)
  rentForm.value = {
    userId:   data.userId || authStore.user?.userId || '',
    clinCode: data.clinCode || authStore.ocsClinCode || '',
    patId:    data.treat?.PATID || '',
    rentCode: '',
    rentSdtRaw: todayIso(),       // default วันนี้
    rentEdtRaw: todayIso(),       // default วันนี้
    rentRemark: '',
  }
  try {
    const res = await api.get('/rent/reasons')
    rentReasons.value = res.data
  } catch (e) { console.error(e); rentReasons.value = [] }
  showRentModal.value = true
}

async function saveRent() {
  if (!rentForm.value.rentCode) { await dlgAlert('กรุณาเลือกเหตุผลในการยืมแฟ้ม', { type: 'warning' }); return }
  if (!rentForm.value.rentSdtRaw || !rentForm.value.rentEdtRaw) {
    await dlgAlert('กรุณาระบุวันที่', { type: 'warning' }); return
  }
  rentSaving.value = true
  try {
    // หา RENTNAME จาก dropdown ที่เลือก
    const reason = rentReasons.value.find(r => r.DtlCod === rentForm.value.rentCode)
    await api.post('/rent/register', {
      userId:   rentForm.value.userId,
      clinCode: rentForm.value.clinCode,
      patId:    rentForm.value.patId,
      rentCode: rentForm.value.rentCode,
      rentName: reason?.DtlCodNam || '',
      rentSdt:  rentForm.value.rentSdtRaw.replace(/-/g, ''),   // yyyymmdd
      rentEdt:  rentForm.value.rentEdtRaw.replace(/-/g, ''),
      rentRemark: rentForm.value.rentRemark,
    })
    showRentModal.value = false
    await dlgAlert('บันทึกการขอยืมแฟ้มเรียบร้อย กรุณาปิดหน้าต่าง', { type: 'success' })
    // พยายามปิด browser (OCS เปิดด้วย shell มักปิดได้); ถ้าปิดไม่ได้ ให้ค้างหน้า
    window.close()
    blockType.value = 'RENT_REQUESTED'
  } catch (e: any) {
    await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
  } finally {
    rentSaving.value = false
  }
}

// ─── Secure registration (ปกปิดข้อมูลผู้ป่วย) ──────────────────
async function openSecureModal() {
  if (!patientStore.viewerPatient) return
  const patId = patientStore.viewerPatient.PATID || ''
  secureForm.value = { userId: authStore.user?.userId || '', patId, memo: '' }
  secureExists.value = false
  showSecureModal.value = true
  // เช็คว่ามี request ปกปิดค้างอยู่แล้วไหม → ถ้ามี เปลี่ยน modal เป็นข้อความแจ้ง
  try {
    const res = await api.get('/rent/secure/check', { params: { patId } })
    secureExists.value = !!res.data.exists
  } catch (e) { console.error(e) }
}

async function saveSecure() {
  if (!secureForm.value.memo.trim()) {
    await dlgAlert('กรุณาระบุเหตุผล', { type: 'warning' }); return
  }
  secureSaving.value = true
  try {
    await api.post('/rent/secure', {
      userId: secureForm.value.userId,
      patId:  secureForm.value.patId,
      memo:   secureForm.value.memo.trim(),
    })
    showSecureModal.value = false
    await dlgAlert('ลงทะเบียนปกปิดข้อมูลเรียบร้อย รอผู้ดูแลระบบอนุมัติ', { type: 'success' })
  } catch (e: any) {
    // ถ้า backend คืน 409 (มี request แล้ว) → เปลี่ยน modal เป็นข้อความแจ้ง
    if (e.response?.status === 409) {
      secureExists.value = true
    } else {
      await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
    }
  } finally {
    secureSaving.value = false
  }
}

// ─── Treats / Pages ───────────────────────────────────────────
interface TreatGroup { formCode: string; formName: string; totalCnt: number; treats: any[] }

const filteredTreats = computed(() =>
  activeFilter.value === 'ALL' ? allTreats.value : allTreats.value.filter(t => t.CLASS === activeFilter.value))

const filteredGroups = computed<TreatGroup[]>(() => {
  const map = new Map<string, TreatGroup>()
  filteredTreats.value.forEach(t => {
    const formCodes = t._formCodes as string[] || []
    formCodes.forEach(fc => {
      if (!map.has(fc)) map.set(fc, { formCode: fc, formName: t._formNames?.[fc] || fc, totalCnt: 0, treats: [] })
      const g = map.get(fc)!
      g.totalCnt += t._formCntMap?.[fc] || 0
      if (!g.treats.find((x: any) => x.TREATNO === t.TREATNO)) g.treats.push({ ...t, CNT: t._formCntMap?.[fc] || 0 })
    })
  })
  return Array.from(map.values()).sort((a, b) => b.totalCnt - a.totalCnt)
})

const activeGroupName = computed(() => {
  const g = filteredGroups.value.find(x => x.formCode === activeGroup.value)
  return g ? `${g.formName} [${g.totalCnt}]` : ''
})

async function loadTreats(hn: string) {
  loading.value = true
  allTreats.value = []; expandedGroups.value = new Set()
  activeGroup.value = ''; activeTreat.value = null; viewPages.value = []
  try {
    const treats = await api.get('/viewer/treatments', { params: { hn } }).then(r => r.data)
    const enhanced = await Promise.all(treats.map(async (t: any) => {
      const pages = await api.get('/chartpages/' + t.TREATNO).then(r => r.data)
      const formCntMap: Record<string, number> = {}
      const formNames: Record<string, string> = {}
      pages.forEach((p: any) => {
        formCntMap[p.formCode] = (formCntMap[p.formCode] || 0) + 1
        if (p.formName) formNames[p.formCode] = p.formName
      })
      return { ...t, _formCodes: Object.keys(formCntMap), _formCntMap: formCntMap, _formNames: formNames }
    }))
    allTreats.value = enhanced
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function selectGroup(g: TreatGroup) {
  if (expandedGroups.value.has(g.formCode)) expandedGroups.value.delete(g.formCode)
  else expandedGroups.value.add(g.formCode)
  expandedGroups.value = new Set(expandedGroups.value)
  activeGroup.value = g.formCode; activeTreat.value = null
  loadingPages.value = true; viewPages.value = []
  try {
    const hn = patientStore.viewerPatient?.PATID || ''
    const pages = await api.get('/viewer/pages', { params: { hn, formCode: g.formCode, classFilter: activeFilter.value } }).then(r => r.data)
    viewPages.value = pages
  } catch (e) { console.error(e) }
  finally { loadingPages.value = false }
}

async function selectTreat(formCode: string, t: any) {
  activeGroup.value = formCode; activeTreat.value = t.TREATNO
  loadingPages.value = true; viewPages.value = []
  try {
    const pages = await api.get('/viewer/pages/treat', { params: { treatNo: t.TREATNO, formCode } }).then(r => r.data)
    viewPages.value = pages
  } catch (e) { console.error(e) }
  finally { loadingPages.value = false }
}

function openViewer(idx: number) { viewerIdx.value = idx; vZoom.value = 1; vRotate.value = 0; viewerOpen.value = true }
function navViewer(dir: number) {
  const next = viewerIdx.value + dir
  if (next >= 0 && next < viewPages.value.length) { viewerIdx.value = next; vZoom.value = 1; vRotate.value = 0 }
}

// กดปุ่ม print: เช็ค auth ก่อน
//   auth='3' → พิมพ์ได้เลย
//   auth!='3' → เช็คว่ามี request PRINTNEEDT ค้างไหม
//      มีแล้ว → modal แจ้ง "ขอ print แล้ว ติดต่อ admin"
//      ยังไม่มี → modal request print need
async function printCurrentImage() {
  const p = viewPages.value[viewerIdx.value]
  if (!p) return
  const pageNo = p.PAGENO
  try {
    const res = await api.get('/printneed/check', { params: { pageNo } })
    const auth = res.data.auth
    if (auth === '3') {
      doPrint()                      // พิมพ์ได้เลย
      return
    }
    // auth != 3 → เช็ค request
    if (res.data.hasRequest) {
      printNeedExists.value = true   // มี request แล้ว
      showPrintNeedModal.value = true
      return
    }
    // ยังไม่มี → เปิด modal request print need
    await openPrintNeedModal(pageNo, res.data.patId || '')
  } catch (e: any) {
    await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
  }
}

// พิมพ์รูปจริง — เปิดหน้าต่างใหม่ใส่รูปเดียว (+ watermark ถ้าเปิด) แล้วสั่งพิมพ์
function doPrint() {
  const src = viewerSrc.value
  if (!src) return
  const win = window.open('', '_blank')
  if (!win) return

  const wm = wmEnabled.value
    ? `<img class="wm" src="/api/watermark/image" style="opacity:${wmOpacity.value}" />`
    : ''

  win.document.write(`
    <html><head><title>Print</title>
    <style>
      @media print { @page { margin: 0; } }
      body { margin: 0; }
      .wrap { position: relative; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
      .doc { max-width: 100%; max-height: 100vh; object-fit: contain; }
      .wm { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            max-width: 60%; max-height: 60%; object-fit: contain; pointer-events: none; }
    </style></head>
    <body><div class="wrap">
      <img class="doc" src="${src}" />
      ${wm}
    </div>
    <script>
      (function(){
        var imgs = document.images, total = imgs.length, loaded = 0;
        function done(){ loaded++; if (loaded >= total) { window.print(); window.onafterprint = function(){ window.close(); }; } }
        for (var i=0;i<total;i++){
          if (imgs[i].complete) done();
          else { imgs[i].onload = done; imgs[i].onerror = done; }
        }
      })();
    <\/script>
    </body></html>`)
  win.document.close()
}

// เปิด modal request print need
async function openPrintNeedModal(pageNo: number, patId: string) {
  printNeedExists.value = false
  printNeedForm.value = {
    pageNo,
    patId,
    userId: authStore.user?.userId || '',
    cDate: todayIso(),
    printCode: '',
    needClin: '',
  }
  // โหลด dropdown ครั้งแรก (cache ไว้)
  if (printReasons.value.length === 0) {
    try { printReasons.value = (await api.get('/printneed/reasons')).data } catch (e) { console.error(e) }
  }
  if (printClinics.value.length === 0) {
    try { printClinics.value = (await api.get('/printneed/clinics')).data } catch (e) { console.error(e) }
  }
  showPrintNeedModal.value = true
}

async function savePrintNeed() {
  if (!printNeedForm.value.printCode) { await dlgAlert('กรุณาเลือกเหตุผล', { type: 'warning' }); return }
  printNeedSaving.value = true
  try {
    await api.post('/printneed/register', {
      pageNo: String(printNeedForm.value.pageNo),
      printCode: printNeedForm.value.printCode,
      needClin: printNeedForm.value.needClin,
    })
    showPrintNeedModal.value = false
    await dlgAlert('บันทึกคำขอพิมพ์เรียบร้อย รอผู้ดูแลระบบดำเนินการ', { type: 'success' })
  } catch (e: any) {
    if (e.response?.status === 409) {
      printNeedExists.value = true   // มี request แล้ว → สลับเป็นข้อความแจ้ง
    } else {
      await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
    }
  } finally {
    printNeedSaving.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (!viewerOpen.value) return
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); navViewer(1) }
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); navViewer(-1) }
  else if (e.key === 'Escape') { viewerOpen.value = false }
}

function formatDate(d: string) {
  if (!d || d.length < 8) return d || '-'
  return `${d.substring(6,8)}-${d.substring(4,6)}-${d.substring(0,4)}`
}

onMounted(async () => {
  await handleOcsLaunch()
  document.addEventListener('keydown', onKeydown)
  // โหลด config watermark (เปิด/ปิด + opacity)
  try {
    const res = await api.get('/watermark/config')
    wmEnabled.value = !!res.data.enabled
    wmOpacity.value = typeof res.data.opacity === 'number' ? res.data.opacity : 0.2
  } catch (e) { console.error(e) }
})
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.viewer-btn { background: rgba(255,255,255,0.12); border: none; color: white; padding: 0.35rem 0.65rem; border-radius: 0.375rem; font-size: 0.875rem; cursor: pointer; transition: background 0.15s; }
.viewer-btn:hover { background: rgba(255,255,255,0.28); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
