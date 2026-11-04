<script setup lang="ts">
import { Film, House, LogOut, Moon, Sparkles } from '@lucide/vue'
import { sceneIds, scenePresets, useDashboardStore, type SceneId } from '../stores/dashboard'

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
const emit = defineEmits<{ open: [] }>()
const dashboard = useDashboardStore()
const icons: Record<SceneId, typeof House> = { home: House, movie: Film, sleep: Moon, away: LogOut }
</script>

<template>
  <section class="device-card atmosphere-card" :class="{ 'atmosphere-card--compact': compact }" aria-label="氛圍控制">
    <div class="atmosphere-card__heading"><span class="atmosphere-card__mark"><Sparkles :size="19" /></span><div><h2>氛圍控制</h2><p>{{ dashboard.activeScene ? scenePresets[dashboard.activeScene].label : '自訂氛圍' }}</p></div></div>
    <div class="atmosphere-card__presets" role="group" :aria-label="`${dashboard.details.name}氛圍情境`">
      <button v-for="id in sceneIds" :key="id" type="button" :aria-pressed="dashboard.activeScene === id" @click="dashboard.applyScene(dashboard.state.selectedRoom, id)"><component :is="icons[id]" :size="17" /><span>{{ scenePresets[id].label }}</span></button>
    </div>
    <button v-if="compact" type="button" class="atmosphere-card__open" aria-label="開啟氛圍控制" @click="emit('open')">調整</button>
  </section>
</template>
