<script setup lang="ts">
import { Battery, Clock3, Pause, Play, RotateCcw } from '@lucide/vue'
import { useDashboardStore } from '../stores/dashboard'

defineProps<{ compact?: boolean }>()
const emit = defineEmits<{ open: [] }>()
const store = useDashboardStore()
</script>

<template>
  <section class="device-card vacuum-card" aria-labelledby="vacuum-title">
    <div class="device-card__top"><div><span class="eyebrow">SMART CLEANING</span><h2 id="vacuum-title">智慧清掃</h2><p>{{ store.state.vacuum.running ? '正在清掃中' : store.state.vacuum.progress === 100 ? '清掃已完成' : '待命中 · 示範設備' }}</p></div><button type="button" class="device-card__action" :aria-label="store.state.vacuum.running ? '暫停清掃' : '開始清掃'" @click="store.toggleVacuum()"><Pause v-if="store.state.vacuum.running" :size="18" fill="currentColor" /><Play v-else :size="18" fill="currentColor" /></button></div>
    <div class="vacuum-card__body"><div class="vacuum-illustration" aria-hidden="true"><span class="vacuum-illustration__top"></span><span class="vacuum-illustration__center"></span></div><div class="vacuum-card__progress"><span>清掃進度</span><strong>{{ store.state.vacuum.progress }}%</strong><div class="progress-track"><span :style="{ width: `${store.state.vacuum.progress}%` }"></span></div></div></div>
    <div class="device-card__foot"><span><Battery :size="16" /> {{ store.state.vacuum.battery }}% 電量</span><span><Clock3 :size="16" /> {{ store.state.vacuum.nextCleaning }} 下次清掃</span><button type="button" class="device-card__more" @click="emit('open')"><RotateCcw :size="15" /> 設定</button></div>
    <div v-if="!compact" class="vacuum-card__settings"><label for="vacuum-time">下次清掃時間</label><input id="vacuum-time" type="time" :value="store.state.vacuum.nextCleaning" @change="store.setVacuumTime(($event.target as HTMLInputElement).value)" /><p>此為模擬排程；網頁不會在背景啟動真實掃地機器人。</p></div>
  </section>
</template>
