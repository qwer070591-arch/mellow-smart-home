<script setup lang="ts">
import { computed } from 'vue'
import pendantLamp from '../assets/pendant-lamp.webp'
import pendantLampOff from '../assets/pendant-lamp-off.webp'
import { useDashboardStore } from '../stores/dashboard'
import DeviceToggle from './DeviceToggle.vue'
import BubbleBrightnessSlider from './BubbleBrightnessSlider.vue'

const props = withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
const emit = defineEmits<{ open: [] }>()
const store = useDashboardStore()
const titleId = computed(() => props.compact ? 'lighting-title-card' : 'lighting-title-sheet')
</script>

<template>
  <section class="device-card lighting-card" :aria-labelledby="titleId">
    <div class="device-card__top">
      <div><h2 :id="titleId">智慧燈光</h2><p>{{ store.details.name }} · {{ store.room.brightness ? '已開啟' : '已關閉' }}</p></div>
      <DeviceToggle :checked="store.room.brightness > 0" label-on="關閉燈光" label-off="開啟燈光" @toggle="store.toggleLight()" />
    </div>
    <div class="lighting-card__body" :style="{ '--light-level': store.room.brightness / 100 }">
      <div class="lighting-product" aria-hidden="true"><span class="lighting-product__glow"></span><img :src="pendantLampOff" alt="" width="560" height="520" /><img class="lighting-product__lamp--on" :src="pendantLamp" alt="" width="560" height="520" /></div>
    </div>
    <div class="lighting-card__slider">
      <BubbleBrightnessSlider :id="`brightness-${store.state.selectedRoom}-${props.compact ? 'card' : 'sheet'}`" :model-value="store.room.brightness" :label="`${store.details.name}燈光亮度`" @update:model-value="store.setBrightness" />
      <button type="button" class="device-card__more" @click="emit('open')">詳細控制</button>
    </div>
  </section>
</template>
