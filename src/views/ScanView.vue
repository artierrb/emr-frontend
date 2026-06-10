<template>
  <div class="grid gap-4 h-[calc(100vh-120px)]" style="grid-template-columns:2fr 1fr 2fr;">

    <!-- Col 1: Scanner + Browse -->
    <div class="flex flex-col gap-4 min-h-0">
      <!-- Scanner panel -->
      <div class="card flex-shrink-0">
        <div class="card-header"><i class="bi bi-usb-symbol" /> Scanner</div>
        <div class="p-4 space-y-3">
          <div>
            <label class="form-label">Profile</label>
            <select class="form-select" disabled>
              <option>-- (coming soon) --</option>
            </select>
          </div>
          <button class="btn-outline w-full justify-center" :disabled="connectingScanner" @click="connectScanner">
            <span v-if="connectingScanner" class="loading-spinner" />
            <i v-else class="bi bi-plugin" /> Connect Scanner
          </button>
          <p class="text-xs text-gray-400 text-center">เปิด EMRScan.exe พร้อม login อัตโนมัติ</p>
        </div>
      </div>

      <!-- Browse file -->
      <div class="card flex-1 flex flex-col min-h-0">
        <div class="card-header">
          <i class="bi bi-folder2-open" /> เลือกไฟล์
          <span class="ml-auto text-xs text-gray-400 font-normal">JPG PNG TIF PDF</span>
        </div>
        <div class="p-3 flex flex-col flex-1 min-h-0">
          <div
            class="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-sky-400 hover:bg-sky-50 transition-colors flex-shrink-0"
            :class="{ 'border-sky-400 bg-sky-50': dragging }"
            @click="fileInput?.click()"
            @dragover.prevent="dragging = true"
            @dragleave="dragging = false"
            @drop.prevent="onDrop"
          >
            <i class="bi bi-cloud-arrow-up text-2xl text-gray-400 block mb-1" />
            <p class="text-xs text-gray-500">
              <strong class="text-[#1a4f7a]">คลิก</strong> หรือลากมาวาง
            </p>
          </div>
          <input ref="fileInput" type="file" multiple accept=".jpg,.jpeg,.png,.tif,.tiff,.pdf"
            class="hidden" @change="onFileSelect" />

          <div class="flex-1 overflow-y-auto mt-2 min-h-0">
            <div v-if="scanStore.selectedFiles.length > 0" class="grid grid-cols-2 gap-1.5">
              <div v-for="(f, i) in scanStore.selectedFiles" :key="i"
                class="border border-gray-200 rounded-lg overflow-hidden relative bg-white">
                <img v-if="f.type.startsWith('image/')" :src="previewUrls[i]" class="w-full h-20 object-cover" />
                <div v-else class="w-full h-20 flex items-center justify-center bg-red-50">
                  <i class="bi bi-file-pdf text-2xl text-red-500" />
                </div>
                <div class="px-1 py-0.5 text-[10px] text-gray-400 truncate">{{ i + 1 }}. {{ f.name }}</div>
                <button
                  class="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/40 text-white text-[10px] flex items-center justify-center hover:bg-black/60"
                  @click.stop="scanStore.removeFile(i)">
                  <i class="bi bi-x" />
                </button>
              </div>
            </div>
            <div v-else class="empty-state py-6">
              <i class="bi bi-images text-2xl block mb-1" />
              <p class="text-xs">ยังไม่มีไฟล์</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Col 2: Scan + Upload + Form list -->
    <div class="card flex flex-col items-center gap-3 p-4 overflow-hidden">
      <button
        class="w-32 h-32 rounded-2xl border-4 border-[#1a4f7a] text-[#1a4f7a] flex flex-col items-center justify-center gap-2 hover:bg-blue-50 transition-colors cursor-not-allowed opacity-60 flex-shrink-0"
        disabled title="Scanner integration อยู่ระหว่างพัฒนา">
        <i class="bi bi-scanner text-4xl" />
        <span class="font-bold text-lg">SCAN</span>
      </button>

      <button
        class="w-32 h-10 rounded-xl border-2 flex items-center justify-center gap-2 text-sm font-medium transition-colors flex-shrink-0"
        :class="scanStore.uploading || scanStore.selectedFiles.length === 0
          ? 'border-gray-200 text-gray-400 cursor-not-allowed'
          : 'border-sky-400 text-sky-600 hover:bg-sky-50'"
        :disabled="scanStore.uploading || scanStore.selectedFiles.length === 0"
        @click="upload">
        <i class="bi bi-cloud-upload" /> Upload
      </button>

      <div v-if="scanStore.uploading" class="w-full space-y-1 flex-shrink-0">
        <div class="flex justify-between text-xs text-gray-500">
          <span>กำลังบันทึก...</span><span>{{ scanStore.uploadProgress }}%</span>
        </div>
        <div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div class="h-full bg-sky-400 rounded-full transition-all"
            :style="{ width: scanStore.uploadProgress + '%' }" />
        </div>
      </div>

      <div v-if="scanStore.selectedFiles.length > 0" class="text-xs text-gray-500 flex-shrink-0">
        {{ scanStore.selectedFiles.length }} ไฟล์รอ upload
      </div>

      <hr class="w-full border-gray-100 flex-shrink-0" />

      <!-- ประเภทฟอร์ม list -->
      <div class="w-full flex flex-col flex-1 min-h-0">
        <div class="flex items-center justify-between mb-1 flex-shrink-0">
          <p class="text-xs font-semibold text-gray-500">
            ประเภทฟอร์ม <span class="text-red-500">*</span>
          </p>
          <!-- badge cnt ของ treatno ที่เลือก -->
          <span v-if="scanStore.selectedTreatNo && selectedFormCnt !== null"
            class="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {{ selectedFormCnt }}
          </span>
        </div>
        <div class="flex-1 overflow-y-auto border border-gray-200 rounded-lg min-h-0">
          <div v-for="f in sortedForms" :key="f.formCode"
            class="px-3 py-2 text-xs border-b border-gray-100 last:border-0 transition-colors relative"
            :class="moveMode
              ? scanStore.selectedFormCode === f.formCode
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : moveTargetForm === f.formCode
                  ? 'bg-red-100 text-red-700 font-semibold cursor-pointer'
                  : 'text-gray-700 hover:bg-red-50 cursor-pointer'
              : scanStore.selectedFormCode === f.formCode
                ? 'bg-blue-100 text-blue-800 font-semibold cursor-pointer'
                : 'text-gray-700 hover:bg-blue-50 cursor-pointer'"
            @click="onFormClick(f.formCode)">
            <div class="font-mono text-[10px] text-gray-400">{{ f.formCode }}</div>
            <div>{{ f.name }}</div>
            <!-- cnt badge per form -->
            <span v-if="scanStore.selectedTreatNo && scanStore.formCountMap[f.formCode]"
              class="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full leading-none">
              {{ scanStore.formCountMap[f.formCode] }}
            </span>
          </div>
          <div v-if="scanStore.forms.length === 0" class="text-center py-4 text-gray-400 text-xs">
            ไม่มีข้อมูลฟอร์ม
          </div>
        </div>
      </div>
    </div>

    <!-- Col 3: Patient info + แฟ้มผู้ป่วย table -->
    <div class="card flex flex-col min-h-0">
      <div class="card-header"><i class="bi bi-person-vcard" /> ข้อมูลผู้ป่วย</div>
      <div class="p-4 flex flex-col flex-1 min-h-0 gap-4">

        <!-- HN -->
        <div class="flex-shrink-0">
          <label class="form-label">HN (รหัสผู้ป่วย) <span class="text-red-500">*</span></label>
          <HnInputer ref="hnInputer" :is-sep="patientStore.hnConfig.hnSep === 'Y'"
            @search="onHnSearch" @open-search="showSearch = true" @clear="clearPatient" />
          <PatientInfoBox :patient="patientStore.selectedPatient" :hn="lastHn"
            :not-found="notFound" @clear="clearPatient" />
        </div>

        <!-- แฟ้มผู้ป่วย table -->
        <div class="flex flex-col min-h-0" style="height:45%;">
          <div class="flex items-center gap-2 mb-1 flex-shrink-0">
            <label class="form-label mb-0">แฟ้มผู้ป่วย <span class="text-red-500">*</span></label>
            <span v-if="scanStore.loadingTreatments" class="loading-spinner" />
            <div class="ml-auto flex gap-1">
              <button
                class="w-6 h-6 flex items-center justify-center rounded border border-gray-200 bg-white text-gray-600 text-xs hover:border-blue-400 hover:text-blue-700 transition-colors"
                title="เพิ่มแฟ้ม"
                :disabled="!patientStore.selectedPatient"
                @click="showTreatForm = true"
              ><i class="bi bi-plus-lg" /></button>
              <button
                class="w-6 h-6 flex items-center justify-center rounded border border-gray-200 bg-white text-xs hover:border-red-400 hover:text-red-600 transition-colors"
                :class="scanStore.selectedTreatNo ? 'text-gray-600' : 'text-gray-300 cursor-not-allowed'"
                title="ลบแฟ้มที่เลือก"
                :disabled="!scanStore.selectedTreatNo"
                @click="showConfirmDelete = true"
              ><i class="bi bi-trash" /></button>
            </div>
          </div>

          <div class="flex-1 overflow-auto border border-gray-200 rounded-lg min-h-0">
            <table class="w-full text-[11px] border-collapse">
              <thead class="sticky top-0 z-10">
                <tr>
                  <th class="treat-th">I/O</th>
                  <th class="treat-th">Dept</th>
                  <th class="treat-th">In</th>
                  <th class="treat-th">Out</th>
                  <th class="treat-th">Dr.</th>
                  <th class="treat-th text-center">C1</th>
                  <th class="treat-th text-center">C2</th>
                  <th class="treat-th text-center">Inco</th>
                  <th class="treat-th text-right">Cnt</th>
                  <th class="treat-th">DeptCode</th>
                  <th class="treat-th">DrCode</th>
                  <th class="treat-th text-right">TreatNo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="scanStore.treatments.length === 0">
                  <td colspan="12" class="text-center py-4 text-gray-400">
                    {{ patientStore.selectedPatient ? 'ไม่พบข้อมูล' : 'เลือกผู้ป่วยก่อน' }}
                  </td>
                </tr>
                <tr v-for="t in scanStore.treatments" :key="t.TREATNO"
                  class="cursor-pointer hover:bg-blue-50 transition-colors"
                  :class="scanStore.selectedTreatNo === t.TREATNO ? 'bg-blue-100' : ''"
                  @click="scanStore.selectTreatment(t)">
                  <td class="treat-td font-bold" :class="t.CLASS === 'I' ? 'text-blue-700' : 'text-green-700'">
                    {{ t.CLASS }}
                  </td>
                  <td class="treat-td truncate max-w-[70px]" :title="t.CLINNAME">{{ t.CLINNAME }}</td>
                  <td class="treat-td whitespace-nowrap">{{ formatDate(t.INDATE) }}</td>
                  <td class="treat-td whitespace-nowrap">{{ formatDate(t.OUTDATE) }}</td>
                  <td class="treat-td truncate max-w-[60px]" :title="t.DOCNAME">{{ t.DOCNAME }}</td>
                  <td class="treat-td text-center" @click.stop>
                    <input type="checkbox" :checked="t.CHECKED === '1'"
                      class="cursor-pointer"
                      @change="scanStore.toggleCheck(t.TREATNO, 1, t.CHECKED)" />
                  </td>
                  <td class="treat-td text-center" @click.stop>
                    <input type="checkbox" :checked="t.CHECKED2 === '1'"
                      class="cursor-pointer"
                      @change="scanStore.toggleCheck(t.TREATNO, 2, t.CHECKED2)" />
                  </td>
                  <td class="treat-td text-center" @click.stop>
                    <input type="checkbox" :checked="t.CHECKED3 === '1'"
                      class="cursor-pointer"
                      @change="scanStore.toggleCheck(t.TREATNO, 3, t.CHECKED3)" />
                  </td>
                  <td class="treat-td text-right font-mono">{{ t.CNT }}</td>
                  <td class="treat-td text-gray-400">{{ t.CLINCODE }}</td>
                  <td class="treat-td text-gray-400">{{ deptCodeLabel(t) }}</td>
                  <td class="treat-td text-right font-mono text-gray-500">{{ t.TREATNO }}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

        <!-- รูปภาพจากฟอร์มที่เลือก -->
        <div class="flex flex-col min-h-0" style="flex:1;">
          <div class="flex items-center gap-2 mb-1 flex-shrink-0">
            <label class="form-label mb-0">
              รูปภาพ
              <span v-if="scanStore.selectedFormCode" class="text-gray-400 font-normal">— {{ scanStore.selectedFormCode }}</span>
            </label>
            <span v-if="loadingImages" class="loading-spinner" />
            <span v-if="imagePages.length > 0" class="text-xs text-gray-400">{{ imagePages.length }} ภาพ</span>
            <div class="ml-auto flex gap-1">
              <!-- Normal mode: ปุ่มย้ายแฟ้ม -->
              <template v-if="!moveMode">
                <button
                  v-if="imagePages.length > 0"
                  class="icon-sm-btn" title="ย้ายรูปภาพ"
                  @click="enterMoveMode"
                ><i class="bi bi-folder-symlink" /></button>
              </template>
              <!-- Move mode: ตกลง / ยกเลิก -->
              <template v-else>
                <button class="icon-sm-btn" title="select all" @click="toggleSelectAll">
                  <i :class="selectedPages.length === imagePages.length ? 'bi bi-check-square' : 'bi bi-square'" />
                </button>
                <span class="text-xs text-blue-700 self-center font-medium">เลือก {{ selectedPages.length }} ภาพ</span>
                <button class="icon-sm-btn text-green-600 hover:border-green-400" title="ตกลง" @click="confirmMove"><i class="bi bi-check-lg" /></button>
                <button class="icon-sm-btn text-red-500 hover:border-red-400" title="ยกเลิก" @click="cancelMoveMode"><i class="bi bi-x-lg" /></button>
              </template>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto border border-gray-200 rounded-lg min-h-0 p-2">
            <div v-if="!scanStore.selectedTreatNo || !scanStore.selectedFormCode"
              class="empty-state py-4">
              <i class="bi bi-images text-xl block mb-1" />
              <p class="text-xs">เลือกแฟ้มและฟอร์มเพื่อดูรูปภาพ</p>
            </div>
            <div v-else-if="loadingImages" class="flex justify-center py-4">
              <span class="loading-spinner" />
            </div>
            <div v-else-if="imagePages.length === 0" class="empty-state py-4">
              <i class="bi bi-image text-xl block mb-1" />
              <p class="text-xs">ไม่มีรูปภาพในฟอร์มนี้</p>
            </div>
            <div v-else class="grid grid-cols-3 gap-2">
              <div
                v-for="p in imagePages"
                :key="p.pageNo"
                class="border rounded-lg overflow-hidden cursor-pointer transition-all relative"
                :class="moveMode
                  ? selectedPages.includes(p.pageNo)
                    ? 'border-sky-400 ring-2 ring-sky-300'
                    : 'border-gray-200 hover:border-sky-300'
                  : 'border-gray-200 hover:border-sky-400 hover:shadow-sm'"
                @click="onThumbClick(p)"
              >
                <img
                  :src="`/api/image/${p.pageNo}?ext=${p.extension||'jpg'}&t=${p.pageNo}`"
                  class="w-full h-20 object-cover bg-gray-100"
                  :alt="`หน้า ${p.page}`"
                  @error="(e:any) => e.target.src=''"
                />
                <!-- select order badge -->
                <div v-if="moveMode && selectedPages.includes(p.pageNo)"
                  class="absolute top-1 left-1 bg-sky-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                  {{ selectedPages.indexOf(p.pageNo) + 1 }}
                </div>
                <div class="px-1 py-0.5 text-[10px] text-gray-400 text-center">หน้า {{ p.page }}</div>
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
      <div v-if="viewerImage" class="fixed inset-0 z-[9000] bg-black/85 flex flex-col"
        @click.self="viewerImage = null">
        <div class="flex items-center gap-2 px-4 py-2 bg-black/60">
          <button class="bg-white/10 border-0 text-white px-3 py-1.5 rounded text-sm cursor-pointer hover:bg-white/25" @click="viewZoom = Math.max(0.25, viewZoom-0.25)"><i class="bi bi-zoom-out" /></button>
          <button class="bg-white/10 border-0 text-white px-3 py-1.5 rounded text-sm cursor-pointer hover:bg-white/25" @click="viewZoom = Math.min(4, viewZoom+0.25)"><i class="bi bi-zoom-in" /></button>
          <button class="bg-white/10 border-0 text-white px-3 py-1.5 rounded text-sm cursor-pointer hover:bg-white/25" @click="viewZoom=1;viewRotate=0"><i class="bi bi-aspect-ratio" /></button>
          <button class="bg-white/10 border-0 text-white px-3 py-1.5 rounded text-sm cursor-pointer hover:bg-white/25" @click="viewRotate=(viewRotate+90)%360"><i class="bi bi-arrow-clockwise" /></button>
          <span class="flex-1 text-white/70 text-sm">{{ viewerImage.label }}</span>
          <span class="text-white/50 text-xs">{{ currentViewIndex + 1 }} / {{ imagePages.length }}</span>
          <button class="bg-white/10 border-0 text-white px-3 py-1.5 rounded text-sm cursor-pointer hover:bg-white/25 disabled:opacity-30"
            :disabled="currentViewIndex <= 0"
            @click="onKeydown({key:'ArrowLeft',preventDefault:()=>{}} as any)">
            <i class="bi bi-chevron-left" />
          </button>
          <button class="bg-white/10 border-0 text-white px-3 py-1.5 rounded text-sm cursor-pointer hover:bg-white/25 disabled:opacity-30"
            :disabled="currentViewIndex >= imagePages.length - 1"
            @click="onKeydown({key:'ArrowRight',preventDefault:()=>{}} as any)">
            <i class="bi bi-chevron-right" />
          </button>
          <button class="bg-white/10 border-0 text-white px-3 py-1.5 rounded text-sm cursor-pointer hover:bg-white/25" @click="viewerImage=null"><i class="bi bi-x-lg" /></button>
        </div>
        <div class="flex-1 flex items-center justify-center overflow-hidden p-4">
          <img :src="viewerImage.src"
            :style="{ transform: `scale(${viewZoom}) rotate(${viewRotate}deg)`, transition:'transform 0.2s' }"
            class="max-w-full max-h-full object-contain" />
        </div>
      </div>
    </Transition>
  </Teleport>

  <PatientSearchModal v-model="showSearch" @selected="onPatientSelected" />

  <!-- Confirm Move -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showConfirmMove" class="fixed inset-0 z-[8000] flex items-center justify-center">
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="showConfirmMove=false" />
        <div class="relative bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden">
          <div class="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
            <i class="bi bi-folder-symlink text-sky-500" />
            <span class="font-semibold text-sm">ยืนยันการย้ายรูปภาพ</span>
          </div>
          <div class="px-5 py-4 text-sm text-gray-600 space-y-1">
            <div>ย้าย <strong>{{ selectedPages.length }} ภาพ</strong></div>
            <div>จากฟอร์ม <strong class="text-blue-700">{{ scanStore.selectedFormCode }}</strong></div>
            <div>ไปยังฟอร์ม <strong class="text-red-600">{{ moveTargetForm }}</strong></div>
          </div>
          <div class="px-5 py-3 border-t border-gray-100 flex gap-2 justify-end">
            <button class="btn-outline" @click="showConfirmMove=false">ยกเลิก</button>
            <button class="btn-primary gap-1" @click="doMove">
              <i class="bi bi-folder-symlink" /> ย้ายเลย
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <TreatFormModal
    v-model="showTreatForm"
    :hn="patientStore.selectedPatient?.PATID?.trim() || ''"
    @saved="onTreatSaved"
  />

  <!-- Confirm Delete Treat -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showConfirmDelete" class="fixed inset-0 z-[8000] flex items-center justify-center">
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="showConfirmDelete = false" />
        <div class="relative bg-white rounded-xl shadow-2xl w-[360px] overflow-hidden">
          <div class="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
            <i class="bi bi-exclamation-triangle-fill text-amber-500" />
            <span class="font-semibold text-sm">ยืนยันการลบ</span>
          </div>
          <div class="px-5 py-4 text-sm text-gray-600">
            ลบแฟ้มผู้ป่วย TreatNo: <strong>{{ scanStore.selectedTreatNo }}</strong> ?
            <br /><span class="text-red-500 text-xs">หมายเหตุ: ข้อมูลการ scan ที่เชื่อมกับแฟ้มนี้จะยังคงอยู่</span>
          </div>
          <div class="px-5 py-3 border-t border-gray-100 flex gap-2 justify-end">
            <button class="btn-outline" @click="showConfirmDelete = false">ยกเลิก</button>
            <button class="btn-danger gap-1" @click="deleteTreat">
              <i class="bi bi-trash" /> ลบ
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useDialog } from '@/composables/useDialog'
const { alert: dlgAlert, confirm: dlgConfirm } = useDialog()
import { usePatientStore } from '@/stores/patient'
import { useScanStore } from '@/stores/scan'
import type { Patient, TreatmentFull } from '@/types'
import { treatApi, viewerApi } from '@/services/api'
import apiBase from '@/services/api'
import HnInputer from '@/components/common/HnInputer.vue'
import PatientInfoBox from '@/components/common/PatientInfoBox.vue'
import PatientSearchModal from '@/components/common/PatientSearchModal.vue'
import TreatFormModal from '@/components/common/TreatFormModal.vue'

const patientStore = usePatientStore()
const scanStore = useScanStore()

const hnInputer = ref<InstanceType<typeof HnInputer>>()
const fileInput = ref<HTMLInputElement>()
const showSearch = ref(false)
const showTreatForm = ref(false)
const showConfirmDelete = ref(false)
const dragging = ref(false)
const lastHn = ref('')
const notFound = ref(false)

const imagePages = ref<any[]>([])
const currentViewIndex = ref(-1)
const moveMode = ref(false)
const selectedPages = ref<number[]>([])
const moveTargetForm = ref('')
const showConfirmMove = ref(false)
const loadingImages = ref(false)
const viewerImage = ref<{src:string;label:string}|null>(null)
const viewZoom = ref(1)
const viewRotate = ref(0)

const previewUrls = computed(() =>
  scanStore.selectedFiles.map(f => f.type.startsWith('image/') ? URL.createObjectURL(f) : '')
)

// Sort forms by cnt desc when treatno selected
const sortedForms = computed(() => {
  if (!scanStore.selectedTreatNo || Object.keys(scanStore.formCountMap).length === 0) {
    return scanStore.forms
  }
  return [...scanStore.forms].sort((a, b) => {
    const ca = scanStore.formCountMap[a.formCode] || 0
    const cb = scanStore.formCountMap[b.formCode] || 0
    return cb - ca
  })
})

// Total cnt of selected treatno
const selectedFormCnt = computed(() => {
  if (!scanStore.selectedTreatNo) return null
  return Object.values(scanStore.formCountMap).reduce((s, v) => s + v, 0)
})

function formatDate(d: string) {
  if (!d || d.length < 8) return ''
  return `${d.substring(6,8)}-${d.substring(4,6)}-${d.substring(0,4)}`
}

function deptCodeLabel(t: TreatmentFull) {
  const vn = (t.VSTNUM || '').trim()
  const an = (t.ADMNUM || '').trim()
  if (t.CLASS === 'O' && vn) return `${t.DOCCODE}[VN:${vn}]`
  if (t.CLASS === 'I' && an) return `${t.DOCCODE}[AN:${an}]`
  return t.DOCCODE || ''
}

onMounted(async () => { await scanStore.loadPrgMode() })

// Keyboard navigation for image viewer
function onKeydown(e: KeyboardEvent) {
  if (!viewerImage.value) return
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault()
    const next = currentViewIndex.value + 1
    if (next < imagePages.value.length) {
      currentViewIndex.value = next
      const p = imagePages.value[next]
      viewerImage.value = { src: `/api/image/${p.pageNo}?ext=${p.extension||'jpg'}&t=${p.pageNo}`, label: `หน้า ${p.page} — ${p.formCode}` }
    }
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault()
    const prev = currentViewIndex.value - 1
    if (prev >= 0) {
      currentViewIndex.value = prev
      const p = imagePages.value[prev]
      viewerImage.value = { src: `/api/image/${p.pageNo}?ext=${p.extension||'jpg'}&t=${p.pageNo}`, label: `หน้า ${p.page} — ${p.formCode}` }
    }
  } else if (e.key === 'Escape') {
    viewerImage.value = null
  }
}

watch(() => viewerImage.value, (v) => {
  if (v) document.addEventListener('keydown', onKeydown)
  else document.removeEventListener('keydown', onKeydown)
})

watch([() => scanStore.selectedTreatNo, () => scanStore.selectedFormCode], async ([treatNo, formCode]) => {
  imagePages.value = []
  if (!treatNo || !formCode) return
  loadingImages.value = true
  try {
    const pages = await viewerApi.getChartPages(treatNo as number)
    imagePages.value = pages.filter((p: any) => p.formCode === formCode)
  } catch (e) {
    console.error(e)
  } finally {
    loadingImages.value = false
  }
})

watch(() => patientStore.selectedPatient, async (patient) => {
  if (patient) await scanStore.loadTreatments(patient.PATID)
  else scanStore.clearTreatments()
})

async function onHnSearch(hn: string) {
  lastHn.value = hn; notFound.value = false; patientStore.clearPatient()
  if (!hn) return
  const found = await patientStore.findByHn(hn)
  if (found) patientStore.selectPatient(found)
  else notFound.value = true
}

function onPatientSelected(p: Patient) {
  hnInputer.value?.setValue(p.PATID)
  lastHn.value = p.PATID.trim()
  notFound.value = false
}

function clearPatient() {
  patientStore.clearPatient()
  hnInputer.value?.resetSilent()
  lastHn.value = ''; notFound.value = false
  scanStore.clearTreatments()
  imagePages.value = []
}

function onFileSelect(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files) scanStore.addFiles(Array.from(files))
}

function onDrop(e: DragEvent) {
  dragging.value = false
  if (e.dataTransfer?.files) scanStore.addFiles(Array.from(e.dataTransfer.files))
}

// ── Move mode ────────────────────────────────────────────────
function enterMoveMode() {
  moveMode.value = true
  selectedPages.value = []
  moveTargetForm.value = ''
}

function cancelMoveMode() {
  moveMode.value = false
  selectedPages.value = []
  moveTargetForm.value = ''
}

function onThumbClick(p: any) {
  if (!moveMode.value) {
    currentViewIndex.value = imagePages.value.findIndex((x: any) => x.pageNo === p.pageNo)
    viewerImage.value = { src: `/api/image/${p.pageNo}?ext=${p.extension||'jpg'}&t=${p.pageNo}`, label: `หน้า ${p.page} — ${p.formCode}` }
    return
  }
  const idx = selectedPages.value.indexOf(p.pageNo)
  if (idx >= 0) selectedPages.value.splice(idx, 1)
  else selectedPages.value.push(p.pageNo)
}

function toggleSelectAll() {
  if (selectedPages.value.length === imagePages.value.length) {
    selectedPages.value = []
  } else {
    selectedPages.value = imagePages.value.map((p: any) => p.pageNo)
  }
}

function onFormClick(formCode: string) {
  if (!moveMode.value) {
    scanStore.selectedFormCode = formCode
    return
  }
  // In move mode: cannot select current form
  if (formCode === scanStore.selectedFormCode) return
  moveTargetForm.value = moveTargetForm.value === formCode ? '' : formCode
}

async function confirmMove() {
  if (selectedPages.value.length === 0) { await dlgAlert('กรุณาเลือกรูปภาพก่อน', { type: 'warning' }); return }
  if (!moveTargetForm.value) { await dlgAlert('กรุณาเลือกฟอร์มปลายทาง (กดที่ฟอร์มในรายการ)', { type: 'warning' }); return }
  showConfirmMove.value = true
}

async function doMove() {
  try {
    await viewerApi.movePages(selectedPages.value, moveTargetForm.value)
    showConfirmMove.value = false
    cancelMoveMode()
    // reload images from current formCode (moved pages disappear)
    if (scanStore.selectedTreatNo && scanStore.selectedFormCode) {
      loadingImages.value = true
      try {
        const pages = await viewerApi.getChartPages(scanStore.selectedTreatNo)
        imagePages.value = pages.filter((p: any) => p.formCode === scanStore.selectedFormCode)
      } finally { loadingImages.value = false }
    }
    // refresh formCount so badge updates
    if (scanStore.selectedTreatNo) {
      await scanStore.selectTreatment(scanStore.selectedTreat!)
    }
  } catch (e: any) {
    await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
  }
}

async function deleteTreat() {
  if (!scanStore.selectedTreatNo) return
  try {
    await treatApi.delete(scanStore.selectedTreatNo)
    showConfirmDelete.value = false
    if (patientStore.selectedPatient) {
      await scanStore.loadTreatments(patientStore.selectedPatient.PATID)
    }
  } catch (e: any) {
    await dlgAlert(e.response?.data?.error || e.message, { type: 'error' })
  }
}

async function onTreatSaved() {
  if (patientStore.selectedPatient) {
    await scanStore.loadTreatments(patientStore.selectedPatient.PATID)
  }
}

const connectingScanner = ref(false)

async function connectScanner() {
  connectingScanner.value = true
  try {
    const res = await apiBase.get('/scan/token')
    const token = res.data.token
    if (!token) { await dlgAlert('ไม่สามารถขอ token ได้', { type: 'error' }); return }
    // Open EMRScan via custom protocol
    window.location.href = `emrscan://launch?token=${encodeURIComponent(token)}`
  } catch (e: any) {
    await dlgAlert(e.response?.data?.error || 'เชื่อมต่อ server ไม่ได้', { type: 'error' })
  } finally {
    connectingScanner.value = false
  }
}

async function upload() {
  const hn = hnInputer.value?.hnValue?.trim()
  if (!hn || !patientStore.selectedPatient) { await dlgAlert('กรุณาเลือกผู้ป่วยก่อน', { type: 'warning' }); return }
  if (!scanStore.selectedFormCode) { await dlgAlert('กรุณาเลือกฟอร์ม', { type: 'warning' }); return }
  if (!scanStore.selectedTreatNo) {
    await dlgAlert('กรุณาเลือกแฟ้มผู้ป่วยก่อน', { type: 'warning' }); return
  }
  const { success, fail } = await scanStore.uploadAll(hn, scanStore.selectedFormCode)
  if (success > 0) {
    await dlgAlert(`บันทึกสำเร็จ ${success} ไฟล์`, { type: 'success' })
    // refresh แฟ้มผู้ป่วย (treat list + form count)
    if (patientStore.selectedPatient) {
      // บันทึกค่าก่อน reload 20260610 Arty
      const savedTreat = scanStore.selectedTreat
      const savedFormCode = scanStore.selectedFormCode

      await scanStore.loadTreatments(patientStore.selectedPatient.PATID)

      // restore selection หลัง reload
      if (savedTreat) await scanStore.selectTreatment(savedTreat)
      if (savedFormCode) scanStore.selectedFormCode = savedFormCode
    }
    // refresh รูปภาพถ้ามี treat และ form เลือกอยู่
    if (scanStore.selectedTreatNo && scanStore.selectedFormCode) {
      loadingImages.value = true
      try {
        const pages = await viewerApi.getChartPages(scanStore.selectedTreatNo)
        imagePages.value = pages.filter((p: any) => p.formCode === scanStore.selectedFormCode)
      } finally {
        loadingImages.value = false
      }
    }
  }
  if (fail > 0) await dlgAlert(`ล้มเหลว ${fail} ไฟล์`, { type: 'error' })
}
</script>

<style scoped>
.icon-sm-btn {
  width: 1.5rem; height: 1.5rem;
  display: flex; align-items: center; justify-content: center;
  border-radius: 0.25rem; border: 1px solid #e5e7eb;
  background: white; color: #4b5563; font-size: 0.75rem;
  cursor: pointer; transition: all 0.15s;
}
.icon-sm-btn:hover { border-color: #60a5fa; color: #1d4ed8; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.treat-th {
  background: #1a4f7a;
  color: white;
  padding: 0.35rem 0.4rem;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 500;
  white-space: nowrap;
}
.treat-td {
  padding: 0.3rem 0.4rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.7rem;
}
</style>