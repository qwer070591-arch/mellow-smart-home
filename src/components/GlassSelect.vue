<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId } from 'vue'
import { Check, ChevronDown } from '@lucide/vue'

const props = defineProps<{ label: string; modelValue: string; options: { value: string; label: string }[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const id = useId()
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const optionButtons = ref<HTMLButtonElement[]>([])

function close(restoreFocus = false) {
  open.value = false
  if (restoreFocus) nextTick(() => trigger.value?.focus())
}
function select(value: string) {
  emit('update:modelValue', value)
  close(true)
}
async function show(index?: number) {
  open.value = true
  await nextTick()
  const selected = index ?? Math.max(0, props.options.findIndex(option => option.value === props.modelValue))
  optionButtons.value[selected]?.focus()
}
function onTriggerKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    show(event.key === 'ArrowUp' ? props.options.length - 1 : undefined)
  }
}
function onListKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); return }
  if (event.key === 'Tab') { close(); return }
  const current = optionButtons.value.findIndex(button => button === document.activeElement)
  const next = event.key === 'ArrowDown' ? Math.min(current + 1, props.options.length - 1)
    : event.key === 'ArrowUp' ? Math.max(current - 1, 0)
    : event.key === 'Home' ? 0 : event.key === 'End' ? props.options.length - 1 : -1
  if (next < 0) return
  event.preventDefault()
  optionButtons.value[next]?.focus()
}
function onOutside(event: PointerEvent) {
  if (open.value && !root.value?.contains(event.target as Node)) close()
}
document.addEventListener('pointerdown', onOutside)
onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside))
</script>

<template>
  <div ref="root" class="glass-select">
    <button ref="trigger" type="button" class="glass-select__trigger" :aria-label="`${label}：${options.find(option => option.value === modelValue)?.label ?? ''}`"
      aria-haspopup="listbox" :aria-expanded="open" :aria-controls="open ? id : undefined"
      @click="open ? close() : show()" @keydown="onTriggerKeydown">
      <span>{{ options.find(option => option.value === modelValue)?.label }}</span><ChevronDown :size="16" aria-hidden="true" />
    </button>
    <div v-if="open" :id="id" class="glass-select__menu" role="listbox" :aria-label="label" @keydown="onListKeydown">
      <button v-for="(option, index) in options" :key="option.value" :ref="element => { if (element) optionButtons[index] = element as HTMLButtonElement }"
        type="button" role="option" :aria-selected="modelValue === option.value" @click="select(option.value)">
        <span>{{ option.label }}</span><Check v-if="modelValue === option.value" :size="16" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
