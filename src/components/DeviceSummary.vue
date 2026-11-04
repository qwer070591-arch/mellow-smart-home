<script setup lang="ts">
import { Blinds, Lightbulb, Thermometer, Droplets } from '@lucide/vue'
import { useDashboardStore } from '../stores/dashboard'
import { usePointerRange } from '../composables/usePointerRange'

const emit = defineEmits<{ open: [panel: 'curtain'] }>()
const store = useDashboardStore()
const curtainDrag = usePointerRange(0, 100, value => store.setCurtain(value))
const humidity = { living: 48, bedroom: 51, kitchen: 45 }
</script>

<template>
  <aside class="device-summary" aria-label="目前房間設備">
    <div class="device-summary__heading"><div><h2>{{ store.details.name }}</h2></div></div>
    <div class="device-summary__reading"><small>室內環境 <em>模擬數據</em></small><div><span><Thermometer :size="16" /><strong>{{ store.details.actualTemperature.toFixed(1) }}°</strong><small>室溫</small></span><span><Droplets :size="16" /><strong>{{ humidity[store.state.selectedRoom] }}%</strong><small>濕度</small></span></div></div>
    <div class="device-summary__climate"><div><span class="device-summary__icon"><Lightbulb :size="19" /></span><span><small>主要裝置狀態</small><strong>燈光 {{ store.room.brightness }}%</strong></span></div><span class="device-summary__state">空調{{ store.room.climateOn ? '運作中' : '已關閉' }}</span></div>
    <div class="device-summary__divider"></div>
    <div class="device-summary__curtain"><span class="device-summary__icon"><Blinds :size="19" /></span><span><small>{{ store.details.curtainName }}</small><strong>開啟 {{ store.room.curtain }}%</strong></span><button type="button" class="device-summary__edit" @click="emit('open', 'curtain')">調整</button></div>
    <input :id="`curtain-${store.state.selectedRoom}`" type="range" min="0" max="100" step="1" :value="store.room.curtain" :aria-label="`${store.details.name}窗簾開度`" @input="store.setCurtain(Number(($event.target as HTMLInputElement).value))" @pointerdown="curtainDrag.onPointerDown" @pointermove="curtainDrag.onPointerMove" @pointerup="curtainDrag.onPointerEnd" @pointercancel="curtainDrag.onPointerEnd" />
    <div class="device-summary__presets"><button v-for="value in [0, 50, 100]" :key="value" type="button" :aria-pressed="store.room.curtain === value" @click="store.setCurtain(value)">{{ value === 0 ? '全關' : value === 100 ? '全開' : '半開' }}</button></div>
  </aside>
</template>
