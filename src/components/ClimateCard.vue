<script setup lang="ts">
import { computed, ref } from 'vue'
import { Minus, Plus } from '@lucide/vue'
import { useDashboardStore } from '../stores/dashboard'
import DeviceToggle from './DeviceToggle.vue'

const props = withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
const store = useDashboardStore()
const dialSvg = ref<SVGSVGElement | null>(null)
const dragging = ref(false)
const titleId = computed(() => `climate-card-${props.compact ? 'overview' : 'sheet'}`)
const progress = computed(() => (store.room.targetTemperature - 16) / 14)
const ticks = Array.from({ length: 15 }, (_, index) => {
  const angle = (150 + index * 240 / 14) * Math.PI / 180
  return {
    x1: 150 + 129 * Math.cos(angle), y1: 150 + 129 * Math.sin(angle),
    x2: 150 + (index % 2 === 0 ? 137 : 134) * Math.cos(angle),
    y2: 150 + (index % 2 === 0 ? 137 : 134) * Math.sin(angle),
  }
})
const handle = computed(() => {
  const angle = (150 + progress.value * 240) * Math.PI / 180
  return { x: 150 + 115 * Math.cos(angle), y: 150 + 115 * Math.sin(angle) }
})
const status = computed(() => {
  if (!store.room.climateOn) return '空調已關閉'
  return store.room.targetTemperature < store.details.actualTemperature ? '製冷中' : '維持設定溫度'
})

function setFromPointer(event: PointerEvent) {
  if (!store.room.climateOn || !dialSvg.value) return
  const matrix = dialSvg.value.getScreenCTM()
  if (!matrix) return
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
  let angle = Math.atan2(point.y - 150, point.x - 150) * 180 / Math.PI
  if (angle < 150) angle += 360
  const fraction = (Math.max(150, Math.min(390, angle)) - 150) / 240
  store.setClimate({ target: Math.round(16 + fraction * 14) })
}

function onPointerDown(event: PointerEvent) {
  if (!store.room.climateOn || (event.pointerType === 'mouse' && event.button !== 0)) return
  event.preventDefault()
  dragging.value = true
  ;(event.currentTarget as SVGPathElement).setPointerCapture(event.pointerId)
  setFromPointer(event)
}
function onPointerMove(event: PointerEvent) { if (dragging.value) setFromPointer(event) }
function onPointerEnd(event: PointerEvent) {
  dragging.value = false
  const path = event.currentTarget as SVGPathElement
  if (path.hasPointerCapture(event.pointerId)) path.releasePointerCapture(event.pointerId)
}
function onKeydown(event: KeyboardEvent) {
  if (!store.room.climateOn) return
  const target = store.room.targetTemperature
  const next: Record<string, number> = {
    ArrowLeft: target - 1, ArrowDown: target - 1, ArrowRight: target + 1, ArrowUp: target + 1,
    PageDown: target - 2, PageUp: target + 2, Home: 16, End: 30,
  }
  if (!(event.key in next)) return
  event.preventDefault()
  store.setClimate({ target: next[event.key] })
}
</script>

<template>
  <section class="device-card climate-card" :class="{ 'climate-card--off': !store.room.climateOn, 'climate-card--compact': compact }" :aria-labelledby="titleId">
    <div class="device-card__top climate-card__top">
      <div><h2 :id="titleId">室內溫度</h2><p>目前室溫 {{ store.details.actualTemperature.toFixed(1) }}°C · {{ status }}</p></div>
      <DeviceToggle :checked="store.room.climateOn" label-on="關閉空調" label-off="開啟空調" @toggle="store.setClimate({ on: !store.room.climateOn })" />
    </div>
    <div class="climate-card__body">
      <div class="climate-card__dial" :class="{ 'climate-card__dial--dragging': dragging }">
        <svg ref="dialSvg" viewBox="0 0 300 240" aria-hidden="false">
          <g class="climate-card__ticks" aria-hidden="true"><line v-for="(tick, index) in ticks" :key="index" :class="{ 'is-active': index / 14 <= progress }" :x1="tick.x1" :y1="tick.y1" :x2="tick.x2" :y2="tick.y2" /></g>
          <path class="climate-card__track" d="M50.4 207.5 A115 115 0 1 1 249.6 207.5" />
          <path class="climate-card__progress" d="M50.4 207.5 A115 115 0 1 1 249.6 207.5" pathLength="100" :style="{ strokeDasharray: `${progress * 100} 100` }" />
          <path class="climate-card__hit" d="M50.4 207.5 A115 115 0 1 1 249.6 207.5" role="slider" tabindex="0" aria-label="目標溫度" aria-valuemin="16" aria-valuemax="30" :aria-valuenow="store.room.targetTemperature" :aria-valuetext="`${store.room.targetTemperature} 度`" :aria-disabled="!store.room.climateOn" @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerEnd" @pointercancel="onPointerEnd" @keydown="onKeydown" />
          <circle class="climate-card__handle" :cx="handle.x" :cy="handle.y" r="8" aria-hidden="true" />
        </svg>
        <div class="climate-card__center" aria-hidden="true"><span>{{ store.room.climateOn ? '目標溫度' : '空調狀態' }}</span><strong>{{ store.room.climateOn ? `${store.room.targetTemperature}°` : 'OFF' }}</strong></div>
        <span class="climate-card__minimum">16°</span><span class="climate-card__maximum">30°</span>
      </div>
      <div class="climate-card__actual"><span>目前室溫</span><strong>{{ store.details.actualTemperature.toFixed(1) }}°C</strong><span>{{ status }}</span></div>
    </div>
    <div class="climate-card__adjust">
      <button type="button" aria-label="降低目標溫度" :disabled="!store.room.climateOn || store.room.targetTemperature <= 16" @click="store.setClimate({ target: store.room.targetTemperature - 1 })"><Minus :size="17" /></button>
      <span>設定範圍 16–30°C</span>
      <button type="button" aria-label="提高目標溫度" :disabled="!store.room.climateOn || store.room.targetTemperature >= 30" @click="store.setClimate({ target: store.room.targetTemperature + 1 })"><Plus :size="17" /></button>
    </div>
  </section>
</template>
