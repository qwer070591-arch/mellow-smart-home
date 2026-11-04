<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Moon, Sun } from '@lucide/vue'
import { useHomeStore } from './stores/home'
import { useDashboardStore } from './stores/dashboard'
import { useControlCenterStore } from './stores/controlCenter'
import DashboardSidebar from './components/DashboardSidebar.vue'
import AlarmCenter from './components/AlarmCenter.vue'
import MobileNav from './components/MobileNav.vue'

const home = useHomeStore()
const dashboard = useDashboardStore()
const center = useControlCenterStore()
const now = ref(new Date())
let clockTimer: ReturnType<typeof setInterval> | undefined
let demoTimer: ReturnType<typeof setInterval> | undefined
function tick() { now.value = new Date(); home.checkRoutines(now.value); center.checkSchedules(now.value) }
const time = computed(() => new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', hour: '2-digit', minute: '2-digit', hour12: false }).format(now.value))
onMounted(() => { tick(); clockTimer = setInterval(tick, 30_000); demoTimer = setInterval(() => dashboard.tickDemo(), 1_000); document.addEventListener('visibilitychange', tick) })
onBeforeUnmount(() => { clearInterval(clockTimer); clearInterval(demoTimer); document.removeEventListener('visibilitychange', tick) })
</script>

<template>
  <div class="living-page">
    <DashboardSidebar />
    <header class="living-header">
      <RouterLink to="/" class="living-brand" aria-label="mellow. 首頁">mellow<span>.</span><small>智慧生活</small></RouterLink>
      <div class="header-clock"><AlarmCenter /><button class="theme-toggle" type="button" :aria-label="home.theme === 'light' ? '切換至深色介面' : '切換至淺色介面'" :aria-pressed="home.theme === 'dark'" @click="home.setTheme(home.theme === 'light' ? 'dark' : 'light')"><Moon v-if="home.theme === 'light'" :size="19" /><Sun v-else :size="19" /></button><time :datetime="now.toISOString()">{{ time }}</time></div>
    </header>
    <main class="living-main"><RouterView /></main>
    <MobileNav />
    <div v-if="home.toast" class="toast" role="status">{{ home.toast }}</div>
    <div v-if="home.storageError || dashboard.storageError || center.storageError" class="storage-error" role="alert">瀏覽器無法儲存目前的設定。</div>
  </div>
</template>
