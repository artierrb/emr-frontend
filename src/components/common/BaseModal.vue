<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center"
        :style="{ zIndex }"
        @click.self="onBackdrop"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

        <!-- Panel -->
        <div
          class="relative bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
          :style="{ width, maxHeight: '90vh' }"
        >
          <!-- Header -->
          <div class="flex items-center gap-2 px-5 py-3 border-b border-gray-100 shrink-0">
            <i v-if="icon" :class="['bi', icon, 'text-blue-800']" />
            <span class="font-semibold text-blue-900 text-sm">{{ title }}</span>
            <div class="ml-auto flex items-center gap-2">
              <slot name="header-actions" />
              <button
                class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded p-1"
                @click="emit('update:modelValue', false)"
              >
                <i class="bi bi-x-lg text-sm" />
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-5 py-4">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="px-5 py-3 border-t border-gray-100 flex gap-2 justify-end shrink-0">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  icon?: string
  width?: string
  zIndex?: number
  closeOnBackdrop?: boolean
}>(), {
  width: '500px',
  zIndex: 5000,
  closeOnBackdrop: true,
})

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

function onBackdrop() {
  if (props.closeOnBackdrop) emit('update:modelValue', false)
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .relative, .modal-leave-to .relative { transform: scale(0.96) translateY(8px); }
</style>
