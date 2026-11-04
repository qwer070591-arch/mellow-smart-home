<script setup lang="ts">
import { computed } from 'vue'
import { LockKeyhole, LockKeyholeOpen, ShieldCheck, ShieldAlert, Lightbulb, Blinds, Thermometer } from '@lucide/vue'
import { roomDetails, roomIds, useDashboardStore } from '../stores/dashboard'
import { useControlCenterStore } from '../stores/controlCenter'
import FeatureHeader from '../components/FeatureHeader.vue'
import DeviceToggle from '../components/DeviceToggle.vue'

const dashboard = useDashboardStore()
const center = useControlCenterStore()
const securityEvents = computed(() => center.state.notifications.filter(item => item.message.includes('門鎖') || item.message.includes('安全模式')).slice(0, 5))
</script>

<template>
  <div class="feature-page">
    <FeatureHeader title="安全監控" description="門鎖與安全事件僅儲存在本機，沒有連接真實感測器。" />
    <div class="feature-grid">
      <section class="feature-card feature-card--lavender"><div class="feature-card__heading"><div><h2>門鎖狀態</h2><p>玄關</p></div><component :is="center.state.doorLocked ? LockKeyhole : LockKeyholeOpen" :size="28" /></div><strong class="security-state">{{ center.state.doorLocked ? '已上鎖' : '已解鎖' }}</strong><p>此操作只會更新畫面與本機紀錄。</p><DeviceToggle :checked="center.state.doorLocked" label-on="解鎖門鎖" label-off="鎖上門鎖" @toggle="center.setDoorLocked(!center.state.doorLocked)" /></section>
      <section class="feature-card"><div class="feature-card__heading"><div><h2>安全模式</h2><p>離家模式會同步鎖上門鎖</p></div><component :is="center.state.securityMode === 'home' ? ShieldCheck : ShieldAlert" :size="27" /></div><div class="segmented-control" role="group" aria-label="安全模式"><button type="button" :aria-pressed="center.state.securityMode === 'home'" @click="center.setSecurityMode('home')">在家</button><button type="button" :aria-pressed="center.state.securityMode === 'away'" @click="center.setSecurityMode('away')">離家</button></div><p class="feature-note">安全模式只更新本機狀態，不會監控真實住家或發送手機推播。</p></section>
    </div>
    <section class="feature-card"><div class="feature-card__heading"><div><h2>房間裝置狀態</h2><p>資料與首頁同步</p></div></div><div class="status-grid"><div v-for="id in roomIds" :key="id" class="status-tile"><h3>{{ roomDetails[id].name }}</h3><span><Lightbulb :size="17" />燈光 {{ dashboard.state.rooms[id].brightness }}%</span><span><Blinds :size="17" />窗簾 {{ dashboard.state.rooms[id].curtain }}%</span><span><Thermometer :size="17" />空調 {{ dashboard.state.rooms[id].climateOn ? `${dashboard.state.rooms[id].targetTemperature}°C` : '關閉' }}</span></div></div></section>
    <section class="feature-card"><h2>安全事件</h2><div v-if="!securityEvents.length" class="feature-empty">尚無事件紀錄</div><ol v-else class="event-list"><li v-for="notice in securityEvents" :key="notice.id"><span>{{ notice.message }}</span><time :datetime="notice.createdAt">{{ new Date(notice.createdAt).toLocaleString('zh-TW') }}</time></li></ol></section>
  </div>
</template>
