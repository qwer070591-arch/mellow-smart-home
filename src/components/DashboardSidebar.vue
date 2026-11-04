<script setup lang="ts">
import { LayoutDashboard, Thermometer, ShieldCheck, Bell, Settings2, CalendarClock } from '@lucide/vue'
import { useControlCenterStore } from '../stores/controlCenter'

const center = useControlCenterStore()
const items = [
  { label: '首頁', icon: LayoutDashboard, to: '/' },
  { label: '溫度', icon: Thermometer, to: '/climate' },
  { label: '安全', icon: ShieldCheck, to: '/security' },
  { label: '通知', icon: Bell, to: '/notifications' },
  { label: '排程', icon: CalendarClock, to: '/schedules' },
  { label: '設定', icon: Settings2, to: '/settings' },
]
</script>

<template>
  <aside class="dashboard-sidebar" aria-label="功能導覽">
    <RouterLink to="/" class="dashboard-sidebar__brand" aria-label="mellow. 首頁">
      <svg viewBox="0 0 40 40" width="30" height="30" fill="none" aria-hidden="true">
        <path d="M6 28V17.5C6 13.9 8.6 11 12 11s6 2.9 6 6.5V28M18 28V17.5C18 13.9 20.6 11 24 11s6 2.9 6 6.5V28" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" />
        <circle cx="35" cy="27" r="2" fill="currentColor" />
      </svg>
    </RouterLink>
    <nav aria-label="主要導覽">
      <RouterLink v-for="item in items" :key="item.to" :to="item.to" :aria-label="item.label" :title="item.label" active-class="is-active" :exact-active-class="'is-active'"><component :is="item.icon" :size="21" /><span v-if="item.to === '/notifications' && center.unreadCount" class="dashboard-sidebar__badge">{{ center.unreadCount }}</span></RouterLink>
    </nav>
  </aside>
</template>
