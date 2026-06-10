import { ref, createApp, defineComponent, h } from 'vue'

// ─── Types ────────────────────────────────────────────────────────────────────

type DialogType = 'success' | 'warning' | 'error' | 'info' | 'confirm'

interface DialogOptions {
  type?: DialogType
  title?: string
  message: string
}

// ─── Dialog Component ─────────────────────────────────────────────────────────

const DialogComponent = defineComponent({
  props: {
    type:    { type: String as () => DialogType, default: 'info' },
    title:   { type: String, default: '' },
    message: { type: String, required: true },
    isConfirm: { type: Boolean, default: false },
    onOk:    { type: Function, required: true },
    onCancel:{ type: Function, default: null },
  },
  setup(props) {
    const visible = ref(true)

    const iconMap: Record<DialogType, string> = {
      success: 'bi-check-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      error:   'bi-x-circle-fill',
      info:    'bi-info-circle-fill',
      confirm: 'bi-question-circle-fill',
    }
    const colorMap: Record<DialogType, string> = {
      success: '#22c55e',
      warning: '#f59e0b',
      error:   '#ef4444',
      info:    '#1a4f7a',
      confirm: '#f59e0b',
    }

    function ok() {
      visible.value = false
      setTimeout(() => props.onOk(), 150)
    }
    function cancel() {
      visible.value = false
      setTimeout(() => props.onCancel?.(), 150)
    }

    return () => {
      const type = props.type as DialogType
      return h('div', {
        class: 'emr-dialog-overlay',
        style: {
          position: 'fixed', inset: '0', zIndex: '99999',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)',
          opacity: visible.value ? '1' : '0',
          transition: 'opacity 0.15s',
        },
        onClick: (e: MouseEvent) => { if ((e.target as HTMLElement).classList.contains('emr-dialog-overlay')) cancel() }
      }, [
        h('div', {
          style: {
            background: 'white', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            width: '380px', maxWidth: '90vw', overflow: 'hidden',
            transform: visible.value ? 'scale(1)' : 'scale(0.95)',
            transition: 'transform 0.15s',
          }
        }, [
          // Header strip
          h('div', {
            style: {
              background: colorMap[type], padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }
          }, [
            h('i', { class: `bi ${iconMap[type]}`, style: { color: 'white', fontSize: '20px' } }),
            h('span', {
              style: { color: 'white', fontWeight: '600', fontSize: '14px' }
            }, props.title || (props.isConfirm ? 'ยืนยัน' : 'แจ้งเตือน')),
          ]),
          // Body
          h('div', { style: { padding: '20px', fontSize: '13px', color: '#374151', lineHeight: '1.6' } },
            props.message
          ),
          // Footer
          h('div', {
            style: {
              padding: '12px 20px', borderTop: '1px solid #f3f4f6',
              display: 'flex', justifyContent: 'flex-end', gap: '8px',
            }
          }, [
            props.isConfirm && h('button', {
              style: {
                padding: '6px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: '600',
                border: '1px solid #d1d5db', background: 'white', color: '#374151', cursor: 'pointer',
              },
              onClick: cancel,
            }, 'ยกเลิก'),
            h('button', {
              style: {
                padding: '6px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: '600',
                border: 'none', background: colorMap[type], color: 'white', cursor: 'pointer',
              },
              onClick: ok,
            }, 'ตกลง'),
          ]),
        ])
      ])
    }
  }
})

// ─── Mount helper ─────────────────────────────────────────────────────────────

function mountDialog(opts: DialogOptions & { isConfirm: boolean }): Promise<boolean> {
  return new Promise((resolve) => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    const app = createApp(DialogComponent, {
      type:      opts.type ?? (opts.isConfirm ? 'confirm' : 'info'),
      title:     opts.title ?? '',
      message:   opts.message,
      isConfirm: opts.isConfirm,
      onOk:      () => { app.unmount(); el.remove(); resolve(true) },
      onCancel:  () => { app.unmount(); el.remove(); resolve(false) },
    })
    app.mount(el)
  })
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function useDialog() {
  function alert(message: string, opts?: Omit<DialogOptions, 'message'>): Promise<void> {
    return mountDialog({ ...opts, message, isConfirm: false }).then(() => {})
  }

  function confirm(message: string, opts?: Omit<DialogOptions, 'message'>): Promise<boolean> {
    return mountDialog({ ...opts, message, isConfirm: true, type: opts?.type ?? 'confirm' })
  }

  return { alert, confirm }
}
