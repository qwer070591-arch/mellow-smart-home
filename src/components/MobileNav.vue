<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { LayoutDashboard, Thermometer, Menu, ShieldCheck, Bell, CalendarClock, Settings2, X } from '@lucide/vue'

const route = useRoute()
const expanded = ref(false)
watch(() => route.path, () => { expanded.value = false })
const primary = [
  { to: '/', label: '首頁', icon: LayoutDashboard },
  { to: '/climate', label: '溫控', icon: Thermometer },
  { to: '/schedules', label: '排程', icon: CalendarClock },
]
const more = [
  { to: '/security', label: '安全', icon: ShieldCheck },
  { to: '/notifications', label: '通知', icon: Bell },
  { to: '/settings', label: '設定', icon: Settings2 },
]
</script>

<template>
  <nav class="mobile-global-nav" aria-label="手機主要導覽">
    <RouterLink v-for="item in primary" :key="item.to" :to="item.to" active-class="is-active" :exact-active-class="'is-active'"><component :is="item.icon" :size="19" /><span>{{ item.label }}</span></RouterLink>
    <button type="button" :aria-expanded="expanded" aria-controls="mobile-more-menu" @click="expanded = !expanded"><X v-if="expanded" :size="19" /><Menu v-else :size="19" /><span>更多</span></button>
  </nav>
  <div v-if="expanded" id="mobile-more-menu" class="mobile-more-menu" role="group" aria-label="更多功能">
    <RouterLink v-for="item in more" :key="item.to" :to="item.to"><component :is="item.icon" :size="19" />{{ item.label }}</RouterLink>
  </div>
</template>
