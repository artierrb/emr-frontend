<template>
  <button
    :type="type"
    class="emr-btn"
    :class="[
      `emr-btn--${variant}`,
      `emr-btn--${size}`,
      { 'emr-btn--stacked': stacked, 'emr-btn--block': block },
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <!-- โหมด stacked (icon ใหญ่ + title + sub) แบบ Scan Now -->
    <template v-if="stacked">
      <span v-if="loading" class="emr-btn__spinner emr-btn__spinner--lg" />
      <i v-else-if="icon" :class="['emr-btn__icon-lg', icon]" />
      <span class="emr-btn__title">{{ title }}</span>
      <span v-if="sub" class="emr-btn__sub">{{ sub }}</span>
    </template>

    <!-- โหมดปกติ (icon เล็ก + label ในบรรทัดเดียว) -->
    <template v-else>
      <span v-if="loading" class="emr-btn__spinner" />
      <i v-else-if="icon" :class="icon" />
      <slot>{{ title }}</slot>
    </template>
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    /** primary = เล่นแสง gradient+glow · outline · danger · ghost */
    variant?: 'primary' | 'outline' | 'danger' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    /** โหมด 2 บรรทัด (icon ใหญ่ + title + sub) แบบปุ่ม Scan Now */
    stacked?: boolean
    /** เต็มความกว้าง parent */
    block?: boolean
    disabled?: boolean
    loading?: boolean
    /** class ของ bootstrap-icons เช่น 'bi bi-scanner' */
    icon?: string
    /** ข้อความหลัก (ใช้เมื่อไม่ได้ใส่ slot) / title ของ stacked */
    title?: string
    /** บรรทัดรองของ stacked */
    sub?: string
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'primary',
    size: 'md',
    stacked: false,
    block: false,
    disabled: false,
    loading: false,
    icon: '',
    title: '',
    sub: '',
    type: 'button',
  },
)

defineEmits<{ click: [e: MouseEvent] }>()
</script>

<style scoped>
.emr-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border: 1px solid transparent;
  border-radius: var(--cis-radius-sm, 8px);
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  white-space: nowrap;
  transition: filter 0.15s, box-shadow 0.15s, background 0.15s,
    border-color 0.15s, color 0.15s, transform 0.05s;
}
.emr-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
  filter: none;
}
.emr-btn--block { width: 100%; }

/* ── sizes ── */
.emr-btn--sm { padding: 0.35rem 0.75rem; font-size: 0.8125rem; }
.emr-btn--md { padding: 0.55rem 1rem;    font-size: 0.875rem; }
.emr-btn--lg { padding: 0.75rem 1.25rem; font-size: 1rem; }

/* ── variant: primary (เล่นแสง gradient + glow คุมโทน #2563a8) ── */
.emr-btn--primary {
  color: #fff;
  background: linear-gradient(
    135deg,
    var(--cis-primary-light, #3b7dc9) 0%,
    var(--cis-primary, #2563a8) 55%,
    var(--cis-primary-hover, #1d4d85) 100%
  );
  box-shadow: var(--cis-glow, 0 6px 16px rgba(37, 99, 168, 0.3));
}
.emr-btn--primary:hover:not(:disabled) {
  filter: brightness(1.06);
  box-shadow: var(--cis-glow-hover, 0 8px 20px rgba(37, 99, 168, 0.38));
}
.emr-btn--primary:active:not(:disabled) { transform: translateY(1px); }

/* ── variant: danger (เล่นแสงโทนแดง) ── */
.emr-btn--danger {
  color: #fff;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 55%, #b91c1c 100%);
  box-shadow: var(--cis-glow-danger, 0 6px 16px rgba(220, 38, 38, 0.28));
}
.emr-btn--danger:hover:not(:disabled) {
  filter: brightness(1.06);
  box-shadow: 0 8px 20px rgba(220, 38, 38, 0.36);
}
.emr-btn--danger:active:not(:disabled) { transform: translateY(1px); }

/* ── variant: outline ── */
.emr-btn--outline {
  color: var(--cis-text-primary, #1e293b);
  background: #fff;
  border-color: var(--cis-border, #e2e8f0);
}
.emr-btn--outline:hover:not(:disabled) {
  border-color: var(--cis-primary, #2563a8);
  color: var(--cis-primary, #2563a8);
  background: var(--cis-primary-soft, #e3edf7);
}
.emr-btn--outline:active:not(:disabled) { transform: translateY(1px); }

/* ── variant: ghost ── */
.emr-btn--ghost {
  color: var(--cis-primary, #2563a8);
  background: transparent;
}
.emr-btn--ghost:hover:not(:disabled) {
  background: var(--cis-primary-soft, #e3edf7);
}

/* ── stacked (แบบ Scan Now) ── */
.emr-btn--stacked {
  flex-direction: column;
  gap: 0.15rem;
  padding: 1rem 0.75rem;
  border-radius: var(--cis-radius-md, 12px);
}
.emr-btn__icon-lg { font-size: 1.75rem; }
.emr-btn__title { font-size: 1.15rem; font-weight: 700; line-height: 1.2; }
.emr-btn__sub { font-size: 0.75rem; font-weight: 400; color: rgba(255, 255, 255, 0.85); }
/* sub บน outline/ghost ให้ใช้สีรอง (พื้นอ่อน) */
.emr-btn--outline .emr-btn__sub,
.emr-btn--ghost .emr-btn__sub { color: var(--cis-text-muted, #64748b); }

/* ── spinner ── */
.emr-btn__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: emr-btn-spin 0.6s linear infinite;
}
.emr-btn__spinner--lg { width: 28px; height: 28px; border-width: 3px; }
/* spinner บน outline/ghost ให้เป็นโทน primary */
.emr-btn--outline .emr-btn__spinner,
.emr-btn--ghost .emr-btn__spinner {
  border-color: var(--cis-primary-soft, #e3edf7);
  border-top-color: var(--cis-primary, #2563a8);
}
@keyframes emr-btn-spin { to { transform: rotate(360deg); } }
</style>
