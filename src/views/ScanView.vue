<template>
  <div
    class="grid gap-4 h-[calc(100vh-120px)] min-h-0"
    style="grid-template-columns:1.2fr 1.6fr 1.6fr; grid-template-rows:auto 1fr;"
  >

    <!-- ══════════ Patient info card — กินแค่ 2 คอลัมน์ซ้าย ══════════ -->
    <div class="card" style="grid-column:1 / 3; grid-row:1;">
      <div class="p-4 flex items-center gap-5">
        <!-- avatar -->
        <div class="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
          <i class="bi bi-person-fill text-3xl text-blue-300" />
        </div>

        <!-- ข้อมูลผู้ป่วย -->
        <template v-if="patientStore.selectedPatient">
          <!-- ซ้าย: ตัวตนผู้ป่วย -->
          <div class="min-w-0 flex-shrink-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                ผู้ป่วยปัจจุบัน
              </span>
              <h2 class="text-lg font-bold text-slate-800 truncate">
                {{ patientStore.selectedPatient.NAME }}
              </h2>
              <i v-if="sexIcon" :class="['bi', sexIcon.cls, 'text-lg']" :title="sexIcon.label" />
            </div>
            <div class="flex items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-600 flex-wrap">
              <span>
                <span class="text-slate-400">HN</span>
                <strong class="ml-1 text-slate-800" style="font-variant-numeric: tabular-nums;">{{ formatHn(patientStore.selectedPatient.PATID) }}</strong>
              </span>
              <span class="text-slate-300">|</span>
              <span>
                <span class="text-slate-400">อายุ</span>
                <strong class="ml-1 text-slate-800">{{ patientAge }}</strong>
              </span>
              <span class="text-slate-300">|</span>
              <span>
                <span class="text-slate-400">เลขสิทธิ</span>
                <strong class="ml-1 text-slate-800" style="font-variant-numeric: tabular-nums;">{{ patientStore.selectedPatient.JUMINNO?.trim() || '-' }}</strong>
              </span>
            </div>
          </div>

          <!-- กลาง: ข้อมูลแฟ้มที่เลือก เติมในช่องว่าง คั่นด้วยเส้นแนวตั้ง -->
          <div class="flex-1 min-w-0 self-stretch flex items-center px-4 border-l border-slate-100">
            <div v-if="selectedTreatInfo" class="flex items-center gap-x-5 gap-y-1 flex-wrap text-sm w-full">
              <div class="flex flex-col">
                <span class="text-xs text-slate-400 mb-0.5">ประเภท</span>
                <span
                  class="text-xs font-semibold px-2 py-0.5 rounded-full self-start"
                  :class="selectedTreatInfo.isIpd
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-emerald-100 text-emerald-700'"
                >{{ selectedTreatInfo.typeLabel }}</span>
              </div>
              <div class="flex flex-col">
                <span class="text-xs text-slate-400 mb-0.5">{{ selectedTreatInfo.visitLabel }}</span>
                <strong class="text-slate-800 leading-tight" style="font-variant-numeric: tabular-nums;">{{ selectedTreatInfo.visitNo || '-' }}</strong>
              </div>
              <div class="flex flex-col">
                <span class="text-xs text-slate-400 mb-0.5">วันที่</span>
                <strong class="text-slate-800 leading-tight whitespace-nowrap" style="font-variant-numeric: tabular-nums;">{{ selectedTreatInfo.date || '-' }}</strong>
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-xs text-slate-400 mb-0.5">แพทย์</span>
                <strong class="text-slate-800 leading-tight truncate" :title="selectedTreatInfo.doctor">{{ selectedTreatInfo.doctor || '-' }}</strong>
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-xs text-slate-400 mb-0.5">แผนก</span>
                <strong class="text-slate-800 leading-tight truncate" :title="selectedTreatInfo.dept">{{ selectedTreatInfo.dept || '-' }}</strong>
              </div>
            </div>
            <div v-else class="text-sm text-slate-300 flex items-center gap-2">
              <i class="bi bi-folder2-open" /> เลือกแฟ้มผู้ป่วยเพื่อดูรายละเอียด
            </div>
          </div>

          <!-- visit summary (ขวาบน) -->
          <div class="flex items-stretch gap-3 flex-shrink-0 pl-4 border-l border-slate-100">
            <div class="text-center px-1">
              <div class="text-xs text-slate-400 mb-0.5">Visit ล่าสุด</div>
              <div class="text-sm font-semibold text-slate-800 whitespace-nowrap">
                {{ lastVisitDate || '-' }}
              </div>
            </div>
            <div class="text-center px-1">
              <div class="text-xs text-slate-400 mb-0.5">Visit ทั้งหมด</div>
              <div class="text-lg font-bold text-blue-600" style="font-variant-numeric: tabular-nums;">
                {{ scanStore.treatments.length }}
              </div>
            </div>
          </div>
        </template>

        <!-- ยังไม่ได้เลือกผู้ป่วย -->
        <div v-else class="flex-1 flex items-center text-slate-400 text-sm">
          <i class="bi bi-person-vcard text-lg mr-2" />
          ค้นหาและเลือกผู้ป่วยจากช่องค้นหาด้านขวา
        </div>
      </div>
    </div>

    <!-- ───── Col 1: Scanner + Browse (ย่อ) — แถวล่างซ้าย ───── -->
    <div class="flex flex-col gap-4 min-h-0" style="grid-column:1; grid-row:2;">
        <!-- Scanner panel -->
        <div class="card flex-shrink-0">
          <div class="card-header"><i class="bi bi-usb-symbol" /> Scanner</div>
          <div class="p-3 space-y-2">
            <select class="form-select text-sm" disabled>
              <option>-- Profile (coming soon) --</option>
            </select>
            <EMRButton
              stacked
              block
              icon="bi bi-scanner"
              title="Scan Now"
              sub="เริ่มสแกนเอกสาร"
              :loading="connectingScanner"
              @click="connectScanner"
            />
            <p class="text-[11px] text-gray-400 text-center">เปิด EMRScan.exe พร้อม login อัตโนมัติ</p>
          </div>
        </div>

        <!-- Browse file -->
        <div class="card flex-1 flex flex-col min-h-0">
          <div class="card-header">
            <i class="bi bi-folder2-open" /> เลือกไฟล์
            <span class="ml-auto text-xs text-gray-400 font-normal">JPG PNG TIF</span>
          </div>
          <div class="p-3 flex flex-col flex-1 min-h-0">
            <div
              class="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center cursor-pointer hover:border-sky-400 hover:bg-sky-50 transition-colors flex-shrink-0"
              :class="{ 'border-sky-400 bg-sky-50': dragging }"
              @click="fileInput?.click()"
              @dragover.prevent="dragging = true"
              @dragleave="dragging = false"
              @drop.prevent="onDrop"
            >
              <i class="bi bi-cloud-arrow-up text-xl text-gray-400 block mb-1" />
              <p class="text-xs text-gray-500">
                <strong class="text-[#2563a8]">คลิก</strong> หรือลากมาวาง
              </p>
            </div>
            <input ref="fileInput" type="file" multiple accept=".jpg,.jpeg,.png,.tif,.tiff"
              class="hidden" @change="onFileSelect" />

            <div class="flex-1 overflow-y-auto mt-2 min-h-0">
              <div v-if="scanStore.selectedFiles.length > 0" class="grid grid-cols-2 gap-1.5">
                <div v-for="(f, i) in scanStore.selectedFiles" :key="i"
                  class="border border-gray-200 rounded-lg overflow-hidden relative bg-white">
                  <img v-if="isPreviewable(f)" :src="previewUrls[i]" class="w-full h-16 object-cover" />
                  <div v-else class="w-full h-16 flex flex-col items-center justify-center bg-slate-50 gap-0.5">
                    <i class="bi bi-file-earmark-image text-lg text-slate-400" />
                    <span class="text-[9px] text-slate-400 uppercase">TIFF</span>
                  </div>
                  <div class="px-1 py-0.5 text-[10px] text-gray-400 truncate">{{ i + 1 }}. {{ f.name }}</div>
                  <button
                    class="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/40 text-white text-[10px] flex items-center justify-center hover:bg-black/60"
                    @click.stop="scanStore.removeFile(i)">
                    <i class="bi bi-x" />
                  </button>
                </div>
              </div>
              <div v-else class="empty-state py-4">
                <i class="bi bi-images text-xl block mb-1" />
                <p class="text-xs">ยังไม่มีไฟล์</p>
              </div>
            </div>

            <!-- Scan + Upload actions (ย่อมารวมในคอลัมน์นี้) -->
            <div class="flex-shrink-0 mt-2 pt-2 border-t border-gray-100 space-y-2">
              <div class="flex gap-2">
                <button
                  class="flex-1 h-10 rounded-lg border-2 border-[#2563a8] text-[#2563a8] flex items-center justify-center gap-1.5 text-sm font-bold cursor-not-allowed opacity-60"
                  disabled title="Scanner integration อยู่ระหว่างพัฒนา">
                  <i class="bi bi-scanner text-lg" /> SCAN
                </button>
                <button
                  class="flex-1 h-10 rounded-lg border-2 flex items-center justify-center gap-1.5 text-sm font-medium transition-colors"
                  :class="scanStore.uploading || scanStore.selectedFiles.length === 0
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-sky-400 text-sky-600 hover:bg-sky-50'"
                  :disabled="scanStore.uploading || scanStore.selectedFiles.length === 0"
                  @click="upload">
                  <i class="bi bi-cloud-upload text-lg" /> Upload
                </button>
              </div>

              <div v-if="scanStore.uploading" class="w-full space-y-1">
                <div class="flex justify-between text-xs text-gray-500">
                  <span>กำลังบันทึก...</span><span>{{ scanStore.uploadProgress }}%</span>
                </div>
                <div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div class="h-full bg-sky-400 rounded-full transition-all"
                    :style="{ width: scanStore.uploadProgress + '%' }" />
                </div>
              </div>

              <div v-if="scanStore.selectedFiles.length > 0" class="text-xs text-gray-500 text-center">
                {{ scanStore.selectedFiles.length }} ไฟล์รอ upload
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ───── Col 2: ประเภทฟอร์ม (ขยายใหญ่) — แถวล่างกลาง ───── -->
      <div class="card flex flex-col min-h-0" style="grid-column:2; grid-row:2;">
        <div class="card-header">
          <i class="bi bi-folder2-open" /> ประเภทฟอร์ม <span class="text-red-500">*</span>
          <span v-if="scanStore.selectedTreatNo && selectedFormCnt !== null"
            class="ml-auto bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {{ selectedFormCnt }}
          </span>
        </div>
        <div class="p-3 flex flex-col flex-1 min-h-0">
          <!-- Search bar -->
          <div class="flex gap-1.5 mb-2 flex-shrink-0">
            <select v-model="formSearchField" class="form-select text-sm" style="width:90px;flex-shrink:0;">
              <option value="group">Group</option>
              <option value="form">Form</option>
            </select>
            <input v-model="formSearchKw" type="text" class="form-input text-sm" style="flex:1;min-width:0;" placeholder="ค้นหาประเภทฟอร์ม..." />
          </div>
          <!-- Group → Form tree -->
          <div class="flex-1 overflow-y-auto border border-gray-200 rounded-lg min-h-0">
            <template v-for="g in filteredFormGroups" :key="g.GRPCODE">
              <div
                class="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors sticky top-0 z-10"
                @click="toggleGroup(g.GRPCODE)">
                <i class="bi text-xs text-gray-400"
                  :class="expandedFormGroups.has(g.GRPCODE) ? 'bi-chevron-down' : 'bi-chevron-right'" />
                <i class="bi text-base text-blue-400"
                  :class="expandedFormGroups.has(g.GRPCODE) ? 'bi-folder2-open' : 'bi-folder-fill'" />
                <span class="text-sm font-semibold text-gray-600 flex-1 truncate">{{ g.NAME }}</span>
                <span v-if="scanStore.selectedTreatNo && groupCntSum(g.GRPCODE) > 0"
                  class="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {{ groupCntSum(g.GRPCODE) }}
                </span>
                <span class="text-[11px] text-gray-400 min-w-[28px] text-right">[{{ formsInGroup(g.GRPCODE).length }}]</span>
              </div>
              <template v-if="expandedFormGroups.has(g.GRPCODE)">
                <div v-for="f in sortedFormsInGroup(g.GRPCODE)" :key="f.formCode"
                  class="flex items-start gap-2 pl-8 pr-3 py-2 text-sm border-b border-gray-100 last:border-0 transition-colors relative"
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
                  <i class="bi bi-file-earmark-text text-gray-300 text-sm mt-0.5 flex-shrink-0" />
                  <div class="min-w-0 flex-1">
                    <div class="font-mono text-[10px] text-gray-400">{{ f.formCode }}</div>
                    <div class="truncate">{{ f.name }}</div>
                  </div>
                  <span v-if="scanStore.selectedTreatNo && scanStore.formCountMap[f.formCode]"
                    class="absolute top-2 right-2 bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {{ scanStore.formCountMap[f.formCode] }}
                  </span>
                </div>
              </template>
            </template>
            <div v-if="filteredFormGroups.length === 0" class="text-center py-6 text-gray-400 text-sm">
              ไม่พบข้อมูล
            </div>
          </div>
        </div>
      </div>

      <!-- ───── Col 3: HN search + แฟ้มผู้ป่วย table + รูปภาพ — ขวาเต็มความสูง ───── -->
      <div class="card flex flex-col min-h-0" style="grid-column:3; grid-row:1 / 3;">
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
                    <th class="treat-th">DrCode</th>
                    <th class="treat-th text-right">TreatNo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="scanStore.treatments.length === 0">
                    <td colspan="11" class="text-center py-4 text-gray-400">
                      {{ patientStore.selectedPatient ? 'ไม่พบข้อมูล' : 'เลือกผู้ป่วยก่อน' }}
                    </td>
                  </tr>
                  <tr v-for="t in scanStore.treatments" :key="t.TREATNO"
                    class="treat-row cursor-pointer"
                    :class="scanStore.selectedTreatNo === t.TREATNO ? 'is-selected' : ''"
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
                    <td class="treat-td text-right font-mono" style="font-variant-numeric: tabular-nums;">{{ t.CNT }}</td>
                    <td class="treat-td text-gray-400">{{ deptCodeLabel(t) }}</td>
                    <td class="treat-td text-right font-mono text-gray-500" style="font-variant-numeric: tabular-nums;">{{ t.TREATNO }}</td>
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
              <div v-else class="grid grid-cols-4 gap-2">
                <div
                  v-for="p in imagePages"
                  :key="p.pageNo"
                  class="group border rounded-lg overflow-hidden cursor-pointer transition-all relative bg-white"
                  :class="moveMode
                    ? selectedPages.includes(p.pageNo)
                      ? 'border-sky-400 ring-2 ring-sky-300'
                      : 'border-gray-200 hover:border-sky-300'
                    : 'border-gray-200 hover:border-sky-400 hover:shadow-md'"
                  @click="onThumbClick(p)"
                >
                  <div class="aspect-[3/4] bg-slate-50 flex items-center justify-center overflow-hidden">
                    <img
                      :src="`/api/image/${p.pageNo}?ext=${p.extension||'jpg'}&thumb=1`"
                      loading="lazy" decoding="async"
                      class="max-w-full max-h-full object-contain transition-transform duration-200 group-hover:scale-[1.03]"
                      :alt="`หน้า ${p.page}`"
                      @error="(e:any) => e.target.src=''"
                    />
                  </div>
                  <!-- select order badge -->
                  <div v-if="moveMode && selectedPages.includes(p.pageNo)"
                    class="absolute top-1 left-1 bg-sky-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                    {{ selectedPages.indexOf(p.pageNo) + 1 }}
                  </div>
                  <div class="px-1 py-0.5 text-[10px] text-gray-500 text-center border-t border-gray-100 bg-white">หน้า {{ p.page }}</div>
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
          <button class="bg-white/10 border-0 text-white px-3 py-1.5 rounded text-sm cursor-pointer hover:bg-white/25" @click="printCurrentImage" title="พิมพ์รูป"><i class="bi bi-printer" /></button>
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
import EMRButton from '@/components/common/EMRButton.vue'

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

// browser แสดง jpg/png ใน <img> ได้ แต่ TIFF แสดงไม่ได้ (decode ไม่ได้)
// สร้าง preview URL เฉพาะไฟล์ที่แสดงได้จริง เพื่อไม่ให้เห็นรูปแตก
function isPreviewable(f: File) {
  return f.type === 'image/jpeg' || f.type === 'image/png'
}

const previewUrls = computed(() =>
  scanStore.selectedFiles.map(f => isPreviewable(f) ? URL.createObjectURL(f) : '')
)

// อายุ — คำนวณจาก BIRTHDATE เหมือน store เดิม
const patientAge = computed(() => {
  const bd = patientStore.selectedPatient?.BIRTHDATE
  if (!bd || bd.length < 4) return '-'
  const year = parseInt(bd.substring(0, 4))
  if (isNaN(year)) return '-'
  return `${new Date().getFullYear() - year} ปี`
})

// ไอคอนเพศจาก SEX (รองรับ M/F หรือ ช/ญ — ถ้าไม่ตรงไม่แสดง)
const sexIcon = computed(() => {
  const s = (patientStore.selectedPatient?.SEX || '').trim().toUpperCase()
  if (s === 'M' || s === '1' || s === 'ช') return { cls: 'bi-gender-male text-blue-500', label: 'ชาย' }
  if (s === 'F' || s === '2' || s === 'ญ') return { cls: 'bi-gender-female text-pink-500', label: 'หญิง' }
  return null
})

// Visit ล่าสุด = INDATE ของแถวแรก (treatments เรียงใหม่สุดอยู่บน)
const lastVisitDate = computed(() => {
  const first = scanStore.treatments[0]
  return first ? formatDate(first.INDATE) : ''
})

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

// แสดง HN ตาม HNSEP (แสดงผลเท่านั้น — ค่าที่ส่ง SQL ยังใช้ PATID padded 8 หลัก)
// 'Y' → ปี 2 หลัก + '-' + ส่วนที่เหลือตัด 0 นำหน้า เช่น "69000001" → "69-1"
// 'N' → 8 หลัก trim
function formatHn(patid?: string) {
  const raw = patid || ''
  if (!raw.trim()) return '-'
  if (patientStore.hnConfig.hnSep === 'Y') {
    // PATID เก็บเป็น 8 หลัก: ปี 2 หลัก + เว้นวรรค + เลข HN ชิดขวา เช่น "69     1"
    const padded = raw.padEnd(8, ' ')
    const year = padded.substring(0, 2).trim()
    const rest = padded.substring(2).trim()
    return `${year}-${rest}`
  }
  return raw.trim()
}

function deptCodeLabel(t: TreatmentFull) {
  const vn = (t.VSTNUM || '').trim()
  const an = (t.ADMNUM || '').trim()
  if (t.CLASS === 'O' && vn) return `${t.DOCCODE}[VN:${vn}]`
  if (t.CLASS === 'I' && an) return `${t.DOCCODE}[AN:${an}]`
  return t.DOCCODE || ''
}

// ข้อมูลแฟ้มที่เลือก สำหรับแสดงบน panel ผู้ป่วยด้านบน
const selectedTreatInfo = computed(() => {
  const t = scanStore.selectedTreat
  if (!t) return null
  const isIpd = t.CLASS === 'I'
  const vn = (t.VSTNUM || '').trim()
  const an = (t.ADMNUM || '').trim()
  return {
    isIpd,
    typeLabel: isIpd ? 'IPD' : 'OPD',
    visitLabel: isIpd ? 'AN' : 'VN',
    visitNo: isIpd ? an : vn,
    date: formatDate(t.INDATE),
    doctor: (t.DOCNAME || '').trim(),
    dept: (t.CLINNAME || '').trim(),
  }
})

onMounted(async () => { await Promise.all([scanStore.loadPrgMode(), scanStore.loadFormGroups()]) })

// Keyboard navigation for image viewer
function onKeydown(e: KeyboardEvent) {
  if (!viewerImage.value) return
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault()
    const next = currentViewIndex.value + 1
    if (next < imagePages.value.length) {
      currentViewIndex.value = next
      const p = imagePages.value[next]
      viewerImage.value = { src: `/api/image/${p.pageNo}?ext=${p.extension||'jpg'}&fmt=jpg`, label: `หน้า ${p.page} — ${p.formCode}` }
    }
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault()
    const prev = currentViewIndex.value - 1
    if (prev >= 0) {
      currentViewIndex.value = prev
      const p = imagePages.value[prev]
      viewerImage.value = { src: `/api/image/${p.pageNo}?ext=${p.extension||'jpg'}&fmt=jpg`, label: `หน้า ${p.page} — ${p.formCode}` }
    }
  } else if (e.key === 'Escape') {
    viewerImage.value = null
  }
}

function printCurrentImage() {
  if (!viewerImage.value) return
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`
    <html><head><title>Print</title>
    <style>
      @media print { @page { margin: 0; } }
      body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
      img { max-width: 100%; max-height: 100vh; object-fit: contain; }
    </style></head>
    <body><img src="${viewerImage.value.src}" onload="window.print(); window.onafterprint = () => window.close();" /></body>
    </html>`)
  win.document.close()
}

watch(() => viewerImage.value, (v) => {
  if (v) document.addEventListener('keydown', onKeydown)
  else document.removeEventListener('keydown', onKeydown)
})

watch(() => scanStore.selectedTreatNo, (newVal, oldVal) => {
  if (newVal !== oldVal) resetExpand()
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
  resetExpand()
}

// นามสกุลที่อนุญาต — lock เฉพาะภาพหน้าเดียวที่ backend เซฟได้ปลอดภัย
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'tif', 'tiff']

function extOf(name: string) {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.substring(i + 1).toLowerCase() : ''
}

// อ่านจำนวนหน้าใน TIFF จาก header (นับ IFD) โดยไม่ต้อง decode ภาพ
// คืน number = จำนวนหน้า, หรือ -1 ถ้าอ่าน header ไม่ได้ (ถือว่าไม่ปลอดภัย)
async function countTiffPages(file: File): Promise<number> {
  try {
    const buf = await file.arrayBuffer()
    const dv = new DataView(buf)
    if (dv.byteLength < 8) return -1
    const b0 = dv.getUint8(0), b1 = dv.getUint8(1)
    let le: boolean
    if (b0 === 0x49 && b1 === 0x49) le = true       // 'II' little-endian
    else if (b0 === 0x4D && b1 === 0x4D) le = false  // 'MM' big-endian
    else return -1
    const magic = dv.getUint16(2, le)
    if (magic !== 42) return -1                      // ไม่ใช่ TIFF มาตรฐาน (BigTIFF=43 ไม่รองรับ)
    let offset = dv.getUint32(4, le)
    let pages = 0
    // เดินตาม linked list ของ IFD จนกว่า next-offset = 0
    while (offset !== 0 && offset + 2 <= dv.byteLength) {
      pages++
      const entries = dv.getUint16(offset, le)
      const nextPtr = offset + 2 + entries * 12
      if (nextPtr + 4 > dv.byteLength) break
      offset = dv.getUint32(nextPtr, le)
      if (pages > 10000) break                       // กัน loop ผิดปกติ
    }
    return pages || -1
  } catch {
    return -1
  }
}

async function acceptFiles(files: File[]) {
  const ok: File[] = []
  const rejected: string[] = []
  const multipage: string[] = []

  for (const f of files) {
    const ext = extOf(f.name)
    if (!ALLOWED_EXT.includes(ext)) {
      rejected.push(f.name)
      continue
    }
    // TIFF: ตรวจว่าเป็นหลายหน้าไหม — backend ยังแตกหน้าไม่ได้ ถ้าปล่อยผ่านข้อมูลจะหาย
    if (ext === 'tif' || ext === 'tiff') {
      const pages = await countTiffPages(f)
      if (pages > 1) { multipage.push(`${f.name} (${pages} หน้า)`); continue }
      // pages === -1 (อ่าน header ไม่ได้/BigTIFF) → กันไว้ก่อนเพื่อความปลอดภัย
      if (pages < 0) { multipage.push(`${f.name} (อ่านจำนวนหน้าไม่ได้)`); continue }
    }
    ok.push(f)
  }

  if (rejected.length) {
    await dlgAlert(
      `ไฟล์ต่อไปนี้ไม่รองรับ (เฉพาะ JPG, PNG, TIF เท่านั้น):\n${rejected.join('\n')}`,
      { type: 'warning' }
    )
  }
  if (multipage.length) {
    await dlgAlert(
      `ไม่รองรับไฟล์ TIFF หลายหน้า กรุณาแยกเป็นไฟล์ละหน้าก่อน:\n${multipage.join('\n')}`,
      { type: 'warning' }
    )
  }
  if (ok.length) scanStore.addFiles(ok)
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) acceptFiles(Array.from(input.files))
  input.value = ''  // reset เพื่อให้เลือกไฟล์เดิมซ้ำได้
}

function onDrop(e: DragEvent) {
  dragging.value = false
  if (e.dataTransfer?.files) acceptFiles(Array.from(e.dataTransfer.files))
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
    viewerImage.value = { src: `/api/image/${p.pageNo}?ext=${p.extension||'jpg'}&fmt=jpg`, label: `หน้า ${p.page} — ${p.formCode}` }
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

// ── Form group tree ─────────────────────────────────────────
const formSearchField = ref<'group'|'form'>('group')
const formSearchKw    = ref('')
const expandedFormGroups = ref<Set<string>>(new Set())

const formsWithGroup = computed(() =>
  scanStore.forms.filter(f => f.grpCode && f.grpCode.trim() !== '')
)

function formsInGroup(grpCode: string): typeof scanStore.forms {
  return formsWithGroup.value.filter(f => f.grpCode?.trim() === grpCode.trim())
}

function sortedFormsInGroup(grpCode: string): typeof scanStore.forms {
  return formsInGroup(grpCode).slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''))
}

//20260611 Arty
const filteredFormGroups = computed(() => {
  const kw = formSearchKw.value.toLowerCase().trim()

  const sortGroups = (groups: any[]) => [...groups].sort((a, b) => {
    const ca = groupCntSum(a.GRPCODE)
    const cb = groupCntSum(b.GRPCODE)
    if (cb !== ca) return cb - ca
    return (a.NAME || '').localeCompare(b.NAME || '')
  })

  if (!kw) return sortGroups(scanStore.formGroups.filter(g => formsInGroup(g.GRPCODE).length > 0))
  if (formSearchField.value === 'group') {
    return sortGroups(scanStore.formGroups.filter(g =>
      g.NAME?.toLowerCase().includes(kw) && formsInGroup(g.GRPCODE).length > 0
    ))
  } else {
    return sortGroups(scanStore.formGroups.filter(g => {
      const matched = formsInGroup(g.GRPCODE).filter(f =>
        f.name?.toLowerCase().includes(kw) || f.formCode?.toLowerCase().includes(kw)
      )
      if (matched.length > 0) expandedFormGroups.value.add(g.GRPCODE)
      return matched.length > 0
    }))
  }
})

function toggleGroup(grpCode: string) {
  if (expandedFormGroups.value.has(grpCode)) expandedFormGroups.value.delete(grpCode)
  else expandedFormGroups.value.add(grpCode)
  expandedFormGroups.value = new Set(expandedFormGroups.value)
}

function groupCntSum(grpCode: string): number {
  return formsInGroup(grpCode).reduce((sum, f) => sum + (scanStore.formCountMap[f.formCode] || 0), 0)
}

function resetExpand() {
  expandedFormGroups.value = new Set()
  scanStore.selectedFormCode = '' //20260611 Arty
}

const connectingScanner = ref(false)

async function connectScanner() {
  connectingScanner.value = true
  try {
    const res = await apiBase.get('/scan/token')
    const token = res.data.token
    if (!token) { await dlgAlert('ไม่สามารถขอ token ได้', { type: 'error' }); return }
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
  const isRealForm = scanStore.forms.some(f => f.formCode === scanStore.selectedFormCode)
  if (!isRealForm) { await dlgAlert('กรุณาเลือกฟอร์มภายใน group ไม่ใช่ group header', { type: 'warning' }); return }
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
.scan-now-btn {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  padding: 1rem 0.75rem;
  border: none;
  border-radius: 0.75rem;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 55%, #2563eb 100%);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.28);
  transition: filter 0.15s, box-shadow 0.15s, transform 0.05s;
}
.scan-now-btn:hover:not(:disabled) {
  filter: brightness(1.05);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.34);
}
.scan-now-btn:active:not(:disabled) { transform: translateY(1px); }
.scan-now-btn:disabled { opacity: 0.7; cursor: wait; }
.scan-now-title { font-size: 1.15rem; font-weight: 700; line-height: 1.2; }
.scan-now-sub { font-size: 0.75rem; color: rgba(255, 255, 255, 0.85); }

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
  background: var(--cis-primary, #2563a8);
  color: white;
  padding: 0.4rem 0.4rem;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: 0.01em;
}
.treat-td {
  padding: 0.4rem 0.4rem;
  border-bottom: 1px solid #eef2f7;
  font-size: 0.7rem;
  color: var(--cis-text-primary, #1e293b);
}

/* แถวตาราง: zebra + hover + selected ให้ไล่สายตาง่าย ลดอ่านผิดแถว */
.treat-row {
  transition: background-color 0.12s ease;
}
/* zebra: แถวคู่พื้นจางๆ */
.treat-row:nth-child(even) > .treat-td {
  background: #fafbfc;
}
.treat-row:hover > .treat-td {
  background: var(--cis-primary-soft, #e3edf7);
}
/* แถวที่เลือก: พื้นเด่น + เส้นน้ำเงินซ้ายชี้ชัด */
.treat-row.is-selected > .treat-td {
  background: var(--cis-primary-soft, #e3edf7);
  box-shadow: inset 0 0 0 9999px rgba(37, 99, 168, 0.06);
}
.treat-row.is-selected > .treat-td:first-child {
  box-shadow:
    inset 3px 0 0 var(--cis-primary, #2563a8),
    inset 0 0 0 9999px rgba(37, 99, 168, 0.06);
}
.treat-row.is-selected > .treat-td {
  font-weight: 600;
}
</style>