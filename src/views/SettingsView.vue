<script setup lang="ts">
import { ref } from 'vue'
import { RotateCcw, Save, SunMoon } from '@lucide/vue'
import { roomDetails, roomIds, useDashboardStore } from '../stores/dashboard'
import { useHomeStore } from '../stores/home'
import { useControlCenterStore } from '../stores/controlCenter'
import FeatureHeader from '../components/FeatureHeader.vue'

const dashboard = useDashboardStore()
const home = useHomeStore()
const center = useControlCenterStore()
const draftName = ref(center.state.name)
const saved = ref(false)
function saveName() { center.setName(draftName.value); draftName.value = center.state.name; saved.value = true }
function resetAll() {
  if (!window.confirm('確定恢復所有預設設定？房間、排程與通知將重設。')) return
  dashboard.reset()
  center.reset()
  home.reset()
  draftName.value = center.state.name
  saved.value = false
}
</script>

<template>
  <div class="feature-page">
    <FeatureHeader title="設定" description="調整介面與裝置偏好；設定儲存在這台裝置的瀏覽器。" />
    <div class="feature-grid">
      <section class="feature-card"><div class="feature-card__heading"><div><h2>個人化</h2><p>顯示名稱與開啟時的房間</p></div></div><form class="settings-form" @submit.prevent="saveName"><label>家庭名稱<input v-model="draftName" type="text" maxlength="32" autocomplete="off" /></label><button class="primary-button" type="submit"><Save :size="17" />儲存名稱</button><span v-if="saved" role="status">已儲存</span></form><label class="settings-form__row">目前房間<select :value="dashboard.state.selectedRoom" @change="dashboard.selectRoom(($event.target as HTMLSelectElement).value as typeof dashboard.state.selectedRoom)"><option v-for="id in roomIds" :key="id" :value="id">{{ roomDetails[id].name }}</option></select></label></section>
      <section class="feature-card"><div class="feature-card__heading"><div><h2>介面</h2><p>與房間照片時段獨立</p></div><SunMoon :size="25" /></div><div class="segmented-control" role="group" aria-label="介面主題"><button type="button" :aria-pressed="home.theme === 'light'" @click="home.setTheme('light')">淺色</button><button type="button" :aria-pressed="home.theme === 'dark'" @click="home.setTheme('dark')">深色</button></div><p class="feature-note">切換黑白介面不會改變夜間房間照片或燈光數值。</p></section>
      <section class="feature-card"><h2>裝置偏好</h2><label class="settings-form__row">音效音量 <strong>{{ center.state.musicVolume }}%</strong><input type="range" min="0" max="100" step="1" :value="center.state.musicVolume" aria-label="預設音效音量" @input="center.setVolume(Number(($event.target as HTMLInputElement).value))" /></label><p class="feature-note">每個房間的燈光、窗簾與空調設定會自動保存。</p></section>
      <section class="feature-card"><h2>資料與限制</h2><p class="feature-note">此網站沒有後端、真實 IoT 連線、攝影機或手機推播。排程只在網站開啟時執行；環境趨勢不是真實感測歷史。</p><button type="button" class="danger-button" @click="resetAll"><RotateCcw :size="17" />恢復預設值</button></section>
    </div>
  </div>
</template>
