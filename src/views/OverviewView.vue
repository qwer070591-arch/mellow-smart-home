<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { Blinds, Lightbulb, Snowflake } from '@lucide/vue'
import RoomViewer from '../components/RoomViewer.vue'
import DeviceSummary from '../components/DeviceSummary.vue'
import LightingCard from '../components/LightingCard.vue'
import AtmosphereCard from '../components/AtmosphereCard.vue'
import ClimateCard from '../components/ClimateCard.vue'
import MobileControlSheet from '../components/MobileControlSheet.vue'
import { useDashboardStore, type DevicePanel } from '../stores/dashboard'
import { useControlCenterStore } from '../stores/controlCenter'

const store = useDashboardStore()
const center = useControlCenterStore()
const panel = ref<DevicePanel | null>(null)
let opener: HTMLElement | null = null
function openPanel(value: DevicePanel) { opener = document.activeElement as HTMLElement; panel.value = value }
async function closePanel() { panel.value = null; await nextTick(); opener?.focus() }
</script>

<template>
  <div class="dashboard-overview">
    <div class="dashboard-overview__top"><div><h2>{{ center.state.name }}</h2></div><span class="dashboard-overview__status"><span></span> 示範設備已就緒</span></div>
    <div class="dashboard-overview__main"><RoomViewer /><DeviceSummary @open="openPanel" /></div>
    <div class="dashboard-overview__section"><h2>裝置控制</h2></div>
    <div class="dashboard-overview__cards"><LightingCard compact @open="openPanel('lighting')" /><AtmosphereCard compact @open="openPanel('scene')" /><ClimateCard compact /></div>
    <div class="dashboard-overview__mobile-actions" aria-label="快捷控制"><button type="button" @click="openPanel('climate')"><Snowflake :size="19" /><span>空調 {{ store.room.targetTemperature }}°</span></button><button type="button" @click="openPanel('curtain')"><Blinds :size="19" /><span>窗簾 {{ store.room.curtain }}%</span></button><button type="button" @click="openPanel('lighting')"><Lightbulb :size="19" /><span>燈光 {{ store.room.brightness }}%</span></button></div>
    <MobileControlSheet :panel="panel" @close="closePanel" />
  </div>
</template>
