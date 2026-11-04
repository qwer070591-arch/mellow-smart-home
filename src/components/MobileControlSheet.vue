<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { X } from '@lucide/vue'
import { useDashboardStore, type DevicePanel } from '../stores/dashboard'
import VacuumCard from './VacuumCard.vue'
import LightingCard from './LightingCard.vue'
import ClimateCard from './ClimateCard.vue'
import AtmosphereCard from './AtmosphereCard.vue'
import { usePointerRange } from '../composables/usePointerRange'

const props = defineProps<{ panel: DevicePanel | null }>()
const emit = defineEmits<{ close: [] }>()
const store = useDashboardStore()
const sheet = ref<HTMLElement | null>(null)
const labels: Record<DevicePanel, string> = { vacuum: '智慧清掃', lighting: '智慧燈光', climate: '室內溫度', curtain: '窗簾控制', scene: '氛圍控制' }
const curtainDrag = usePointerRange(0, 100, value => store.setCurtain(value))
watch(() => props.panel, async value => { if (value) { await nextTick(); sheet.value?.focus() } })
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') { emit('close'); return }
  if (event.key !== 'Tab' || !sheet.value) return
  const focusable = [...sheet.value.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]')]
  const first = focusable[0], last = focusable.at(-1)
  if (!first || !last) return
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
  if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet-rise">
      <div v-if="panel" class="control-sheet-layer">
        <div class="control-sheet-backdrop" @click="emit('close')"></div>
        <section ref="sheet" class="control-sheet" role="dialog" aria-modal="true" :aria-label="labels[panel]" tabindex="-1" @keydown="onKeydown">
          <div class="control-sheet__heading"><div><span class="eyebrow">{{ store.details.name }} / DEVICE CONTROL</span><h2>{{ labels[panel] }}</h2></div><button type="button" aria-label="關閉控制面板" @click="emit('close')"><X :size="20" /></button></div>
          <VacuumCard v-if="panel === 'vacuum'" />
          <LightingCard v-else-if="panel === 'lighting'" />
          <ClimateCard v-else-if="panel === 'climate'" />
          <AtmosphereCard v-else-if="panel === 'scene'" />
          <div v-else class="control-sheet__simple"><p>{{ store.details.curtainName }} <strong>開啟 {{ store.room.curtain }}%</strong></p><label for="sheet-curtain">拖曳窗簾開度</label><input id="sheet-curtain" type="range" min="0" max="100" step="1" :value="store.room.curtain" @input="store.setCurtain(Number(($event.target as HTMLInputElement).value))" @pointerdown="curtainDrag.onPointerDown" @pointermove="curtainDrag.onPointerMove" @pointerup="curtainDrag.onPointerEnd" @pointercancel="curtainDrag.onPointerEnd" /><div class="control-sheet__quick"><button v-for="value in [0, 50, 100]" :key="value" type="button" @click="store.setCurtain(value)">{{ value }}%</button></div></div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
