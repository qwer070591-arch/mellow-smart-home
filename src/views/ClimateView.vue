<script setup lang="ts">
import { computed } from 'vue'
import { Droplets, Thermometer, Wind } from '@lucide/vue'
import { environmentHistory } from '../data/mock'
import { useDashboardStore } from '../stores/dashboard'
import FeatureHeader from '../components/FeatureHeader.vue'
import RoomSelector from '../components/RoomSelector.vue'
import ClimateCard from '../components/ClimateCard.vue'

const dashboard = useDashboardStore()
const humidity = { living: 48, bedroom: 51, kitchen: 45 }
const offset = computed(() => dashboard.details.actualTemperature - 26.3)
const chart = computed(() => environmentHistory.map((point, index) => ({
  x: 30 + index * 51.6,
  y: 165 - ((point.temperature + offset.value - 24) / 6) * 130,
})))
const path = computed(() => chart.value.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' '))
</script>

<template>
  <div class="feature-page">
    <FeatureHeader title="溫度管理" description="各房間獨立設定空調與查看室內環境。"><RoomSelector /></FeatureHeader>
    <div class="feature-grid">
      <ClimateCard />
      <div class="feature-stack">
        <section class="feature-card"><div class="feature-card__heading"><div><h2>{{ dashboard.details.name }}環境</h2></div></div><div class="environment-readings"><div><Thermometer :size="20" /><strong>{{ dashboard.details.actualTemperature.toFixed(1) }}°C</strong><span>室溫</span></div><div><Droplets :size="20" /><strong>{{ humidity[dashboard.state.selectedRoom] }}%</strong><span>濕度</span></div><div><Wind :size="20" /><strong>{{ dashboard.room.climateOn ? '運作中' : '已關閉' }}</strong><span>空調</span></div></div></section>
        <section class="feature-card"><div class="feature-card__heading"><div><h2>24 小時趨勢</h2></div></div><svg class="feature-chart" viewBox="0 0 680 200" role="img" :aria-label="`${dashboard.details.name} 24 小時溫度趨勢`"><path v-for="y in [35, 100, 165]" :key="y" :d="`M30 ${y} H650`" class="feature-chart__grid" /><path :d="path" class="feature-chart__line" /><circle v-for="(point, index) in chart" :key="index" :cx="point.x" :cy="point.y" r="3" class="feature-chart__dot" /></svg><div class="feature-range-labels"><span>00:00</span><span>12:00</span><span>24:00</span></div></section>
      </div>
    </div>
    <p class="feature-note">目標溫度限 16–30°C；室溫與濕度為展示資料，不會隨空調立即變化。</p>
  </div>
</template>
