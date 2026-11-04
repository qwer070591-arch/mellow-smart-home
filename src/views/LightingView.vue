<script setup lang="ts">
import { Sun, Moon, Film, House, LogOut } from '@lucide/vue'
import { sceneIds, scenePresets, useDashboardStore, type SceneId } from '../stores/dashboard'
import FeatureHeader from '../components/FeatureHeader.vue'
import RoomSelector from '../components/RoomSelector.vue'
import DeviceToggle from '../components/DeviceToggle.vue'
import BubbleBrightnessSlider from '../components/BubbleBrightnessSlider.vue'
import lampOn from '../assets/pendant-lamp.webp'
import lampOff from '../assets/pendant-lamp-off.webp'

const dashboard = useDashboardStore()
const icons: Record<SceneId, typeof House> = { home: House, movie: Film, sleep: Moon, away: LogOut }
</script>

<template>
  <div class="feature-page">
    <FeatureHeader title="智慧燈光" description="依房間調整亮度、色溫與氛圍。"><RoomSelector /></FeatureHeader>
    <div class="feature-grid feature-grid--lighting">
      <section class="feature-card feature-card--lavender" aria-labelledby="lighting-device-title">
        <div class="feature-card__heading"><div><h2 id="lighting-device-title">{{ dashboard.details.name }}燈光</h2><p>{{ dashboard.room.brightness ? '已開啟' : '已關閉' }} · {{ dashboard.room.brightness }}%</p></div><DeviceToggle :checked="dashboard.room.brightness > 0" label-on="關閉燈光" label-off="開啟燈光" @toggle="dashboard.toggleLight()" /></div>
        <div class="feature-lamp" :style="{ '--light-level': dashboard.room.brightness / 100 }" aria-hidden="true"><img :src="lampOff" alt="" /><img class="feature-lamp__on" :src="lampOn" alt="" /></div>
        <BubbleBrightnessSlider :id="`lighting-page-${dashboard.state.selectedRoom}`" :model-value="dashboard.room.brightness" :label="`${dashboard.details.name}燈光亮度`" @update:model-value="dashboard.setBrightness" />
      </section>
      <div class="feature-stack">
        <section class="feature-card"><div class="feature-card__heading"><div><h2>色溫</h2><p>暖白到自然白</p></div><Sun :size="23" /></div><strong class="feature-number">{{ dashboard.room.colorTemp }} <small>K</small></strong><input type="range" min="2700" max="6500" step="100" :value="dashboard.room.colorTemp" :aria-label="`${dashboard.details.name}燈光色溫`" @input="dashboard.setColorTemp(Number(($event.target as HTMLInputElement).value))" /><div class="feature-range-labels"><span>暖白 2700 K</span><span>自然白 6500 K</span></div></section>
        <section class="feature-card"><div class="feature-card__heading"><div><h2>氛圍控制</h2><p>同步調整燈光、窗簾與空調</p></div></div><div class="preset-grid"><button v-for="id in sceneIds" :key="id" type="button" :aria-pressed="dashboard.activeScene === id" @click="dashboard.applyScene(dashboard.state.selectedRoom, id)"><component :is="icons[id]" :size="18" /><strong>{{ scenePresets[id].label }}</strong><small>{{ scenePresets[id].brightness }}% · 窗簾 {{ scenePresets[id].curtain }}%</small></button></div></section>
      </div>
    </div>
    <p class="feature-note">示範控制：亮度與窗簾會同步更新房間照片；照片中的光線仍受原始素材限制。</p>
  </div>
</template>
