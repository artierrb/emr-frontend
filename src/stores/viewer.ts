import { defineStore } from 'pinia'
import { ref } from 'vue'
import { viewerApi } from '@/services/api'
import type { Treatment, ChartPage } from '@/types'

export const useViewerStore = defineStore('viewer', () => {
  const treatments = ref<Treatment[]>([])
  const chartPages = ref<ChartPage[]>([])
  const selectedTreatNo = ref<number | null>(null)
  const viewerImage = ref<{ src: string; label: string } | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadTreatments(hn: string) {
    loading.value = true
    error.value = null
    treatments.value = []
    chartPages.value = []
    selectedTreatNo.value = null
    try {
      treatments.value = await viewerApi.getTreatments(hn)
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function loadChartPages(treatNo: number) {
    selectedTreatNo.value = treatNo
    loading.value = true
    chartPages.value = []
    try {
      chartPages.value = await viewerApi.getChartPages(treatNo)
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  function openImage(pageNo: number, ext: string, label: string) {
    viewerImage.value = {
      src: viewerApi.getImageUrl(pageNo, ext),
      label,
    }
  }

  function closeImage() {
    viewerImage.value = null
  }

  function clear() {
    treatments.value = []
    chartPages.value = []
    selectedTreatNo.value = null
    viewerImage.value = null
    error.value = null
  }

  return {
    treatments, chartPages, selectedTreatNo, viewerImage, loading, error,
    loadTreatments, loadChartPages, openImage, closeImage, clear,
  }
})
